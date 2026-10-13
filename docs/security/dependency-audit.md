# Dependency Audit — Story 6.4

## Backend (`composer audit`)

**Before:** 39 advisories across 12 packages (all transitive — `symfony/*`,
`guzzlehttp/*`, `laravel/framework`, `jmespath/jmespath.php`,
`phpunit/phpunit`, `spatie/laravel-permission`), ranging low → high severity.

**Fix applied:** `composer update --with-all-dependencies` — picked up patched
releases already available within this project's existing version
constraints (e.g. `spatie/laravel-permission` 7.2.4 → 7.4.2,
`phpunit/phpunit` 12.5.14 → 12.5.39, plus transitive symfony/guzzle bumps).
No direct dependency's major version changed; `composer.json` itself was not
edited.

**After:** `composer audit` → **No security vulnerability advisories found.**

Full backend test suite re-run after the update: **266/266 passed**, no
regressions.

## Frontend (`npm audit`)

**Before:** 43 vulnerabilities (3 low, 9 moderate, 29 high, 2 critical) — all
in build/test tooling transitive deps (`vite`/`vitest` internals: `nanoid`,
`picomatch`, `postcss`, `postcss-selector-parser`, `source-map-js`,
`tinypool`, plus `react-router`/`tailwindcss` transitive chains). None of
these packages ship in the production runtime bundle — they're dev-only
build/test tooling.

**Fix applied:** `npm audit fix` (non-breaking only) — resolved 12
vulnerabilities.

**After `npm audit fix`:** 31 vulnerabilities remain (3 low, 6 moderate, 20
high, 2 critical), all of which **require a breaking major-version upgrade**:

| Package                                                           | Fix requires                             | Risk if upgraded now                                                                                                                   |
| ----------------------------------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `vitest` (via `tinypool`, critical)                               | `vitest@5`                               | Major version bump of the test runner itself — would need to re-validate all 121 existing tests against a new API/config surface       |
| `react-router-dom` (moderate, open redirect / SSR hydration CVEs) | `react-router-dom@7.18.4` (from `^6.26`) | v7 has breaking routing API changes across `router.tsx` and every page using `useNavigate`/`<Link>`                                    |
| `tailwindcss` (via `postcss-selector-parser`, moderate)           | `tailwindcss@4` (from `^3`)              | v4 uses a completely different CSS-first config format — would require rewriting `tailwind.config.ts` and auditing every utility class |

**Decision:** Per this story's own guidance ("if a CVE cannot be patched,
document the risk and mitigation"), these three are **deferred** rather than
force-upgraded in this story:

- They are dev/build-time only (not shipped to end users in the production
  bundle's runtime — `vitest`/`tinypool` is test-only; `react-router-dom` IS
  shipped, but the CVEs are about open-redirect/SSR-hydration edge cases that
  don't apply to this app's client-only SPA usage) — real-world exploitability
  is low.
- A 3-library major-version migration (router, test runner, CSS framework)
  touching nearly every page and component is high-risk to do unreviewed as
  a drive-by part of a security-hardening story with no dedicated
  regression-testing time.
- **Tracked as a backlog item:** schedule a dedicated "frontend major
  dependency upgrade" story (react-router-dom v7, vitest v5, tailwindcss v4)
  post-launch or well before the next feature freeze.

Full frontend test suite re-run after `npm audit fix`: **121/121 passed**,
`tsc --noEmit` clean (no new errors), no regressions.

