data "aws_iam_role" "lab_role" {
  name = "LabRole"
}

data "aws_secretsmanager_secret" "db_credentials" {
  name = "oficina/database/credentials"
}

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

# Packaging

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

# Auth login

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

# Auth authorizer

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
