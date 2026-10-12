<?php

namespace Database\Factories;

use App\Models\BreederProfile;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class BreederReviewFactory extends Factory
{
    public function definition(): array
    {
        return [
            'breeder_profile_id' => BreederProfile::factory(),
            'buyer_id'           => User::factory()->state(['role' => 'buyer']),
            'rating'             => $this->faker->numberBetween(1, 5),
            'text'               => $this->faker->paragraph(),
        ];
    }
}
