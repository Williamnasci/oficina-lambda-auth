# oficina-lambda-auth

Function Serverless de autenticação por CPF do Tech Challenge Fase 3 (POSTECH). Parte do split de repositórios descrito em [ADR-0005](https://github.com/Williamnasci/oficina-api/blob/main/docs/adr/0005-split-de-repositorios.md), no repositório principal [`oficina-api`](https://github.com/Williamnasci/oficina-api).

## Propósito

Duas funções Lambda, acionadas pelo API Gateway do repositório [`oficina-infra-k8s`](https://github.com/Williamnasci/oficina-infra-k8s):

- **auth-login**: valida o formato do CPF, consulta a existência/status do cliente no banco (RDS PostgreSQL, mesma base do `oficina-api`) e emite um JWT.
- **auth-authorizer**: Lambda Authorizer (tipo `REQUEST`) que verifica a assinatura do JWT nas rotas protegidas do API Gateway.

Decisão e alternativas consideradas (por que Lambda própria em vez de Amazon Cognito) documentadas em [RFC-0003](https://github.com/Williamnasci/oficina-api/blob/main/docs/rfc/0003-estrategia-de-autenticacao.md).

## Tecnologias

- Node.js / TypeScript
- AWS Lambda + API Gateway (HTTP API v2)
- `jsonwebtoken` (assinatura/verificação HS256)
- AWS Secrets Manager (segredo de assinatura, resolvido em runtime)
- Prisma Client (reaproveitando o schema do `oficina-api` para consultar `Customer`)
- Terraform (empacotamento/deploy da função — coordenado com `oficina-infra-k8s` para o registro das rotas)
- GitHub Actions (CI/CD)

## Status

🚧 Em construção. Estrutura de repositório e branch protection configuradas; implementação das funções é o próximo passo do roteiro (ver `docs/phase-3-plan.md` no `oficina-api`).

## Deploy e execução

_A preencher assim que o pipeline de CI/CD e o deploy estiverem funcionais._

## Swagger / Postman

_A preencher — a Lambda expõe `POST /auth/login`; contrato será documentado aqui assim que implementado._
