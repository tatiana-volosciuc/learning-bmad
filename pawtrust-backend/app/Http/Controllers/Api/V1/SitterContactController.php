<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ContactSitterRequest;
use App\Models\SitterProfile;
use App\Services\SitterContactService;
use Illuminate\Http\JsonResponse;

class SitterContactController extends Controller
{
    public function __construct(private readonly SitterContactService $contactService)
    {
    }

    public function contact(ContactSitterRequest $request, int $id): JsonResponse
    {
        // {id} is the sitter's user_id - matches GET /sitters/{id} convention
        $profile = SitterProfile::where('user_id', $id)->firstOrFail();

        $this->contactService->submit($profile, $request->validated(), $request->ip());

        return response()->json(['message' => 'Your message has been sent.']);
    }
}
