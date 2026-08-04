import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const client = new SecretsManagerClient({});

// Cache em memoria durante o tempo de vida do execution environment do
// Lambda (containers "quentes" reutilizam isso entre invocacoes, evitando
// uma chamada ao Secrets Manager por requisicao).
const cache = new Map<string, string>();

export async function getSecretString(secretId: string): Promise<string> {
    const cached = cache.get(secretId);
    if (cached) return cached;

    const response = await client.send(new GetSecretValueCommand({ SecretId: secretId }));
    if (!response.SecretString) {
        throw new Error(`Secret ${secretId} has no SecretString.`);
    }

    cache.set(secretId, response.SecretString);
    return response.SecretString;
}

export async function getSecretJson<T>(secretId: string): Promise<T> {
    const raw = await getSecretString(secretId);
    return JSON.parse(raw) as T;
}
