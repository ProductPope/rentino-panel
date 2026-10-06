#!/usr/bin/env bash
# Registry drift check: re-install every @eq item this app uses and fail if anything changed.
# A diff means either a local edit to registry code (move it to EQ-librium instead) or a newer
# EQ-librium release (update on purpose: run this script, review, commit).
set -euo pipefail
cd "$(dirname "$0")/.."

ITEMS=$(
  {
    find src/components/ui src/components/eq src/hooks -type f \( -name '*.ts' -o -name '*.tsx' \)
    echo src/lib/utils.ts
  } | xargs -n1 basename | sed -E 's/\.(ts|tsx)$//' | sort -u | sed 's/^/@eq\//'
)
echo "Re-installing: $(echo $ITEMS)"
# shellcheck disable=SC2086
pnpm dlx shadcn@latest add $ITEMS --overwrite --yes --silent

if ! git diff --exit-code -- src components.json package.json; then
  echo "::error::Code installed from @eq differs from the registry. Don't edit components/ui or components/eq — change EQ-librium instead, or commit the update." >&2
  exit 1
fi
echo "registry: in sync with @eq"
