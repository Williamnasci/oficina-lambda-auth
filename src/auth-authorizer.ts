import type { APIGatewaySimpleAuthorizerWithContextResult, APIGatewayRequestAuthorizerEventV2 } from 'aws-lambda';
import { verifyAuthToken, type AuthTokenPayload } from './jwt';

type AuthContext = Partial<AuthTokenPayload> & { errorMessage?: string };

function deny(errorMessage: string): APIGatewaySimpleAuthorizerWithContextResult<AuthContext> {
    return { isAuthorized: false, context: { errorMessage } };
}

// Lambda Authorizer (tipo REQUEST) anexado as rotas protegidas do API
// Gateway (ver docs/adr/0004-api-gateway-roteamento.md no oficina-api). O
// token e assinado com HS256 por auth-login.ts, entao HTTP API's authorizer
// nativo tipo "JWT" (que exige um issuer OIDC/JWKS) nao se aplica aqui.
export async function handler(
    event: APIGatewayRequestAuthorizerEventV2,
): Promise<APIGatewaySimpleAuthorizerWithContextResult<AuthContext>> {
    const header = event.headers?.authorization ?? event.headers?.Authorization;

    if (!header?.startsWith('Bearer ')) {
        return deny('Missing or malformed Authorization header.');
    }

    const token = header.slice('Bearer '.length);

    try {
        const payload = await verifyAuthToken(token);
        return { isAuthorized: true, context: { sub: payload.sub, document: payload.document } };
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Invalid token.';
        return deny(message);
    }
}
