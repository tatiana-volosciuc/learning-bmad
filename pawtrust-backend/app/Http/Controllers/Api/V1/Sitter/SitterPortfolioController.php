<?php

namespace App\Http\Controllers\Api\V1\Sitter;

use App\Http\Controllers\Controller;
use App\Http\Resources\SitterProfileResource;
use App\Models\SitterPortfolioPhoto;
use App\Services\SitterPortfolioService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SitterPortfolioController extends Controller
{
    public function __construct(private readonly SitterPortfolioService $portfolioService)
    {
    }

    public function store(Request $request): JsonResponse
    {
        $profile = $request->user()->sitterProfile;

        if (!$profile) {
            return response()->json(['message' => 'Profile not found.'], 404);
        }

        $request->validate([
            'photo' => ['required', 'file', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $this->portfolioService->upload($profile, $request->file('photo'));

        $profile->load('portfolioPhotos');

        return response()->json(['data' => new SitterProfileResource($profile)], 201);
    }

    public function destroy(Request $request, SitterPortfolioPhoto $photo): JsonResponse
    {
        $profile = $request->user()->sitterProfile;

        if (!$profile || $photo->sitter_profile_id !== $profile->id) {
            abort(404);
        }

        $this->portfolioService->delete($photo);

        return response()->json(null, 204);
    }
}
