# Raw SQL Audit — Story 6.4

Searched `app/` for `DB::statement`, `DB::unprepared`, `whereRaw`, `selectRaw`,
`havingRaw`, `orderByRaw`. Three matches, all safe:

## 1. `app/Http/Controllers/Api/V1/ListingController.php`

```php
->selectRaw('AVG(rating) as average, COUNT(*) as total')
```

No user input interpolated — pure aggregation function names. Safe.

## 2. `app/Services/ListingService.php`

```php
->whereRaw('MATCH(title, description, breed) AGAINST(? IN BOOLEAN MODE)', [$q . '*'])
```

User search term (`$q`) is passed through a parameterized `?` binding, not
string-interpolated into the SQL. Safe.

## 3. `app/Services/SitterDiscoveryService.php`

```php
->whereRaw('LOWER(service_areas) LIKE ?', ['%' . mb_strtolower($filters['service_area']) . '%'])
```

User input (`service_area` filter) is passed through a parameterized `?`
binding. Safe (this pattern was specifically chosen for case-insensitive JSON
`LIKE` filtering — MySQL JSON columns compare case-sensitively otherwise; see
repo memory, Story 5.2 notes).

## Conclusion

No raw SQL in this codebase interpolates user input directly into a query
string. All three matches use parameterized bindings. No changes required.

