import { getSecretString } from './secrets';

export type LoginCustomer = { id: string; document: string; isActive: boolean };

export async function lookupCustomer(document: string): Promise<LoginCustomer | null> {
    const source = process.env.AUTH_CUSTOMER_SOURCE ?? 'legacy';
    if (source === 'legacy') return (await import('./db')).findCustomerByDocument(document);
    if (source !== 'os-api') throw new Error('Invalid AUTH_CUSTOMER_SOURCE');

    const endpoint = new URL(process.env.OS_BASE_URL ?? '');
    if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password || endpoint.search || endpoint.hash) {
        throw new Error('OS_BASE_URL must be an HTTPS URL without credentials, query or fragment');
    }
    const secretId = process.env.OS_AUTH_LOOKUP_SECRET_ID;
    if (!secretId) throw new Error('OS_AUTH_LOOKUP_SECRET_ID is required');
    const token = await getSecretString(secretId);
    if (token.length < 32) throw new Error('OS lookup token is too short');
    const response = await fetch(endpoint.href.replace(/\/$/, '') + '/internal/auth/customers/lookup', {
        method: 'POST', redirect: 'error', signal: AbortSignal.timeout(3000),
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ document }),
    });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error('OS lookup failed: ' + response.status);
    const result = await response.json() as Partial<LoginCustomer & { documentType: string }> | null;
    if (!result || typeof result.id !== 'string' || !result.id || result.document !== document || result.documentType !== 'CPF' || typeof result.isActive !== 'boolean') {
        throw new Error('Invalid OS customer response');
    }
    return { id: result.id, document, isActive: result.isActive };
}
