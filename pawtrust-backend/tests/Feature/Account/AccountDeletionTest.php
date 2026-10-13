<?php

namespace Tests\Feature\Account;

use App\Jobs\DeleteUserS3DocumentsJob;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class AccountDeletionTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
        $this->user = User::factory()->create(['role' => 'buyer']);
        $this->user->assignRole('buyer');
    }

    public function test_user_can_delete_their_account(): void
    {
        $this->actingAs($this->user, 'sanctum')
            ->deleteJson('/api/v1/account')
            ->assertStatus(200);
    }

    public function test_account_deletion_anonymizes_name_and_email(): void
    {
        $originalId = $this->user->id;

        $this->actingAs($this->user, 'sanctum')
            ->deleteJson('/api/v1/account');

        $updated = User::withTrashed()->find($originalId);
        $this->assertEquals('Deleted User', $updated->name);
        $this->assertEquals("deleted_{$originalId}@pawtrust.md", $updated->email);
        $this->assertNotNull($updated->deleted_at);
    }

    public function test_account_deletion_revokes_all_tokens(): void
    {
        $this->user->createToken('test-token');
        $this->assertCount(1, $this->user->tokens);

        $this->actingAs($this->user, 'sanctum')
            ->deleteJson('/api/v1/account');

        $this->assertCount(0, User::withTrashed()->find($this->user->id)->tokens);
    }

    public function test_deleted_account_cannot_login(): void
    {
        $email = $this->user->email;
        $token = $this->user->createToken('test-token')->plainTextToken;

        // Use a bearer token directly (not actingAs) — actingAs() changes the
        // default auth guard for the rest of the test, which breaks the plain
        // session-guard Auth::attempt() call made by the subsequent login request.
        $this->withHeader('Authorization', "Bearer {$token}")
            ->deleteJson('/api/v1/account')
            ->assertStatus(200);

        $this->postJson('/api/v1/auth/login', [
            'email'    => $email,
            'password' => 'password',
        ])->assertStatus(401);
    }

    public function test_s3_deletion_job_is_dispatched_on_account_deletion(): void
    {
        Queue::fake();

        $userId = $this->user->id;

        $this->actingAs($this->user, 'sanctum')
            ->deleteJson('/api/v1/account');

        Queue::assertPushed(DeleteUserS3DocumentsJob::class, fn ($job) => $job->userId === $userId);
    }

    public function test_unauthenticated_user_cannot_delete_account(): void
    {
        $this->deleteJson('/api/v1/account')
            ->assertStatus(401);
    }
}
