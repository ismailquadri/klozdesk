# Klozdesk website

The marketing site for **Klozdesk** — the Deal Brain for Nigerian high-ticket sales.

The site is deliberately narrow: one product thesis, one pilot offer, and one trust posture. It is not a generic SaaS template. Read the content rules below before changing copy.

## Stack

- [Astro](https://astro.build/) with static output
- TypeScript in strict mode
- Plain, hand-written CSS (no utility framework)
- Local fonts via Fontsource: Manrope (UI) and Instrument Serif (editorial accent)
- `@astrojs/sitemap` for the sitemap
- Vercel for hosting

No client-side framework, no analytics, no advertising pixels. The only JavaScript is progressive enhancement for the mobile menu, the copy-email button, and the scroll reveal.

## Commands

```bash
npm install
npm run dev       # local development
npm run build     # production build to dist/
npm run preview   # preview the production build
npm run check     # Astro + TypeScript diagnostics
```

Node 20 or newer is required.

## Structure

```text
public/
  brand/                 Logo variants and the social preview source
  .well-known/           security.txt
  favicon.png
  apple-touch-icon.png
  og.png
  robots.txt
src/
  components/            Header, footer, product mockups, FAQ, CTA
  data/site.ts           Shared navigation, metadata, and contact details
  layouts/BaseLayout.astro
  pages/                 One file per route
  styles/global.css      Design tokens, layout, and component styles
```

## Content rules

These are product constraints, not style preferences.

1. **No borrowed trust.** Do not add SOC 2, ISO 27001, NDPR, Meta Business Partner, or similar badges unless the company actually holds them and the claim is current.
2. **No fake customers.** Do not add logos, testimonials, case studies, or usage numbers without written permission and a real source.
3. **No autonomous-outreach claims.** Klozdesk does not cold-email, auto-send, or run sequences. Outbound messages require human approval.
4. **No zero-hallucination claims.** The product is designed for visible uncertainty: cite, abstain, or ask a human.
5. **No integration claims before testing.** Say “designed to sit alongside” or “scoped in the pilot” until an integration is live and documented.
6. **No pricing before scope.** The pilot is priced per active rep with a six-seat minimum, scoped in writing. Do not publish a public tier table until the model is proven.

## Deployment

Vercel builds with `npm run build` and serves `dist/`. The domain, canonical URL, and contact email live in `src/data/site.ts` and `astro.config.mjs`.

Before pointing the production domain:

- confirm `site.url` in `astro.config.mjs`
- confirm `site.email` and the footer entity in `src/data/site.ts`
- replace the social preview if the positioning changes
- run `npm run build` and `npm run check`

## Legacy

The previous static site is preserved on the `legacy/site-before-rebuild` branch. The `main` branch is the Astro rebuild.
