import jwt from 'jsonwebtoken';
import { getSecretString } from './secrets';

export type AuthTokenPayload = {
    sub: string; // customer.id
    document: string;
};

async function getJwtSecret(): Promise<string> {
    const secretId = process.env.JWT_SECRET_ID;
    if (!secretId) throw new Error('JWT_SECRET_ID nao configurado.');
    return getSecretString(secretId);
}

export async function signAuthToken(payload: AuthTokenPayload): Promise<string> {
    const secret = await getJwtSecret();
    const expiresIn = process.env.JWT_EXPIRES_IN ?? '1d';
    return jwt.sign(payload, secret, { algorithm: 'HS256', expiresIn } as jwt.SignOptions);
}

export async function verifyAuthToken(token: string): Promise<AuthTokenPayload> {
    const secret = await getJwtSecret();
    return jwt.verify(token, secret, { algorithms: ['HS256'] }) as AuthTokenPayload;
}
