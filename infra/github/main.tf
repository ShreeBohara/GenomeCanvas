# Optional: repository settings, written and validated but not applied by any
# session. Apply it only with a token you created for the purpose.

# GitHub Actions' app ID, so a required check can only be satisfied by a
# workflow run, never by a status posted with someone's token.
locals {
  github_actions_app_id = 15368
}

resource "github_repository_ruleset" "main" {
  name        = "main"
  repository  = var.repository
  target      = "branch"
  enforcement = "active"

  conditions {
    ref_name {
      include = ["refs/heads/main"]
      exclude = []
    }
  }

  rules {
    deletion         = true
    non_fast_forward = true

    pull_request {
      required_approving_review_count = 0
    }

    required_status_checks {
      strict_required_status_checks_policy = false

      dynamic "required_check" {
        for_each = var.required_checks
        content {
          context        = required_check.value
          integration_id = local.github_actions_app_id
        }
      }
    }
  }
}

# Dependabot alerts. Private vulnerability reporting, the other setting the
# plan asks for, has no resource in this provider (v6.13.0; checked against
# `tofu providers schema`), so infra/README.md gives the one API call for it.
resource "github_repository_vulnerability_alerts" "this" {
  repository = var.repository
  enabled    = true
}
