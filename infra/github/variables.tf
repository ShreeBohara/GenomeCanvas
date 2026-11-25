variable "owner" {
  description = "The GitHub user or organisation that owns the repository."
  type        = string
}

variable "repository" {
  description = "The repository's name."
  type        = string
  default     = "GenomeCanvas"
}

variable "required_checks" {
  description = "CI jobs that must pass before anything merges into main: the job names in .github/workflows/ci.yml."
  type        = list(string)
  default = [
    "TypeScript (lint, format, types, tests, build)",
    "Python (ruff, mypy, pytest, licence ledger)",
    "Pipeline, web build and end-to-end tests",
    "OpenTofu (format and validate)",
    "Lighthouse (three runs)",
  ]
}
