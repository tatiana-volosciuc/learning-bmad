<?php

namespace App\Services;

use App\Models\SitterProfile;
use App\Models\User;

class SitterProfileService
{
    public function createProfile(User $user, array $data): SitterProfile
    {
        return SitterProfile::create(array_merge($data, ['user_id' => $user->id]));
    }

    public function updateProfile(SitterProfile $profile, array $data): SitterProfile
    {
        $profile->update($data);

        return $profile->fresh();
    }
}
