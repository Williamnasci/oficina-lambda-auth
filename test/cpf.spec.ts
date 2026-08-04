import { isValidCpf, normalizeCpf } from '../src/cpf';

describe('cpf', () => {
    describe('isValidCpf', () => {
        it('accepts a valid CPF', () => {
            expect(isValidCpf('529.982.247-25')).toBe(true);
            expect(isValidCpf('52998224725')).toBe(true);
        });

        it('rejects a CPF with a wrong check digit', () => {
            expect(isValidCpf('52998224726')).toBe(false);
        });

        it('rejects all-repeated-digit sequences', () => {
            expect(isValidCpf('111.111.111-11')).toBe(false);
            expect(isValidCpf('00000000000')).toBe(false);
        });

        it('rejects wrong length', () => {
            expect(isValidCpf('123')).toBe(false);
            expect(isValidCpf('123456789012')).toBe(false);
        });

        it('rejects non-numeric garbage', () => {
            expect(isValidCpf('')).toBe(false);
            expect(isValidCpf('abc.def.ghi-jk')).toBe(false);
        });
    });

    describe('normalizeCpf', () => {
        it('strips non-digit characters', () => {
            expect(normalizeCpf('529.982.247-25')).toBe('52998224725');
        });
    });
});
