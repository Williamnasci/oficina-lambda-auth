import type { APIGatewayRequestAuthorizerEventV2 } from 'aws-lambda';

jest.mock('../src/jwt');

import { handler } from '../src/auth-authorizer';
import { verifyAuthToken } from '../src/jwt';

const mockedVerify = verifyAuthToken as jest.MockedFunction<typeof verifyAuthToken>;

function makeEvent(authorization?: string): APIGatewayRequestAuthorizerEventV2 {
    return { headers: authorization ? { authorization } : {} } as APIGatewayRequestAuthorizerEventV2;
}

describe('auth-authorizer handler', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('denies when there is no Authorization header', async () => {
        const result = await handler(makeEvent());
        expect(result.isAuthorized).toBe(false);
        expect(mockedVerify).not.toHaveBeenCalled();
    });

    it('denies when the header is not a Bearer token', async () => {
        const result = await handler(makeEvent('Basic abc123'));
        expect(result.isAuthorized).toBe(false);
    });

    it('denies when the token fails verification', async () => {
        mockedVerify.mockRejectedValue(new Error('jwt expired'));
        const result = await handler(makeEvent('Bearer bad-token'));
        expect(result.isAuthorized).toBe(false);
        expect(result.context?.errorMessage).toBe('jwt expired');
    });

    it('authorizes and forwards claims when the token is valid', async () => {
        mockedVerify.mockResolvedValue({ sub: 'c1', document: '52998224725' });
        const result = await handler(makeEvent('Bearer good-token'));
        expect(result.isAuthorized).toBe(true);
        expect(result.context).toEqual({ sub: 'c1', document: '52998224725' });
    });
});
