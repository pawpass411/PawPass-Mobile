# PawPass Mobile — Deployment Checklist
# App Store Connect + Google Play Console
# Apawcalypse LLC

---

## PRE-BUILD REQUIREMENTS

### Accounts & Access
- [ ] Apple Developer Program account ($99/yr) — https://developer.apple.com
- [ ] Google Play Developer account ($25 one-time) — https://play.google.com/console
- [ ] Expo account with EAS subscription — https://expo.dev
- [ ] Apple Team ID noted (found in Apple Developer → Membership)
- [ ] App Store Connect app created with bundle ID: `com.apawcalypse.pawpass`
- [ ] Google Play app created with package: `com.apawcalypse.pawpass`

### Code & Config
- [ ] `app.json` updated:
  - [ ] `version` bumped (e.g., `"1.0.0"`)
  - [ ] `ios.buildNumber` incremented
  - [ ] `android.versionCode` incremented
  - [ ] `extra.eas.projectId` set to your EAS project ID
- [ ] `eas.json` updated:
  - [ ] `submit.production.ios.appleId` set
  - [ ] `submit.production.ios.ascAppId` set (from App Store Connect)
  - [ ] `submit.production.ios.appleTeamId` set
  - [ ] `submit.production.android.serviceAccountKeyPath` points to valid JSON
- [ ] All environment variables set in EAS dashboard or `.env.production`
- [ ] Demo accounts seeded in production DB:
  - [ ] `demo-handler@pawpass.app` / `PawPassDemo2025!`
  - [ ] `demo-business@pawpass.app` / `PawPassDemo2025!`
  - [ ] `demo-community@pawpass.app` / `PawPassDemo2025!`

### Assets Required
All assets must be production-quality PNGs (no alpha on required sizes):

**iOS:**
- [ ] `assets/icon.png` — 1024×1024 (App Store icon, no alpha channel)
- [ ] `assets/splash.png` — 1242×2688 minimum (splash screen)
- [ ] Screenshots — 6.7" (1290×2796), 6.1" (1179×2556), iPad Pro 12.9" (2048×2732)
  - [ ] Discover/Search screen
  - [ ] Business detail with trust score
  - [ ] Access concern report wizard
  - [ ] Learn / ADA education screen
  - [ ] Profile screen
  Minimum 3 screenshots per device size. Maximum 10.

**Android:**
- [ ] `assets/adaptive-icon/foreground.png` — 1024×1024 (foreground layer)
- [ ] `assets/adaptive-icon/background.png` — 1024×1024 (background layer)
- [ ] `assets/splash.png` — same as iOS
- [ ] Feature graphic — 1024×500 JPG (displayed in Play Store listing)
- [ ] Screenshots — phone (1080×1920 minimum), tablet (1200×1920 minimum)
  Same screens as iOS above.
- [ ] `google-services.json` downloaded from Firebase Console (if using FCM)
- [ ] `google-play-service-account.json` from Google Play Console → Setup → API access

**Notification icon:**
- [ ] `assets/notification-icon.png` — 96×96 white icon on transparent background

---

## APP STORE CONNECT SETUP

### App Information
- [ ] **App Name:** PawPass
- [ ] **Subtitle:** Service Dog Access Guide
- [ ] **Category:** Primary: Travel — Secondary: Lifestyle
- [ ] **Content Rating:** 4+ (no objectionable content)
- [ ] **Price:** Free
- [ ] **Availability:** United States (expand after launch)

### App Privacy
- [ ] Privacy Policy URL: `https://pawpass.app/legal/privacy`
- [ ] Data collection declared:
  - [ ] Contact Info → Email Address (linked to user identity)
  - [ ] Location → Coarse Location (not linked to user identity)
  - [ ] User Content → Other User Content — reviews, reports (linked to user identity)
  - [ ] Usage Data → Product Interaction (not linked to user identity)
- [ ] No tracking across other apps/websites (check if false)
- [ ] Privacy Nutrition Label complete

### App Review Information
- [ ] **Demo Account Login:**
  - Email: `demo-handler@pawpass.app`
  - Password: `PawPassDemo2025!`
- [ ] **Review Notes:**
  ```
  PawPass is a community platform for service dog handlers to find welcoming
  businesses and parks, and for businesses to complete ADA compliance training.

  To review the app, use the demo account above. This account has handler role
  access with pre-populated reviews and reports.

  For business dashboard access, use: demo-business@pawpass.app / PawPassDemo2025!

  The "Report" tab opens a 4-step access concern wizard. No actual report is
  submitted in the demo account unless you tap "Submit report."

  The app requires an internet connection to the PawPass API.
  API endpoint: https://pawpass.app/api
  ```
- [ ] **Contact info for review team:** review@pawpass.app / +1-XXX-XXX-XXXX

### Version Information
- [ ] **Version Number:** 1.0.0
- [ ] **What's New:** (First release text)
  ```
  Welcome to PawPass — the community guide for service dog handlers.

  • Find service-dog-friendly businesses and parks near you
  • Rate and review your access experiences
  • Report access concerns with our guided 4-step wizard
  • Learn about your ADA rights and what businesses can and can't ask
  • View your complaint history and incident log
  ```

### In-App Purchases (if applicable)
- [ ] Business subscription plans configured in App Store Connect
- [ ] Corrective action one-time purchase configured
- [ ] StoreKit testing complete in sandbox

---

## GOOGLE PLAY CONSOLE SETUP

### Store Listing
- [ ] **App Name:** PawPass
- [ ] **Short Description** (80 chars): Find service-dog-friendly businesses & report access concerns
- [ ] **Full Description** (4000 chars):
  ```
  PawPass is the community guide for service dog handlers.

  Know before you go. Find businesses and parks that have been verified and
  reviewed by the service dog handler community. Rate your own experiences,
  report access concerns, and help other handlers navigate public spaces with
  confidence.

  FOR HANDLERS:
  • Search verified businesses and dog parks near you
  • Filter by certification badge and access rating
  • Submit access concern reports with a guided 4-step form
  • Keep a private incident log of your experiences
  • Learn about your ADA rights — what businesses can and can't ask

  FOR BUSINESSES:
  • Claim your listing and respond to reviews
  • Complete ADA compliance training and earn the PawPass Certified badge
  • Manage complaint responses and corrective action training
  • Track staff training completion

  COMMUNITY-POWERED:
  All reviews and ratings are submitted by real community members. The PawPass
  trust score reflects a business's review average, access ratings, and complaint
  history.

  Reviews and reports are community experiences, not official ADA determinations
  or legal findings. © Apawcalypse LLC.
  ```
- [ ] **Category:** Travel & Local
- [ ] **Tags:** service dog, ADA, accessibility, dog friendly, disability

### App Content
- [ ] Content rating questionnaire complete (Expected: Everyone)
- [ ] Target audience: 18+ (handles legal/disability content)
- [ ] News apps: No
- [ ] Privacy Policy URL: `https://pawpass.app/legal/privacy`
- [ ] App access: "All or most features are accessible without special access"
  - Demo account provided in "Managed credentials" section:
    - Username: `demo-handler@pawpass.app`
    - Password: `PawPassDemo2025!`
    - Instructions: "Use this account to access all handler features. For business dashboard, use demo-business@pawpass.app with same password."

### Release Tracks
- [ ] **Internal testing** — team members and stakeholders
- [ ] **Closed testing (Alpha)** — limited external testers (invite by email)
- [ ] **Open testing (Beta)** — broader testing, anyone can join
- [ ] **Production** — full rollout

### Rollout Strategy (Production)
- [ ] Start with 10% rollout
- [ ] Monitor crash rate and ANR rate for 48 hours
- [ ] Expand to 50% if metrics stable
- [ ] Full rollout after 1 week

---

## ENVIRONMENT VARIABLES (EAS Secrets)

Set these in EAS dashboard → Project → Secrets, or in your CI:

```
EXPO_PUBLIC_API_BASE_URL=https://pawpass.app
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
EXPO_PUBLIC_APP_ENV=production
EXPO_PUBLIC_SHOW_DEMO=false
```

For development/preview builds:
```
EXPO_PUBLIC_API_BASE_URL=https://staging.pawpass.app
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
EXPO_PUBLIC_APP_ENV=preview
EXPO_PUBLIC_SHOW_DEMO=true
```

---

## BUILD COMMANDS

```bash
# Development (simulator)
npm run build:ios:dev
npm run build:android:dev

# Preview (internal distribution, real devices)
npm run build:ios:preview
npm run build:android:preview

# Production (App Store / Play Store)
npm run build:ios:prod
npm run build:android:prod
npm run build:all:prod

# Submit to stores
npm run submit:ios
npm run submit:android
npm run submit:all

# OTA update (no store review needed for JS-only changes)
npm run update

# Full release with submission
./scripts/release.sh all --submit
```

---

## APPLE PRIVACY MANIFEST

Required for iOS 17+ apps using certain APIs. Already configured in `app.json` under `ios.privacyManifests`. Declare:

- [ ] File timestamp access (C617.1 — for caching)
- [ ] UserDefaults access (CA92.1 — for preferences)

If adding new APIs that require privacy manifest reasons, update `app.json`.

---

## POST-LAUNCH MONITORING

### Metrics to Watch
- [ ] App Store crash rate < 1%
- [ ] Google Play ANR rate < 0.47%
- [ ] API error rate < 0.5%
- [ ] Average rating maintained ≥ 4.0 stars
- [ ] Day-7 retention > 25%

### Tools
- [ ] Expo Diagnostics — `eas diagnostics`
- [ ] EAS Build logs — https://expo.dev/accounts/[account]/projects/pawpass/builds
- [ ] App Store Connect Analytics
- [ ] Google Play Console → Android vitals

### First-Week Checklist
- [ ] Monitor App Store reviews daily — respond within 24h
- [ ] Monitor Play Store reviews daily — respond within 24h
- [ ] Check API error logs for mobile-specific issues
- [ ] Verify demo accounts still working for reviewer access
- [ ] Confirm push notifications delivering
- [ ] Test deep links (certificate verify, business listings)

---

## LEGAL & COMPLIANCE

- [ ] Privacy policy live at `https://pawpass.app/legal/privacy`
- [ ] Terms of service live at `https://pawpass.app/legal/terms`
- [ ] Platform disclaimer live at `https://pawpass.app/legal/disclaimer`
- [ ] All accessible from the app (sign-in screen and profile → settings)
- [ ] COPPA compliance confirmed (not directed at children)
- [ ] CCPA compliance: privacy@pawpass.app contact available
- [ ] ADA content carries required educational disclaimers throughout app

---

## SUPPORT INFRASTRUCTURE

Before launch, ensure:
- [ ] `support@pawpass.app` monitored
- [ ] `review@pawpass.app` monitored (for App Store review team)
- [ ] `privacy@pawpass.app` monitored
- [ ] In-app feedback route works (`/feedback` or profile → feedback)
- [ ] App Store and Play Store support URL set: `https://pawpass.app/support`

---

*Last updated: 2025 — Apawcalypse LLC*
