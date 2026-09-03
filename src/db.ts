import { Pool } from 'pg';
import { getSecretJson } from './secrets';
import { RDS_CA_BUNDLE } from './rds-ca-bundle';

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

let poolPromise: Promise<Pool> | null = null;

async function getPool(): Promise<Pool> {
    if (!poolPromise) {
        poolPromise = (async () => {
            const secretId = process.env.DB_SECRET_ID;
            if (!secretId) throw new Error('DB_SECRET_ID nao configurado.');

            const { url } = await getSecretJson<DbCredentials>(secretId);

            const cleanUrl = url.replace(/[?&]sslmode=require\b/, '');

            return new Pool({
                connectionString: cleanUrl,
                ssl: { ca: RDS_CA_BUNDLE, rejectUnauthorized: true },
                max: 2,
                connectionTimeoutMillis: 5000,
            });
        })().catch((err) => {
            poolPromise = null;
            throw err;
        });
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
