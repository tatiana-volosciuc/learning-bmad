# S3 Bucket & Pre-signed URL Audit — Story 6.4

## Bucket-level access (infrastructure — confirm at deploy time, not code)

- The application **never writes to a public-read ACL** — all uploads go via
  `Storage::disk('s3')->put($key, $contents, 'private')` or the raw
  `S3Client` (`ImageConversionService`/`S3Service`), and no code path sets a
  `public-read` ACL anywhere in the codebase (confirmed via grep for
  `public-read` and `ACL` across `app/` — zero matches).
- **Action item for infra/deploy (not a code change):** confirm the S3
  bucket(s) backing this app have all four S3 Block Public Access settings
  enabled (`BlockPublicAcls`, `BlockPublicPolicy`, `IgnorePublicAcls`,
  `RestrictPublicBuckets` = `true`), and that photo delivery goes through
  CloudFront with an Origin Access Control (OAC), not direct bucket URLs.
  This must be verified in the AWS console/Terraform for the production
  bucket before launch — it cannot be verified from the application code.

## Pre-signed URL TTLs (verified in code)

| Resource                                       | TTL          | Source                                                                                                                                                                                                 |
| ---------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Listing/sitter/breeder photos (public display) | 24h (86400s) | `S3Service::presignedUrl()` default, used by `ListingPhotoResource`, `ListingCardResource`, `ListingSummaryResource`, `ListingResource::getOgImageUrl()`, `BuyerInquiryResource`, `SitterCardResource` |
| Breeder profile summary thumbnail              | 1h (3600s)   | `BreederSummaryResource`                                                                                                                                                                               |
| Post-inquiry document access (buyer/breeder)   | 1h (3600s)   | `InquiryDocumentService`                                                                                                                                                                               |
| Breeder's own verification document preview    | 15min (900s) | `BreederDocumentService::getPresignedUrl()`                                                                                                                                                            |
| Admin document preview                         | 15min (900s) | `AdminVerificationService::getDocumentPresignedUrl()`                                                                                                                                                  |

All TTLs are short-lived and scoped to their sensitivity (public display
photos get a longer TTL since they're not sensitive; verification documents
containing potentially personal information get the shortest TTL). No
endpoint returns a permanent or unbounded S3 URL.

## Path traversal check (document endpoints)

All document download/preview endpoints (`BreederDocumentController::url`,
`AdminVerificationController::documentPreview`) resolve the S3 key via
Eloquent route-model binding (`{document}` / `{docId}` → DB lookup), never
from a raw user-supplied path/filename query parameter. No path traversal
vector found.

## Conclusion

No application-level S3 exposure issues found. The one action item (bucket
Block Public Access + CloudFront OAC) is an infrastructure/deploy-time
confirmation, not a code change, and must be checked against the actual AWS
account before launch sign-off.

