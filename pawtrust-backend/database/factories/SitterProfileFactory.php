<?php

namespace Database\Factories;

use App\Models\SitterProfile;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SitterProfile>
 */
class SitterProfileFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id'          => User::factory()->state(['role' => 'sitter']),
            'full_name'        => $this->faker->name(),
            'bio'              => $this->faker->paragraph(),
            'service_areas'    => ['Chișinău'],
            'services'         => ['boarding', 'dog_walking'],
            'rates'            => '€15/night boarding',
            'experience_years' => $this->faker->numberBetween(1, 15),
            'languages'        => ['ro', 'ru'],
        ];
    }
}
