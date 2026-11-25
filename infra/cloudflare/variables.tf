variable "account_id" {
  description = "The Cloudflare account that owns the buckets: 32 hexadecimal digits, shown on the account's home page."
  type        = string

  validation {
    condition     = can(regex("^[0-9a-f]{32}$", var.account_id))
    error_message = "account_id is 32 lower-case hexadecimal digits."
  }
}

variable "release_buckets" {
  description = "The releases bucket for each environment. Must match the RELEASES bindings in apps/web/wrangler.jsonc."
  type        = map(string)
  default = {
    staging    = "genomecanvas-releases-staging"
    production = "genomecanvas-releases-production"
  }

  validation {
    condition     = alltrue([for name in values(var.release_buckets) : can(regex("^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$", name))])
    error_message = "R2 bucket names are 3 to 63 lower-case letters, digits and hyphens, not starting or ending with a hyphen."
  }
}

variable "location" {
  description = "Where R2 should keep the buckets (apac, eeur, enam, weur, wnam or oc), or null to let it choose near the first request."
  type        = string
  default     = null
}
