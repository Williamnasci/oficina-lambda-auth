# oficina-lambda-auth

Function Serverless de autenticação por CPF do Tech Challenge Fase 3 (POSTECH). Parte do split de repositórios descrito em [ADR-0005](https://github.com/Williamnasci/oficina-api/blob/main/docs/adr/0005-split-de-repositorios.md), no repositório principal [`oficina-api`](https://github.com/Williamnasci/oficina-api).

## Propósito

Duas funções Lambda, acionadas pelo API Gateway do repositório [`oficina-infra-k8s`](https://github.com/Williamnasci/oficina-infra-k8s):

- **auth-login**: valida o formato do CPF, consulta a existência/status do cliente no banco (RDS PostgreSQL, mesma base do `oficina-api`) e emite um JWT.
- **auth-authorizer**: Lambda Authorizer (tipo `REQUEST`) que verifica a assinatura do JWT nas rotas protegidas do API Gateway.

Decisão e alternativas consideradas (por que Lambda própria em vez de Amazon Cognito) documentadas em [RFC-0003](https://github.com/Williamnasci/oficina-api/blob/main/docs/rfc/0003-estrategia-de-autenticacao.md).

## Tecnologias

- Node.js 20 / TypeScript
- AWS Lambda + API Gateway (HTTP API v2)
- `pg` (node-postgres) — consulta direta a `Customer`, sem Prisma (repositório independente, sem acesso ao schema do `oficina-api`)
- `jsonwebtoken` (assinatura/verificação HS256)
- `@aws-sdk/client-secrets-manager` (segredo de assinatura e credenciais do RDS, resolvidos e cacheados em runtime)
- `esbuild` (empacotamento em bundle único por função)
- Jest (16 testes unitários — CPF, `auth-login`, `auth-authorizer`)
- Terraform (deploy da função — coordenado com `oficina-infra-k8s` para o registro das rotas)
- GitHub Actions (CI/CD)

## Status

✅ Código das duas funções implementado e testado (`npm test`: 16/16). 🚧 Falta: Terraform (função Lambda, IAM, segredo do JWT), pipeline de CI/CD, e o registro das rotas no API Gateway (`oficina-infra-k8s`) — ver `docs/phase-3-plan.md` no `oficina-api`.

## Deploy e execução

```bash
npm install
npm test        # 16 testes unitários
npm run typecheck
npm run build    # gera dist/auth-login/index.js e dist/auth-authorizer/index.js
```

Deploy real (Terraform + CI/CD) ainda não implementado — próximo passo do roteiro.

## Swagger / Postman

_A preencher — a Lambda expõe `POST /auth/login`; contrato será documentado aqui assim que implementado._
