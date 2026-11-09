variable "aws_region" {
  description = "Região AWS. us-east-1 - região fixa da conta AWS Academy Learner Lab usada neste projeto (ver docs/rfc/0001-escolha-da-nuvem.md no oficina-api; a migração de us-east-2 para us-east-1 aconteceu ao trocar de conta pessoal para Academy)."
  type        = string
  default     = "us-east-1"
}

variable "jwt_expires_in" {
  description = "Tempo de expiração do JWT emitido por auth-login (formato aceito pela lib jsonwebtoken, ex: '1d', '3600s')."
  type        = string
  default     = "1d"
}

variable "auth_login_timeout" {
  description = "Timeout explícito da função auth-login (segundos). Faz uma consulta ao RDS + leitura de 2 segredos, então precisa de folga acima do default de 3s do Lambda."
  type        = number
  default     = 10
}

variable "auth_authorizer_timeout" {
  description = "Timeout explícito da função auth-authorizer (segundos). Só verifica JWT (CPU-bound, rápido) e lê 1 segredo — não precisa do mesmo timeout do login."
  type        = number
  default     = 5
}

variable "log_retention_days" {
  description = "Retenção dos CloudWatch Logs das funções."
  type        = number
  default     = 14
}

variable "auth_customer_source" {
  description = "Diretório de clientes do login: legacy ou os-api."
  type        = string
  default     = "legacy"
  validation {
    condition     = contains(["legacy", "os-api"], var.auth_customer_source)
    error_message = "Use legacy ou os-api."
  }
}

variable "os_base_url" {
  description = "URL HTTPS do OS Service no modo os-api."
  type        = string
  default     = ""
}

variable "os_auth_lookup_secret_id" {
  description = "ARN ou nome do segredo existente que guarda apenas o token de consulta do OS."
  type        = string
  default     = ""
}
