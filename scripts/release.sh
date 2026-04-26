#!/bin/bash
# scripts/release.sh
# PawPass Mobile — Production Release Script
# Usage: ./scripts/release.sh [ios|android|all] [--submit]

set -e

PLATFORM=${1:-"all"}
SUBMIT=${2:-""}
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

echo ""
echo "🐾 PawPass Mobile — Production Release"
echo "======================================="
echo "Platform: $PLATFORM"
echo "Submit:   ${SUBMIT:-no}"
echo "Time:     $TIMESTAMP"
echo ""

# ─── PREFLIGHT CHECKS ────────────────────────────────

check_deps() {
  echo "📋 Preflight checks..."

  if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI not found. Install: npm install -g eas-cli"
    exit 1
  fi
  echo "✅ EAS CLI: $(eas --version)"

  if ! eas whoami &> /dev/null; then
    echo "❌ Not logged in to EAS. Run: eas login"
    exit 1
  fi
  echo "✅ EAS authenticated: $(eas whoami)"

  # Check required env vars
  REQUIRED_VARS=("EXPO_PUBLIC_API_BASE_URL" "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY")
  for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
      echo "⚠️  Warning: $var is not set"
    fi
  done

  echo "✅ Preflight complete"
  echo ""
}

# ─── BUILD ───────────────────────────────────────────

build_ios() {
  echo "🍎 Building iOS (App Store)..."
  eas build --platform ios --profile production --non-interactive
  echo "✅ iOS build submitted to EAS"
}

build_android() {
  echo "🤖 Building Android (Play Store)..."
  eas build --platform android --profile production --non-interactive
  echo "✅ Android build submitted to EAS"
}

# ─── SUBMIT ──────────────────────────────────────────

submit_ios() {
  echo "📤 Submitting to App Store Connect..."
  eas submit --platform ios --profile production --non-interactive
  echo "✅ iOS submitted to TestFlight"
}

submit_android() {
  echo "📤 Submitting to Google Play (internal track)..."
  eas submit --platform android --profile production --non-interactive
  echo "✅ Android submitted to Play Console"
}

# ─── CHANGELOG ───────────────────────────────────────

generate_changelog() {
  echo "📝 Generating changelog..."
  if command -v git &> /dev/null; then
    LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "HEAD~20")
    echo "Changes since $LAST_TAG:" > CHANGELOG_RELEASE.md
    git log "$LAST_TAG"..HEAD --oneline --no-merges >> CHANGELOG_RELEASE.md
    echo ""
    echo "Release notes written to CHANGELOG_RELEASE.md"
    cat CHANGELOG_RELEASE.md
  fi
}

# ─── MAIN ────────────────────────────────────────────

check_deps
generate_changelog

case "$PLATFORM" in
  ios)
    build_ios
    [ "$SUBMIT" = "--submit" ] && submit_ios
    ;;
  android)
    build_android
    [ "$SUBMIT" = "--submit" ] && submit_android
    ;;
  all)
    build_ios
    build_android
    if [ "$SUBMIT" = "--submit" ]; then
      submit_ios
      submit_android
    fi
    ;;
  *)
    echo "Usage: ./scripts/release.sh [ios|android|all] [--submit]"
    exit 1
    ;;
esac

echo ""
echo "🎉 Release process complete!"
echo ""
echo "Next steps:"
echo "  1. Check EAS dashboard: https://expo.dev"
echo "  2. iOS → App Store Connect → TestFlight → Add testers"
echo "  3. Android → Play Console → Internal testing → Review"
echo "  4. Fill in release notes in both stores"
echo "  5. Submit for review when ready"
echo ""
echo "Monitor build status:"
echo "  eas build:list --platform all"
