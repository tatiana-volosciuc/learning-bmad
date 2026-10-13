<?php

namespace Database\Factories;

use App\Models\BreederProfile;
use Illuminate\Database\Eloquent\Factories\Factory;

class ListingFactory extends Factory
{
    public function definition(): array
    {
        return [
            'breeder_profile_id' => BreederProfile::factory(),
            'title'              => $this->faker->sentence(4),
            'description'        => $this->faker->paragraph(),
            'species'            => $this->faker->randomElement(['dog', 'cat', 'other']),
            'breed'              => $this->faker->words(2, true),
            'gender'             => $this->faker->randomElement(['male', 'female']),
            'date_of_birth'      => $this->faker->dateTimeBetween('-2 years', '-2 months')->format('Y-m-d'),
            'price'              => $this->faker->randomFloat(2, 100, 2000),
            'currency'           => $this->faker->randomElement(['EUR', 'MDL', 'RON']),
            'location'           => $this->faker->city(),
            'status'             => 'draft',
            'listing_type'       => 'standard',
            'featured_until'     => null,
            'health_certificate_key' => null,
        ];
    }

    public function active(): static
    {
        return $this->state(['status' => 'active']);
    }

    public function featured(): static
    {
        return $this->state([
            'status'         => 'active',
            'listing_type'   => 'featured',
            'featured_until' => now()->addDays(7),
            'is_featured'    => true,
        ]);
    }
}
