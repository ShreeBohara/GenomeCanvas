terraform {
  required_version = ">= 1.10.0"

  required_providers {
    github = {
      source  = "integrations/github"
      version = "~> 6.13"
    }
  }

  # Separate from ../cloudflare, with its own local state, so the buckets can be
  # managed without a GitHub token and these settings without a Cloudflare one.
}

# Reads the token from GITHUB_TOKEN. It needs administration rights on the
# repository; see infra/README.md.
provider "github" {
  owner = var.owner
}
