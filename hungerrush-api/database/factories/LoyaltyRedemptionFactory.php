<?php

namespace Database\Factories;

use App\Models\LoyaltyMember;
use App\Models\LoyaltyRedemption;
use App\Models\LoyaltyReward;
use App\Models\Restaurant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<LoyaltyRedemption>
 */
class LoyaltyRedemptionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'restaurant_id' => Restaurant::factory(),
            'loyalty_member_id' => LoyaltyMember::factory(),
            'loyalty_reward_id' => LoyaltyReward::factory(),
            'points_spent' => fake()->numberBetween(50, 800),
        ];
    }
}

