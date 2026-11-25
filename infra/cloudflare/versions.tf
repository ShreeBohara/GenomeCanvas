terraform {
  required_version = ">= 1.10.0"

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.29"
    }
  }

  # State is kept locally in terraform.tfstate, which git ignores. To keep it in
  # an R2 bucket instead, see "Remote state" in infra/README.md.
}

# Reads the API token from CLOUDFLARE_API_TOKEN. Never put it in a file here.
provider "cloudflare" {}
