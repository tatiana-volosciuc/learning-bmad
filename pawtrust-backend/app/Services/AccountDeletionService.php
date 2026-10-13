<?php

namespace App\Services;

use App\Jobs\DeleteUserS3DocumentsJob;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class AccountDeletionService
{
    public function deleteAccount(User $user): void
    {
        DB::transaction(function () use ($user) {
            // Anonymize before soft-deleting so the trashed record itself holds no PII.
            $user->forceFill([
                'name'  => 'Deleted User',
                'email' => "deleted_{$user->id}@pawtrust.md",
            ])->save();

            $user->tokens()->delete();

            // NOTE: listings/breeder_profiles/sitter_profiles are NOT cascaded here —
            // they remain in place but become inaccessible once the owning user is
            // deleted (see Story 6.2 Dev Notes §1/§3). A stricter cascade is post-MVP.
            // TODO: cascade soft-delete to breeder_profiles and listings on user deletion
            $user->delete();
        });

        DeleteUserS3DocumentsJob::dispatch($user->id)->delay(now()->addMinutes(5));
    }
}
