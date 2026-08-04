import { Pool } from 'pg';
import { getSecretJson } from './secrets';

type DbCredentials = {
    url: string;
};

export type Customer = {
    id: string;
    name: string;
    document: string;
    documentType: 'CPF' | 'CNPJ';
    isActive: boolean;
};

// Pool em modulo-level: reaproveitado entre invocacoes no mesmo execution
// environment do Lambda, como o db.ts do oficina-api reaproveita o
// PrismaClient. Criado sob demanda (nao no cold start) porque precisa do
// segredo do Secrets Manager, que e assincrono.
let poolPromise: Promise<Pool> | null = null;

async function getPool(): Promise<Pool> {
    if (!poolPromise) {
        poolPromise = (async () => {
            const secretId = process.env.DB_SECRET_ID;
            if (!secretId) throw new Error('DB_SECRET_ID nao configurado.');

            const { url } = await getSecretJson<DbCredentials>(secretId);

            // node-postgres trata "sslmode=require" na connection string como
            // alias de "verify-full", o que falha contra o certificado da AWS
            // RDS (nao e uma CA publica). Mesmo problema e mesma correcao do
            // PrismaService no oficina-api: remover da URL e configurar SSL
            // explicitamente.
            const cleanUrl = url.replace(/[?&]sslmode=require\b/, '');

            return new Pool({
                connectionString: cleanUrl,
                ssl: { rejectUnauthorized: false },
                max: 2,
                connectionTimeoutMillis: 5000,
            });
        })();
    }
    return poolPromise;
}

export async function findCustomerByDocument(document: string): Promise<Customer | null> {
    const pool = await getPool();
    const result = await pool.query<Customer>(
        'SELECT id, name, document, "documentType", "isActive" FROM "Customer" WHERE document = $1 LIMIT 1',
        [document],
    );
    return result.rows[0] ?? null;
}
