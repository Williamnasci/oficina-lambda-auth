import type { APIGatewayProxyEventV2 } from 'aws-lambda';

jest.mock('../src/db');
jest.mock('../src/jwt');

import { handler } from '../src/auth-login';
import { findCustomerByDocument } from '../src/db';
import { signAuthToken } from '../src/jwt';

const mockedFindCustomer = findCustomerByDocument as jest.MockedFunction<typeof findCustomerByDocument>;
const mockedSignAuthToken = signAuthToken as jest.MockedFunction<typeof signAuthToken>;

function makeEvent(body: unknown): APIGatewayProxyEventV2 {
    return { body: JSON.stringify(body) } as APIGatewayProxyEventV2;
}

describe('auth-login handler', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('returns 400 for an invalid CPF', async () => {
        const result = await handler(makeEvent({ document: '123' }));
        expect(result.statusCode).toBe(400);
        expect(mockedFindCustomer).not.toHaveBeenCalled();
    });

    it('returns 400 when body is not valid JSON', async () => {
        const result = await handler({ body: '{not json' } as APIGatewayProxyEventV2);
        expect(result.statusCode).toBe(400);
    });

    it('returns 404 when customer does not exist', async () => {
        mockedFindCustomer.mockResolvedValue(null);
        const result = await handler(makeEvent({ document: '529.982.247-25' }));
        expect(result.statusCode).toBe(404);
    });

    it('returns 403 when customer is inactive', async () => {
        mockedFindCustomer.mockResolvedValue({
            id: 'c1',
            name: 'Jane',
            document: '52998224725',
            documentType: 'CPF',
            isActive: false,
        });
        const result = await handler(makeEvent({ document: '529.982.247-25' }));
        expect(result.statusCode).toBe(403);
    });

    it('returns 200 with an access_token for a valid, active customer', async () => {
        mockedFindCustomer.mockResolvedValue({
            id: 'c1',
            name: 'Jane',
            document: '52998224725',
            documentType: 'CPF',
            isActive: true,
        });
        mockedSignAuthToken.mockResolvedValue('signed-token');

        const result = await handler(makeEvent({ document: '529.982.247-25' }));

        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body as string)).toEqual({ access_token: 'signed-token' });
        expect(mockedSignAuthToken).toHaveBeenCalledWith({ sub: 'c1', document: '52998224725' });
    });

    it('returns 502 when the database lookup fails', async () => {
        mockedFindCustomer.mockRejectedValue(new Error('connection refused'));
        const result = await handler(makeEvent({ document: '529.982.247-25' }));
        expect(result.statusCode).toBe(502);
    });
});
