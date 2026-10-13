# Lighthouse Audit — Story 6.3

## Status: Blocked in this sandbox — must be run manually before launch sign-off

A real Lighthouse audit was attempted against a **production build** (`npx vite
build` + `vite preview`, not the unminified dev server) for `/search` and
`/listings/:id`, with a seeded active listing and the backend running locally.

Headless Chrome itself does not run in this sandboxed environment — even a
plain `google-chrome --headless=new --no-sandbox --dump-dom` hangs and times
out, independent of Lighthouse. This is an environment limitation (missing
kernel/namespace features typical of restrictive containers), not a
application issue, so the audit could not be completed here.

## How to run it (CI or a local machine)

```bash
cd pawtrust-frontend
npx vite build        # production build (tsc -b currently fails on a
                       # pre-existing, unrelated BreederProfileForm.tsx error —
                       # see repo memory; use `vite build` directly until fixed)
npx vite preview --port 4173 &

# seed at least one active listing + verified breeder in the local DB, then:
npm run lighthouse:search    # → docs/performance/lighthouse-search.html
npm run lighthouse:listing   # → docs/performance/lighthouse-listing-detail.html
```

Required thresholds (AC5): Performance ≥ 80, LCP < 3s, FID/INP < 200ms, CLS < 0.1.

## What's already in place to help hit the thresholds

- `PageMeta` (React Helmet) sets `<title>`, meta description, OG tags, and
  `<link rel="canonical">` on every public page — no extra render cost.
- Main listing photo uses `loading="eager"` + `fetchpriority="high"`
  (the LCP element); all gallery thumbnails, listing cards, and sitter cards
  use `loading="lazy"`.
- All photo containers use a fixed `aspect-[4/3]` (or similar) wrapper, so
  images never cause layout shift (CLS) regardless of natural image size.
- Listing/sitter/breeder photos are converted to WebP server-side on upload
  (`ImageConversionService`, via `intervention/image`), so no `<img>` serves an
  oversized JPEG/PNG to the browser.

## Known pre-existing risk for the Performance score

- `npx vite build` currently emits a **single 585 KB JS bundle (174 KB gzip)**
  because routes are statically imported in `router.tsx` — no `React.lazy()`
  code-splitting exists yet. If the real audit comes in under the Performance
  ≥ 80 threshold, this is the first thing to fix (dynamic `import()` per route
  page, per the story's own Dev Notes §ξ "Common optimizers if needed").
  This was not changed in this story to avoid a large, high-risk routing
  refactor without being able to verify its effect via a working Lighthouse
  run in this environment.

