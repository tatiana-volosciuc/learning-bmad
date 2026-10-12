<?php

namespace App\Http\Controllers\Api\V1\Buyer;

use App\Http\Controllers\Controller;
use App\Http\Resources\ListingCardResource;
use App\Models\Listing;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SavedListingController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $paginator = $request->user()->savedListings()
            ->with(['photos', 'breederProfile'])
            ->latest('saved_listings.created_at')
            ->paginate(20);

        return response()->json([
            'data' => ListingCardResource::collection($paginator->items()),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
                'per_page'     => $paginator->perPage(),
                'total'        => $paginator->total(),
            ],
        ]);
    }

    public function store(Request $request, Listing $listing): JsonResponse
    {
        // Idempotent: attach() only inserts if not already present (unique constraint guards duplicates)
        $request->user()->savedListings()->syncWithoutDetaching([$listing->id]);

        return response()->json(['data' => ['saved' => true]]);
    }

    public function destroy(Request $request, Listing $listing): JsonResponse
    {
        $request->user()->savedListings()->detach($listing->id);

        return response()->json(['data' => ['saved' => false]]);
    }
}
