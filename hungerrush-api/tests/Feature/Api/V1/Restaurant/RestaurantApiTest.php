<?php

namespace Tests\Feature\Api\V1\Restaurant;

use App\Models\Order;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RestaurantApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_restaurant_owner_can_manage_categories(): void
    {
        $owner = User::factory()->create(['role' => 'restaurant_owner']);
        Restaurant::factory()->create(['owner_user_id' => $owner->id]);

        $response = $this->actingAs($owner, 'sanctum')
            ->postJson('/api/v1/restaurant/menu/categories', [
                'name' => 'Burgers',
                'sort_order' => 1,
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.name', 'Burgers');
    }

    public function test_restaurant_owner_can_transition_order_status_with_valid_flow(): void
    {
        $owner = User::factory()->create(['role' => 'restaurant_owner']);
        $restaurant = Restaurant::factory()->create(['owner_user_id' => $owner->id]);
        $order = Order::factory()->create([
            'restaurant_id' => $restaurant->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($owner, 'sanctum')
            ->patchJson("/api/v1/restaurant/orders/{$order->id}/status", [
                'status' => 'accepted',
            ]);

        $response->assertOk()->assertJsonPath('data.status', 'accepted');
    }

    public function test_invalid_order_transition_returns_error(): void
    {
        $owner = User::factory()->create(['role' => 'restaurant_owner']);
        $restaurant = Restaurant::factory()->create(['owner_user_id' => $owner->id]);
        $order = Order::factory()->create([
            'restaurant_id' => $restaurant->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($owner, 'sanctum')
            ->patchJson("/api/v1/restaurant/orders/{$order->id}/status", [
                'status' => 'delivered',
            ]);

        $response->assertUnprocessable()
            ->assertJsonPath('code', 'invalid_order_transition');
    }

    public function test_restaurant_owner_can_cancel_order_until_before_delivered(): void
    {
        $owner = User::factory()->create(['role' => 'restaurant_owner']);
        $restaurant = Restaurant::factory()->create(['owner_user_id' => $owner->id]);

        $inTransitOrder = Order::factory()->create([
            'restaurant_id' => $restaurant->id,
            'status' => 'on_the_way',
        ]);

        $this->actingAs($owner, 'sanctum')
            ->patchJson("/api/v1/restaurant/orders/{$inTransitOrder->id}/status", [
                'status' => 'cancelled',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'cancelled');

        $deliveredOrder = Order::factory()->create([
            'restaurant_id' => $restaurant->id,
            'status' => 'delivered',
        ]);

        $this->actingAs($owner, 'sanctum')
            ->patchJson("/api/v1/restaurant/orders/{$deliveredOrder->id}/status", [
                'status' => 'cancelled',
            ])
            ->assertUnprocessable()
            ->assertJsonPath('code', 'invalid_order_transition');
    }
}
