# Infrastructure

OpenTofu configurations for the cloud resources GenomeCanvas uses. Nothing here
has been applied by a build session; the owner applies it, following
[`docs/runbooks/first-deploy.md`](../docs/runbooks/first-deploy.md).

| Folder | What it manages | Credentials it reads | Required? |
|---|---|---|---|
| [`cloudflare/`](cloudflare/) | The releases bucket for `staging` and for `production` (R2) | `CLOUDFLARE_API_TOKEN` | Yes, before the first deploy |
| [`github/`](github/) | Required checks on `main` and Dependabot alerts | `GITHUB_TOKEN` | No |

**What OpenTofu manages, and what it does not.** OpenTofu owns resources that
exist independently of any deploy: buckets now, and the database and DNS when
they arrive. The Worker, its versions, its bindings and its `workers.dev`
address belong to wrangler and `apps/web/wrangler.jsonc`, because they change
with every deploy (see [ADR 9](../docs/adr/0009-opentofu-and-github-actions.md)).
The bucket names appear in both places and must stay equal:

| Environment | Bucket | Declared in |
|---|---|---|
| `staging` | `genomecanvas-releases-staging` | `cloudflare/variables.tf`, `apps/web/wrangler.jsonc` |
| `production` | `genomecanvas-releases-production` | the same |
| local development | `genomecanvas-releases-local` | `apps/web/wrangler.jsonc` only; it exists in wrangler's local state, never in an account |

## Running OpenTofu

With OpenTofu installed (`brew install opentofu`), run `tofu` inside a folder.
Without it, `infra/tofu.sh` runs the same commands from the official container
image, pinned by digest, which is what CI does:

```bash
infra/tofu.sh fmt -check -recursive
infra/tofu.sh -chdir=cloudflare init -backend=false -lockfile=readonly
infra/tofu.sh -chdir=cloudflare validate
```

The lock files (`.terraform.lock.hcl`) are committed; they pin each provider's
checksums. Providers: `cloudflare/cloudflare` 5.29.0 and `integrations/github`
6.13.0.

## Applying the Cloudflare configuration

```bash
cd infra/cloudflare
cp terraform.tfvars.example terraform.tfvars   # then put your account ID in it
export CLOUDFLARE_API_TOKEN=...                # typed by you, never saved in a file
tofu init
tofu plan
tofu apply
```

Both buckets have `prevent_destroy`, so `tofu destroy` refuses until that line
is removed on purpose.

## The optional GitHub configuration

It turns on a ruleset for `main` (no deletion, no force-push, changes through a
pull request, and the CI jobs below must pass, reported by GitHub Actions) and
Dependabot alerts. The token needs the **Administration** and **Contents**
repository permissions (read and write) on this repository only.

Required checks are the job names in `.github/workflows/ci.yml`:
`TypeScript (lint, format, types, tests, build)`, `Python (ruff, mypy, pytest,
licence ledger)`, `Pipeline, web build and end-to-end tests`, `OpenTofu (format
and validate)` and `Lighthouse (three runs)`. Renaming a job means changing
`required_checks` too, or nothing can merge.

**Private vulnerability reporting** has no resource in the GitHub provider
(v6.13.0). Turn it on with one API call, using the GitHub CLI:

```bash
gh api --method PUT repos/<owner>/GenomeCanvas/private-vulnerability-reporting
```

## Remote state

State is local (`terraform.tfstate`, ignored by git), which is enough for one
person. To share it, keep it in a third R2 bucket through R2's S3-compatible
interface. Create the bucket and an R2 access key in the dashboard, then add a
backend block to `cloudflare/versions.tf` and run `tofu init -migrate-state`:

```hcl
terraform {
  backend "s3" {
    bucket                      = "genomecanvas-tofu-state"
    key                         = "cloudflare/terraform.tfstate"
    region                      = "auto"
    endpoints                   = { s3 = "https://<account-id>.r2.cloudflarestorage.com" }
    use_path_style              = true
    skip_credentials_validation = true
    skip_region_validation      = true
    skip_requesting_account_id  = true
    skip_metadata_api_check     = true
    skip_s3_checksum            = true
  }
}
```

The access key goes in `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` in your
shell, never in the file. State holds no secrets today, but OpenTofu's state
encryption is worth turning on before it does.
