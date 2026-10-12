<?php

namespace App\Http\Controllers\Api\V1\Sitter;

use App\Http\Controllers\Controller;
use App\Http\Resources\Sitter\SitterContactSubmissionResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SitterDashboardController extends Controller
{
    public function contactSubmissions(Request $request): JsonResponse
    {
        $profile = $request->user()->sitterProfile;

        if (!$profile) {
            return response()->json(['message' => 'Profile not found.'], 404);
        }

        $submissions = $profile->contactSubmissions()->paginate(20);

        return response()->json([
            'data' => SitterContactSubmissionResource::collection($submissions),
            'meta' => [
                'current_page' => $submissions->currentPage(),
                'last_page'    => $submissions->lastPage(),
                'total'        => $submissions->total(),
            ],
        ]);
    }
}
