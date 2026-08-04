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
            // RDS (nao e uma CA publica conhecida por padrao). Correcao: tirar
            // da URL e fornecer o bundle oficial de CA da AWS via `ca`,
            // mantendo rejectUnauthorized: true (valida a identidade do
            // servidor de verdade, nao so criptografa a conexao).
            const cleanUrl = url.replace(/[?&]sslmode=require\b/, '');

            return new Pool({
                connectionString: cleanUrl,
                ssl: { ca: RDS_CA_BUNDLE, rejectUnauthorized: true },
                max: 2,
                connectionTimeoutMillis: 5000,
            });
        })().catch((err) => {
            // Sem isso, uma falha transitoria (ex: throttle do Secrets Manager,
            // hiccup de rede) ficaria cacheada como Promise rejeitada para
            // sempre neste execution environment "quente" do Lambda - toda
            // invocacao subsequente falharia ate o ambiente ser reciclado.
            // Limpar o cache permite que a proxima invocacao tente de novo.
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
