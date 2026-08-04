// Mesmo algoritmo de src/modules/customers/domain/value-objects/customer-document.value-object.ts
// no oficina-api. Duplicado (nao importado) porque este e um repositorio
// separado sem acesso ao codigo-fonte da aplicacao principal.

export function normalizeCpf(raw: string): string {
    return raw.replace(/\D/g, '');
}

export function isValidCpf(raw: string): boolean {
    const cpf = normalizeCpf(raw);

    if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) {
        return false;
    }

    const calcDigit = (factor: number, max: number): number => {
        let total = 0;
        for (let i = 0; i < max; i++) {
            total += parseInt(cpf[i], 10) * factor--;
        }
        const remainder = (total * 10) % 11;
        return remainder === 10 ? 0 : remainder;
    };

    const digit1 = calcDigit(10, 9);
    const digit2 = calcDigit(11, 10);

    return digit1 === parseInt(cpf[9], 10) && digit2 === parseInt(cpf[10], 10);
}
