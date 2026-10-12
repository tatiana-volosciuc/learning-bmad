<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\BreederProfileRequest;
use App\Http\Resources\BreederProfilePublicResource;
use App\Http\Resources\BreederProfileResource;
use App\Models\BreederProfile;
use App\Services\BreederProfileService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class BreederProfileController extends Controller
{
    public function __construct(private readonly BreederProfileService $profileService)
    {
    }

    public function store(BreederProfileRequest $request): JsonResponse
    {
        if ($request->user()->breederProfile()->exists()) {
            return response()->json(['message' => 'Profile already exists.'], Response::HTTP_CONFLICT);
        }

        $data  = $request->validated();
        $photo = $request->file('profile_photo');

        $profile = $this->profileService->createProfile($request->user(), $data, $photo);

        return response()->json(['data' => new BreederProfileResource($profile)], 201);
    }

    public function update(BreederProfileRequest $request): JsonResponse
    {
        $profile = $request->user()->breederProfile;

        if (!$profile) {
            return response()->json(['message' => 'Profile not found.'], 404);
        }

        $data    = $request->validated();
        $photo   = $request->file('profile_photo');
        $profile = $this->profileService->updateProfile($profile, $data, $photo);

        return response()->json(['data' => new BreederProfileResource($profile)]);
    }

    public function myProfile(Request $request): JsonResponse
    {
        $profile = $request->user()->breederProfile;

        if (!$profile) {
            return response()->json(['message' => 'Profile not found.'], 404);
        }

        $profile->load(['documents' => fn ($q) => $q->whereNull('deleted_at')]);

        return response()->json(['data' => new BreederProfileResource($profile)]);
    }

    public function show(int $id): JsonResponse
    {
        $profile = BreederProfile::where('user_id', $id)->firstOrFail();

        $profile->load(['documents' => fn ($q) => $q->whereNull('deleted_at')->where('status', 'approved')]);
        $profile->load(['reviews' => fn ($q) => $q->with('buyer')->latest()->limit(20)]);

        return response()->json(['data' => new BreederProfilePublicResource($profile)]);
    }

    public function uploadPhoto(Request $request): JsonResponse
    {
        $request->validate([
            'profile_photo' => ['required', 'file', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $profile = $request->user()->breederProfile;

        if (!$profile) {
            return response()->json(['message' => 'Profile not found.'], 404);
        }

        $profile = $this->profileService->uploadPhoto($profile, $request->user(), $request->file('profile_photo'));

        return response()->json(['data' => new BreederProfileResource($profile)]);
    }
}
