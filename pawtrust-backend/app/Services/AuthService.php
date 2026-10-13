<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Support\Facades\Auth;
use Spatie\Permission\Models\Role;

class AuthService
{
    public function register(array $data): array
    {
        $user = User::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => $data['password'],
            'role'     => $data['role'],
            'locale'   => 'ro',
        ]);

        // Ensure role exists before assigning (idempotent for tests and fresh installs)
        Role::firstOrCreate(['name' => $data['role'], 'guard_name' => 'web']);

        $user->assignRole($data['role']);

        $token = $user->createToken('auth_token')->plainTextToken;

        return ['token' => $token, 'user' => $user];
    }

    public function login(array $credentials): array
    {
        // Explicit 'web' guard: the default guard can be left pointing at
        // 'sanctum' by an earlier authenticated request in the same cycle
        // (Illuminate\Auth\Middleware\Authenticate calls Auth::shouldUse()),
        // and RequestGuard has no attempt() method.
        if (!Auth::guard('web')->attempt(['email' => $credentials['email'], 'password' => $credentials['password']])) {
            throw new AuthenticationException('Invalid credentials.');
        }

        /** @var User $user */
        $user = Auth::guard('web')->user();

        // Revoke all previous tokens on re-login (MVP: single-device)
        $user->tokens()->delete();

        $token = $user->createToken('auth_token')->plainTextToken;

        return ['token' => $token, 'user' => $user];
    }

    public function logout(User $user): void
    {
        $user->currentAccessToken()->delete();
    }
}
