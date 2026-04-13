#!/usr/bin/env bash
set -euo pipefail

REPO="${REPO:-Holden-Lin/claudex-switch}"
LATEST_TAG_OVERRIDE="${CLAUDEX_RELEASE_GUARD_LATEST_TAG:-}"
IGNORED_PATHS=(
  ":(exclude)Formula/claudex-switch.rb"
)

say() {
  printf '==> %s\n' "$*"
}

fail() {
  printf 'Error: %s\n' "$*" >&2
  exit 1
}

normalize_tag() {
  case "$1" in
    v*) printf '%s\n' "$1" ;;
    *) printf 'v%s\n' "$1" ;;
  esac
}

read_package_version() {
  local version
  version="$(sed -n 's/.*"version":[[:space:]]*"\([^"]*\)".*/\1/p' package.json | head -n 1)"

  if [ -z "$version" ]; then
    fail "Could not read version from package.json"
  fi

  normalize_tag "$version"
}

read_latest_release_tag() {
  if [ -n "$LATEST_TAG_OVERRIDE" ]; then
    normalize_tag "$LATEST_TAG_OVERRIDE"
    return
  fi

  curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest" \
    | sed -n 's/.*"tag_name":[[:space:]]*"\([^"]*\)".*/\1/p' \
    | head -n 1
}

main() {
  local package_tag latest_tag changed_files
  package_tag="$(read_package_version)"
  latest_tag="$(read_latest_release_tag || true)"

  if [ -z "$latest_tag" ]; then
    say "No GitHub release found yet; skipping release guard."
    return
  fi

  latest_tag="$(normalize_tag "$latest_tag")"

  if [ "$package_tag" != "$latest_tag" ]; then
    say "package.json version ${package_tag} is ahead of latest release ${latest_tag}; release prep looks intentional."
    return
  fi

  changed_files="$(
    git diff --name-only "${latest_tag}..HEAD" -- . "${IGNORED_PATHS[@]}"
  )"

  if [ -z "$changed_files" ]; then
    say "main matches the latest release ${latest_tag}."
    return
  fi

  printf 'Unreleased files since %s:\n%s\n' "$latest_tag" "$changed_files" >&2
  fail "main is ahead of ${latest_tag}, but package.json is still ${package_tag}. Bump package.json and publish a new release tag."
}

main "$@"
