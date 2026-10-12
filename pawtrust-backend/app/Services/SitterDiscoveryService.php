<?php

namespace App\Services;

use App\Models\SitterProfile;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class SitterDiscoveryService
{
    public function list(array $filters): LengthAwarePaginator
    {
        // First portfolio photo per sitter via a per-row filter (sort_order = 0), not limit(1) —
        // a limit() inside an eager-load closure applies globally across all parents, not per sitter.
        $query = SitterProfile::with(['portfolioPhotos' => fn ($q) => $q->where('sort_order', 0)])
            ->latest('updated_at');

        if (!empty($filters['service_area'])) {
            // LIKE on the JSON column — pragmatic MVP approach, full table scan.
            // TODO: normalize service_areas to a pivot table (sitter_service_areas) at scale.
            // MySQL compares JSON columns with LIKE using a case-sensitive binary collation
            // regardless of the table's collation, so both sides are lower-cased explicitly here.
            $query->whereRaw('LOWER(service_areas) LIKE ?', ['%' . mb_strtolower($filters['service_area']) . '%']);
        }

        if (!empty($filters['service'])) {
            $query->whereJsonContains('services', $filters['service']);
        }

        $perPage = $filters['per_page'] ?? 20;

        return $query->paginate($perPage);
    }
}
