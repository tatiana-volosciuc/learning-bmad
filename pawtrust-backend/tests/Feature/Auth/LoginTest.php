<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LoginTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create([
            'email'    => 'ion@example.com',
            'password' => bcrypt('password123'),
            'role'     => 'buyer',
        ]);
    }

    public function test_user_can_login_with_valid_credentials(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email'    => 'ion@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['data' => ['token', 'user' => ['id', 'name', 'email', 'role']]]);
    }

    public function test_login_fails_with_wrong_password(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email'    => 'ion@example.com',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(401)
            ->assertJson(['message' => __('errors.invalid_credentials')]);
    }

    public function test_login_fails_with_nonexistent_email(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email'    => 'nobody@example.com',
            'password' => 'password123',
        ]);

        // MUST return same message as wrong password — no enumeration
        $response->assertStatus(401)
            ->assertJson(['message' => __('errors.invalid_credentials')]);
    }

    public function test_login_response_does_not_expose_password(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email'    => 'ion@example.com',
            'password' => 'password123',
        ]);

        $response->assertJsonMissing(['password']);
    }

    public function test_user_can_logout(): void
    {
        $tokenStr = $this->user->createToken('test')->plainTextToken;

        $response = $this->withToken($tokenStr)
            ->postJson('/api/v1/auth/logout');

        $response->assertStatus(200);
        $this->assertDatabaseMissing('personal_access_tokens', [
            'tokenable_id' => $this->user->id,
        ]);
    }

    public function test_logout_requires_authentication(): void
    {
        $this->postJson('/api/v1/auth/logout')
            ->assertStatus(401);
    }

    public function test_me_endpoint_returns_authenticated_user(): void
    {
        $token = $this->user->createToken('test')->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/v1/auth/me')
            ->assertStatus(200)
            ->assertJsonPath('data.email', 'ion@example.com');
    }

    public function test_protected_route_rejects_deleted_token(): void
    {
        $token = $this->user->createToken('test')->plainTextToken;
        $this->user->tokens()->delete();

        $this->withToken($token)
            ->getJson('/api/v1/auth/me')
            ->assertStatus(401);
    }

    public function test_login_rate_limiter_returns_429(): void
    {
        for ($i = 0; $i < 10; $i++) {
            $this->postJson('/api/v1/auth/login', [
                'email'    => 'ion@example.com',
                'password' => 'wrongpassword',
            ]);
        }

        $this->postJson('/api/v1/auth/login', [
            'email'    => 'ion@example.com',
            'password' => 'wrongpassword',
        ])->assertStatus(429);
    }
}
