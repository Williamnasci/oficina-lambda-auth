# Backend remoto compartilhado com oficina-infra-database e oficina-infra-k8s
# (mesmo bucket, chave diferente). Bucket criado uma unica vez fora do
# Terraform (bootstrap manual).
terraform {
  backend "s3" {
    bucket       = "oficina-tfstate-778031418843"
    key          = "lambda-auth/terraform.tfstate"
    region       = "us-east-2"
    encrypt      = true
    use_lockfile = true
  }
}
