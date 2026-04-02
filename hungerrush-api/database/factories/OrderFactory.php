<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Order>
 */
class OrderFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'customer_id' => User::factory(),
            'restaurant_id' => Restaurant::factory(),
            'branch_id' => null,
            'subtotal' => 25,
            'fees' => 5,
            'total' => 30,
            'status' => 'pending',
            'payment_status' => 'unpaid',
        ];
    }
}
