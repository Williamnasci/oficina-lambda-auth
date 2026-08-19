# AWS Academy Learner Lab nega iam:CreateRole/iam:PutRolePolicy - nao e
# possivel criar uma role de execucao por funcao (least privilege por
# Lambda) como este repositorio fazia antes. Reaproveita a LabRole
# pre-provisionada pela plataforma do Academy (mesmo padrao usado em
# oficina-infra-k8s/iam.tf para o instance profile da EC2). Trade-off real:
# as duas funcoes passam a compartilhar uma role ampla em vez de cada uma
# ter acesso so aos segredos que precisa - aceitavel num sandbox academico
# descartavel, nao seria numa conta de producao real.
data "aws_iam_role" "lab_role" {
  name = "LabRole"
}

# Referencia o secret do RDS criado em oficina-infra-database, sem duplicar
# credenciais nem acoplar os dois states diretamente (mesmo padrao usado para
# o security group da EC2 em oficina-infra-database/main.tf).
data "aws_secretsmanager_secret" "db_credentials" {
  name = "oficina/database/credentials"
}

# Segredo de assinatura/verificacao HS256 dos JWTs. Compartilhado entre
# auth-login (assina) e auth-authorizer (verifica) via IAM, nao hardcoded.
resource "random_password" "jwt_secret" {
  length  = 64
  special = true
}

resource "aws_secretsmanager_secret" "jwt_secret" {
  name        = "oficina/lambda-auth/jwt-secret"
  description = "Segredo HS256 usado por auth-login (assina) e auth-authorizer (verifica) do oficina-lambda-auth"
}

resource "aws_secretsmanager_secret_version" "jwt_secret" {
  secret_id     = aws_secretsmanager_secret.jwt_secret.id
  secret_string = random_password.jwt_secret.result
}

# --- Empacotamento -----------------------------------------------------
# Os bundles sao gerados pelo esbuild (npm run build, roda ANTES do
# terraform apply no CI/CD) em ../dist/<funcao>/index.js. O Terraform so
# empacota o que ja existe no disco.

data "archive_file" "auth_login" {
  type        = "zip"
  source_dir  = "${path.module}/../dist/auth-login"
  output_path = "${path.module}/../dist/auth-login.zip"
}

data "archive_file" "auth_authorizer" {
  type        = "zip"
  source_dir  = "${path.module}/../dist/auth-authorizer"
  output_path = "${path.module}/../dist/auth-authorizer.zip"
}

# --- auth-login: valida CPF, consulta cliente no RDS, emite JWT --------

resource "aws_cloudwatch_log_group" "auth_login" {
  name              = "/aws/lambda/oficina-auth-login"
  retention_in_days = var.log_retention_days
}

resource "aws_lambda_function" "auth_login" {
  function_name    = "oficina-auth-login"
  role             = data.aws_iam_role.lab_role.arn
  runtime          = "nodejs20.x"
  handler          = "index.handler"
  filename         = data.archive_file.auth_login.output_path
  source_code_hash = data.archive_file.auth_login.output_base64sha256

  # Timeout explicito: o default do Lambda (3s) e curto demais para uma
  # consulta ao RDS + duas leituras de segredo (Secrets Manager cacheia
  # entre invocacoes quentes, mas a primeira chamada em um ambiente novo
  # ainda precisa de folga).
  timeout     = var.auth_login_timeout
  memory_size = 256

  environment {
    variables = {
      DB_SECRET_ID   = data.aws_secretsmanager_secret.db_credentials.arn
      JWT_SECRET_ID  = aws_secretsmanager_secret.jwt_secret.arn
      JWT_EXPIRES_IN = var.jwt_expires_in
    }
  }

  depends_on = [aws_cloudwatch_log_group.auth_login]
}

# --- auth-authorizer: verifica o JWT nas rotas protegidas do API Gateway -

resource "aws_cloudwatch_log_group" "auth_authorizer" {
  name              = "/aws/lambda/oficina-auth-authorizer"
  retention_in_days = var.log_retention_days
}

resource "aws_lambda_function" "auth_authorizer" {
  function_name    = "oficina-auth-authorizer"
  role             = data.aws_iam_role.lab_role.arn
  runtime          = "nodejs20.x"
  handler          = "index.handler"
  filename         = data.archive_file.auth_authorizer.output_path
  source_code_hash = data.archive_file.auth_authorizer.output_base64sha256

  timeout     = var.auth_authorizer_timeout
  memory_size = 128

  environment {
    variables = {
      JWT_SECRET_ID = aws_secretsmanager_secret.jwt_secret.arn
    }
  }

  depends_on = [aws_cloudwatch_log_group.auth_authorizer]
}
