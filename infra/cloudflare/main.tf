# Only what the skeleton uses: one releases bucket per environment. The Worker
# itself, its versions and its workers.dev address are managed by wrangler from
# apps/web/wrangler.jsonc (docs/adr/0009-opentofu-and-github-actions.md). The
# database arrives in Phase 5.
resource "cloudflare_r2_bucket" "releases" {
  for_each = var.release_buckets

  account_id = var.account_id
  name       = each.value
  location   = var.location

  lifecycle {
    # Release data is the product. Removing a bucket must be a deliberate edit.
    prevent_destroy = true
  }
}
