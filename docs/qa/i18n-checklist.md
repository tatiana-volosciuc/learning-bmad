# i18n QA Checklist — Story 6.1

Manual walkthrough to complete before launch sign-off. Check each box after
verifying the screen shows no English text and all copy reads naturally in
the target language.

## Core screens

1. [ ] RO [ ] RU — Homepage / Landing page
2. [ ] RO [ ] RU — Browse Listings page (`/search`)
3. [ ] RO [ ] RU — Listing Detail page (`/listings/:id`)
4. [ ] RO [ ] RU — Breeder Profile page (public, `/breeders/:id`)
5. [ ] RO [ ] RU — Login / Registration pages
6. [ ] RO [ ] RU — Buyer Dashboard (Inquiries / Reviews / Saved)
7. [ ] RO [ ] RU — Breeder Dashboard (Listings / Verification / Inquiries)
8. [ ] RO [ ] RU — Sitter Discovery page (`/sitters`)
9. [ ] RO [ ] RU — Sitter Profile page (public)
10. [ ] RO [ ] RU — Contact forms / modals (Inquiry, Review, Sitter Contact)

## Transactional emails (test via `MAIL_MAILER=log`, both `users.locale` values)

- [ ] RO [ ] RU — Breeder: new inquiry notification
- [ ] RO [ ] RU — Admin: new verification request notification
- [ ] RO [ ] RU — Breeder: verification under review
- [ ] RO [ ] RU — Breeder: verification approved
- [ ] RO [ ] RU — Breeder: verification rejected
- [ ] RO [ ] RU — Sitter: contact message notification

## Cross-cutting checks

- [ ] Language toggle (RO / RU) in the nav switches all visible UI text instantly, no page reload.
- [ ] Selected language persists across page reloads (stored in `localStorage`).
- [ ] No raw translation keys (e.g. `nav.browse_listings`) visible anywhere.
- [ ] Dates render as `DD.MM.YYYY` throughout.
- [ ] Prices render as `€X` throughout, in both locales.
- [ ] API validation errors (4xx responses) are in the signed-in user's locale, or in the `Accept-Language` locale for guests.

