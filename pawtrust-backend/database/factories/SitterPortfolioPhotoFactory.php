<?php

namespace Database\Factories;

use App\Models\SitterPortfolioPhoto;
use App\Models\SitterProfile;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SitterPortfolioPhoto>
 */
class SitterPortfolioPhotoFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'sitter_profile_id' => SitterProfile::factory(),
            's3_key'            => 'sitters/' . $this->faker->uuid() . '/portfolio/' . $this->faker->uuid() . '.jpg',
            'sort_order'        => 0,
        ];
    }
}
