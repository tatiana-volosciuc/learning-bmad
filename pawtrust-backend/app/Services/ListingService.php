<?php

namespace App\Services;

use App\Models\Listing;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Validation\ValidationException;

class ListingService
{
    public function create(User $user, array $data): Listing
    {
        $profile = $user->breederProfile;

        if (!$profile) {
            throw ValidationException::withMessages([
                'profile' => 'You must create a breeder profile before creating a listing.',
            ]);
        }

        $skipPayment = config('app.skip_listing_payment');
        $status      = $skipPayment ? 'active' : 'pending_payment';
        $listingType = $data['listing_type'] ?? 'standard';

        return Listing::create(array_merge($data, [
            'breeder_profile_id' => $profile->id,
            'status'             => $status,
            'listed_at'          => $skipPayment ? now() : null,
            // A listing bought as 'featured' upfront is featured as soon as it goes active —
            // no separate upgrade payment needed (Story 5.4 AC2).
            'is_featured'        => $skipPayment && $listingType === 'featured',
        ]));
    }

    public function update(Listing $listing, array $data): Listing
    {
        $listing->update($data);

        return $listing->fresh();
    }

    public function softDelete(Listing $listing): void
    {
        $listing->delete();
    }

    public function getListingWithPhotos(int $id): Listing
    {
        return Listing::with(['photos', 'breederProfile'])->findOrFail($id);
    }

    public function search(array $filters): LengthAwarePaginator
    {
        $query = Listing::with([
            'breederProfile',
            'photos' => fn ($q) => $q->where('sort_order', 0),
        ])->where('status', 'active');

        if (!empty($filters['q'])) {
            $q = $filters['q'];
            $query->whereRaw('MATCH(title, description, breed) AGAINST(? IN BOOLEAN MODE)', [$q . '*']);
        }

        if (!empty($filters['species'])) {
            $query->where('species', $filters['species']);
        }
        if (!empty($filters['breed'])) {
            $query->where('breed', 'like', '%' . $filters['breed'] . '%');
        }
        if (!empty($filters['location_city'])) {
            $query->where('location', 'like', '%' . $filters['location_city'] . '%');
        }
        if (!empty($filters['location_region'])) {
            $query->where('location', 'like', '%' . $filters['location_region'] . '%');
        }
        if (isset($filters['price_min']) && $filters['price_min'] !== null) {
            $query->where('price', '>=', $filters['price_min']);
        }
        if (isset($filters['price_max']) && $filters['price_max'] !== null) {
            $query->where('price', '<=', $filters['price_max']);
        }
        if (!empty($filters['verified_only'])) {
            $query->whereHas('breederProfile', fn ($q) => $q->whereNotNull('verified_at'));
        }

        // Featured listings sort first; within each tier, most recently listed first (Story 5.4 §3).
        $query->orderByDesc('is_featured')
              ->orderByDesc('listed_at');

        $perPage = $filters['per_page'] ?? 20;

        return $query->paginate($perPage);
    }
}
