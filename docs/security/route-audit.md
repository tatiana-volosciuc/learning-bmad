# Route Audit — Story 6.4

Generated via `php artisan route:list --path=api -v`. All 57 `api/v1/*` routes
reviewed below. "Auth" = `auth:sanctum` middleware present. "Role" = Spatie
`role:` middleware. Routes with neither are intentionally public.

| Method | URI                                         | Auth | Role    | Notes                                                                                         |
| ------ | ------------------------------------------- | ---- | ------- | --------------------------------------------------------------------------------------------- |
| POST   | /auth/register                              | —    | —       | Intentionally public (registration)                                                           |
| POST   | /auth/login                                 | —    | —       | Public, `throttle:10,1`                                                                       |
| POST   | /auth/logout                                | ✅   | —       | ✅                                                                                            |
| GET    | /auth/me                                    | ✅   | —       | ✅                                                                                            |
| DELETE | /account                                    | ✅   | —       | ✅ any authenticated role                                                                     |
| GET    | /account/export                             | ✅   | —       | ✅ `throttle:1,60`                                                                            |
| GET    | /breeders/{id}                              | —    | —       | Intentionally public (profile)                                                                |
| POST   | /breeders/{id}/reviews                      | ✅   | buyer   | ✅                                                                                            |
| GET    | /breeds                                     | —    | —       | Intentionally public (reference data)                                                         |
| GET    | /health                                     | —    | —       | Intentionally public (health check)                                                           |
| GET    | /listings                                   | —    | —       | Intentionally public (search)                                                                 |
| POST   | /listings                                   | ✅   | breeder | ✅                                                                                            |
| GET    | /listings/{id}                              | —    | —       | Intentionally public (detail)                                                                 |
| GET    | /listings/{id}/reviews                      | —    | —       | Intentionally public                                                                          |
| PUT    | /listings/{listing}                         | ✅   | breeder | ✅ (ownership checked in controller)                                                          |
| DELETE | /listings/{listing}                         | ✅   | breeder | ✅ (ownership checked in controller)                                                          |
| POST   | /listings/{listing}/health-certificate      | ✅   | breeder | ✅                                                                                            |
| POST   | /listings/{listing}/inquire                 | ✅   | buyer   | ✅ now rate-limited 5/hour/IP (added this story)                                              |
| POST   | /listings/{listing}/payment/initiate        | ✅   | breeder | ✅                                                                                            |
| POST   | /listings/{listing}/photos                  | ✅   | breeder | ✅                                                                                            |
| DELETE | /listings/{listing}/photos/{photo}          | ✅   | breeder | ✅                                                                                            |
| POST   | /listings/{listing}/upgrade-to-featured     | ✅   | breeder | ✅                                                                                            |
| GET    | /breeder/listings                           | ✅   | breeder | ✅                                                                                            |
| POST   | /breeder/profile                            | ✅   | breeder | ✅                                                                                            |
| PUT    | /breeder/profile                            | ✅   | breeder | ✅                                                                                            |
| GET    | /breeder/profile                            | ✅   | breeder | ✅                                                                                            |
| POST   | /breeder/profile/photo                      | ✅   | breeder | ✅                                                                                            |
| GET    | /breeder/inquiries                          | ✅   | breeder | ✅                                                                                            |
| GET    | /breeder/inquiries/unread-count             | ✅   | breeder | ✅                                                                                            |
| GET    | /breeder/inquiries/{inquiry}                | ✅   | breeder | ✅ (ownership checked in controller)                                                          |
| POST   | /breeders/{breederId}/documents             | ✅   | breeder | ✅                                                                                            |
| DELETE | /breeders/{breederId}/documents/{docId}     | ✅   | breeder | ✅                                                                                            |
| GET    | /breeders/{breederId}/documents/{docId}/url | ✅   | admin   | ✅                                                                                            |
| POST   | /verification-requests                      | ✅   | breeder | ✅                                                                                            |
| GET    | /verification-requests/status               | ✅   | breeder | ✅                                                                                            |
| GET    | /buyer/inquiries                            | ✅   | buyer   | ✅                                                                                            |
| GET    | /buyer/inquiries/{inquiry}                  | ✅   | buyer   | ✅ (ownership checked in controller)                                                          |
| GET    | /buyer/inquiry-exists                       | ✅   | buyer   | ✅                                                                                            |
| GET    | /buyer/review-exists                        | ✅   | buyer   | ✅                                                                                            |
| GET    | /buyer/reviews                              | ✅   | buyer   | ✅                                                                                            |
| GET    | /buyer/saved-listings                       | ✅   | buyer   | ✅                                                                                            |
| POST   | /buyer/saved-listings/{listing}/save        | ✅   | buyer   | ✅                                                                                            |
| DELETE | /buyer/saved-listings/{listing}/save        | ✅   | buyer   | ✅                                                                                            |
| GET    | /inquiries/{inquiry}/documents              | ✅   | —       | ✅ ownership enforced in controller, not role-gated (by design — either party to the inquiry) |
| GET    | /sitters                                    | —    | —       | Intentionally public (discovery)                                                              |
| GET    | /sitters/{id}                               | —    | —       | Intentionally public (profile)                                                                |
| POST   | /sitters/{id}/contact                       | —    | —       | Intentionally public (contact form), rate-limited 5/hour/IP in-service                        |
| POST   | /sitter/profile                             | ✅   | sitter  | ✅                                                                                            |
| PUT    | /sitter/profile                             | ✅   | sitter  | ✅                                                                                            |
| GET    | /sitter/profile                             | ✅   | sitter  | ✅                                                                                            |
| POST   | /sitter/profile/photos                      | ✅   | sitter  | ✅                                                                                            |
| DELETE | /sitter/profile/photos/{photo}              | ✅   | sitter  | ✅                                                                                            |
| GET    | /sitter/contact-submissions                 | ✅   | sitter  | ✅                                                                                            |
| GET    | /admin/verification-requests                | ✅   | admin   | ✅                                                                                            |
| PUT    | /admin/verification-requests/{id}/review    | ✅   | admin   | ✅                                                                                            |
| GET    | /admin/documents/{document}/preview         | ✅   | admin   | ✅                                                                                            |
| POST   | /webhooks/stripe                            | —    | —       | Intentionally public, Stripe signature verified in controller                                 |

## Conclusion

**No unintentionally public endpoints found.** All 12 intentionally-public
routes are either reference/discovery data, public profile/listing reads, or
externally-driven (webhook, contact form) — each either has no sensitive data
or has its own protection (rate limiting, Stripe signature).

**Gap found and fixed this story:** `POST /listings/{listing}/inquire` had no
rate limiting (AC9 requires 5/hour/IP like the sitter contact form). Added
in-service `RateLimiter` (mirrors `SitterContactService`'s existing pattern)
in `InquiryService::submit()`.

