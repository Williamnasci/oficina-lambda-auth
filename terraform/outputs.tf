output "auth_login_function_name" {
  description = "Nome da função auth-login."
  value       = aws_lambda_function.auth_login.function_name
}

output "auth_login_function_arn" {
  description = "ARN da função auth-login — usado por oficina-infra-k8s para a integração do API Gateway."
  value       = aws_lambda_function.auth_login.arn
}

output "auth_login_invoke_arn" {
  description = "Invoke ARN da função auth-login — usado na integração Lambda do API Gateway (formato específico do apigatewayv2)."
  value       = aws_lambda_function.auth_login.invoke_arn
}

output "auth_authorizer_function_name" {
  description = "Nome da função auth-authorizer."
  value       = aws_lambda_function.auth_authorizer.function_name
}

output "auth_authorizer_function_arn" {
  description = "ARN da função auth-authorizer."
  value       = aws_lambda_function.auth_authorizer.arn
}

output "auth_authorizer_invoke_arn" {
  description = "Invoke ARN da função auth-authorizer — usado pelo aws_apigatewayv2_authorizer em oficina-infra-k8s."
  value       = aws_lambda_function.auth_authorizer.invoke_arn
}

output "jwt_secret_arn" {
  description = "ARN do segredo do JWT no Secrets Manager."
  value       = aws_secretsmanager_secret.jwt_secret.arn
}
