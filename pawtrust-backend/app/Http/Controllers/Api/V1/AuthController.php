<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(private readonly AuthService $authService)
    {
    }

    public function register(RegisterRequest $request): JsonResponse
    {
        $result = $this->authService->register($request->validated());

        return response()->json([
            'data' => [
                'token' => $result['token'],
                'user'  => new UserResource($result['user']),
            ],
            'message' => __('errors.registration_successful'),
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $result = $this->authService->login($request->validated());

        return response()->json([
            'data' => [
                'token' => $result['token'],
                'user'  => new UserResource($result['user']),
            ],
            'message' => __('errors.login_successful'),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $this->authService->logout($request->user());

        return response()->json(['message' => __('errors.logged_out_successfully')]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user->role === 'breeder') {
            $user->load('breederProfile');
        }
        return response()->json(['data' => new UserResource($user)]);
    }
}
