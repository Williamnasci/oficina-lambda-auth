import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { isValidCpf, normalizeCpf } from './cpf';
import { findCustomerByDocument } from './db';
import { signAuthToken } from './jwt';

function json(statusCode: number, body: unknown): APIGatewayProxyStructuredResultV2 {
    return {
        statusCode,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    };
}

// POST /auth/login { document: string } -> { access_token: string }
// Implementa o requisito do PDF: validar CPF, consultar existencia/status do
// cliente, gerar e devolver um JWT. Ver docs/rfc/0003-estrategia-de-autenticacao.md
// no oficina-api sobre por que isso e uma Lambda propria e nao Cognito.
export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
    let document: unknown;
    try {
        const parsed = JSON.parse(event.body ?? '{}');
        document = parsed.document;
    } catch {
        return json(400, { message: 'Invalid JSON body.' });
    }

    if (typeof document !== 'string' || !isValidCpf(document)) {
        return json(400, { message: 'Invalid CPF.' });
    }

    const normalized = normalizeCpf(document);

    let customer;
    try {
        customer = await findCustomerByDocument(normalized);
    } catch (err) {
        console.error('DB error while looking up customer', err);
        return json(502, { message: 'Could not reach the customer database.' });
    }

    if (!customer) {
        return json(404, { message: 'Customer not found.' });
    }

    if (!customer.isActive) {
        return json(403, { message: 'Customer is inactive.' });
    }

    const access_token = await signAuthToken({ sub: customer.id, document: customer.document });

    return json(200, { access_token });
}
