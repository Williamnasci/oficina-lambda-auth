# Backend remoto compartilhado com oficina-infra-database e oficina-infra-k8s
# (mesmo bucket, chave diferente). Bucket criado uma unica vez fora do
# Terraform (bootstrap manual).
terraform {
  backend "s3" {
    bucket       = "oficina-tfstate-804680418945"
    key          = "lambda-auth/terraform.tfstate"
    region       = "us-east-1"
    encrypt      = true
    use_lockfile = true
  }
}
