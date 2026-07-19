# Territoire Incarné

Site for Elise G. Lortie — somatic therapy, movement, and education.

Stack: **Vite + React 19 + TypeScript + Tailwind CSS**, deployed on **Firebase Hosting** to **territoireincarne.com**.

## Project structure

```
src/
├── main.tsx                # entry
├── App.tsx                 # shell (theme, lang, routing)
├── types.ts                # shared types, NAV_ORDER
├── assets/images.ts        # GCS image URLs
├── i18n/                   # fr.ts, en.ts, glossary.ts, index.ts
├── hooks/                  # useLang, useTheme, useCart, useRoute
├── components/
│   ├── common/             # GlossaryText, LangThemeToggles, LoadingScreen
│   ├── decor/              # LinenPattern, SomaticCurves, FootprintsPair, OrganicBullet
│   ├── layout/             # Home, DetailView
│   └── widgets/            # CalWidget, CartSidebar, CheckoutModal, ServiceModal
├── sections/               # one file per section (Therapie, Education, …)
└── styles/index.css        # Tailwind entry
public/                     # favicon, robots.txt, sitemap.xml
```

## Local development

Prerequisites: Node.js ≥ 20.

```bash
npm install
npm run dev          # http://localhost:3000
npm run typecheck
npm run build        # outputs dist/
npm run preview      # serves dist/
```

## Firebase Hosting — one-time setup

```bash
# 1. Log in
npx firebase login

# 2. Create (or claim) the Hosting site 'territoireincarne'
npx firebase projects:list
npx firebase hosting:sites:create territoireincarne    # if not already created
# If the site already exists under a different project, update .firebaserc manually.

# 3. (If needed) point .firebaserc at your actual Firebase project ID
#    The "default" project and the "site" in firebase.json must match your Firebase console.
```

## Deploy

```bash
npm run deploy                 # prod
npm run deploy:preview         # temporary preview channel URL
```

## Custom domain: territoireincarne.com

In Firebase Console → Hosting → **Add custom domain** → enter `territoireincarne.com`
(add `www` as a second domain if desired).

Firebase gives you DNS records to add at your registrar:

- `A` records for the apex (`@`) pointing to Firebase's IPs, **or**
- a `TXT` verification record plus the `A` records.

SSL certificates are provisioned automatically (may take up to 24h).

## Environment

No secrets are required for the front-end. Any third-party key (e.g. a future
Gemini key) must live behind a server/Function — never in `vite define` /
client bundle.
