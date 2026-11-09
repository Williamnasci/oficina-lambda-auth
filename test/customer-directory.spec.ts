jest.mock('../src/secrets');
jest.mock('../src/db');
import { lookupCustomer } from '../src/customer-directory';
import { getSecretString } from '../src/secrets';
import { findCustomerByDocument } from '../src/db';

const oldEnv = process.env;
const oldFetch = global.fetch;
const cpf = '52998224725';
beforeEach(() => {
  process.env = { ...oldEnv, AUTH_CUSTOMER_SOURCE: 'os-api', OS_BASE_URL: 'https://os.example.test/prefix', OS_AUTH_LOOKUP_SECRET_ID: 'lookup-secret' };
  jest.resetAllMocks();
  jest.mocked(getSecretString).mockResolvedValue('x'.repeat(32));
  global.fetch = jest.fn();
});
afterEach(() => { process.env = oldEnv; global.fetch = oldFetch; });

it('uses authenticated HTTPS and preserves the exact CPF and identity', async () => {
  jest.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ id: 'c1', document: cpf, documentType: 'CPF', isActive: false })));
  await expect(lookupCustomer(cpf)).resolves.toEqual({ id: 'c1', document: cpf, isActive: false });
  expect(fetch).toHaveBeenCalledWith('https://os.example.test/prefix/internal/auth/customers/lookup', expect.objectContaining({ method: 'POST', redirect: 'error', body: JSON.stringify({ document: cpf }) }));
  expect(findCustomerByDocument).not.toHaveBeenCalled();
});
it('distinguishes absence from outage without legacy fallback', async () => {
  jest.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 404 })).mockResolvedValueOnce(new Response(null, { status: 503 }));
  await expect(lookupCustomer(cpf)).resolves.toBeNull();
  await expect(lookupCustomer(cpf)).rejects.toThrow('503');
  expect(findCustomerByDocument).not.toHaveBeenCalled();
});
it('rejects a mismatched CPF and insecure endpoint', async () => {
  jest.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ id: 'c1', document: 'other', documentType: 'CPF', isActive: true })));
  await expect(lookupCustomer(cpf)).rejects.toThrow('Invalid OS customer response');
  process.env.OS_BASE_URL = 'http://os.example.test';
  await expect(lookupCustomer(cpf)).rejects.toThrow('HTTPS');
});
