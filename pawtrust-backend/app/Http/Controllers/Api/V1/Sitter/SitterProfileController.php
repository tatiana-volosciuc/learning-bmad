<?php

namespace App\Http\Controllers\Api\V1\Sitter;

use App\Http\Controllers\Controller;
use App\Http\Requests\SitterProfileRequest;
use App\Http\Resources\SitterProfileResource;
use App\Models\SitterProfile;
use App\Services\SitterProfileService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SitterProfileController extends Controller
{
    public function __construct(private readonly SitterProfileService $profileService)
    {
    }

    public function store(SitterProfileRequest $request): JsonResponse
    {
        if ($request->user()->sitterProfile()->exists()) {
            return response()->json(['message' => 'A sitter profile already exists for this account.'], Response::HTTP_CONFLICT);
        }

        $profile = $this->profileService->createProfile($request->user(), $request->validated());

        return response()->json(['data' => new SitterProfileResource($profile)], 201);
    }

    public function update(SitterProfileRequest $request): JsonResponse
    {
        $profile = $request->user()->sitterProfile;

        if (!$profile) {
            return response()->json(['message' => 'Profile not found.'], 404);
        }

        $profile = $this->profileService->updateProfile($profile, $request->validated());

        return response()->json(['data' => new SitterProfileResource($profile)]);
    }

    public function myProfile(Request $request): JsonResponse
    {
        $profile = $request->user()->sitterProfile;

        if (!$profile) {
            return response()->json(['message' => 'Profile not found.'], 404);
        }

        $profile->load('portfolioPhotos');

        return response()->json(['data' => new SitterProfileResource($profile)]);
    }

    public function show(int $id): JsonResponse
    {
        $profile = SitterProfile::where('user_id', $id)->firstOrFail();

        $profile->load('portfolioPhotos');

        return response()->json(['data' => new SitterProfileResource($profile)]);
    }
}
