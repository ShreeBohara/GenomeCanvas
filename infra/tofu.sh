#!/bin/sh
# Runs OpenTofu from its official container image, for machines without tofu
# installed. CI uses it too, so local runs and CI run the same build.
#
#   infra/tofu.sh -chdir=cloudflare validate
#
# Paths after -chdir are relative to infra/. Credentials are passed through
# only if set in your shell; nothing here stores them.
set -eu

# ghcr.io/opentofu/opentofu 1.13.10, multi-architecture index, pulled 2026-11-25.
IMAGE="ghcr.io/opentofu/opentofu:1.13.10@sha256:f89e790760542e8ca6c168301e7ab7fb0885ea9a4856fb810e75ee02b40ae727"

here=$(cd "$(dirname "$0")" && pwd)

exec docker run --rm \
  --user "$(id -u):$(id -g)" \
  --volume "$here:/infra" \
  --workdir /infra \
  --env TF_IN_AUTOMATION=1 \
  --env CLOUDFLARE_API_TOKEN \
  --env GITHUB_TOKEN \
  "$IMAGE" "$@"
