<?php

namespace Tests\Feature\Api\V1\Customer;

use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CustomerApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_can_browse_restaurants_and_menu(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);
        $restaurant = Restaurant::factory()->create();
        $category = MenuCategory::factory()->create(['restaurant_id' => $restaurant->id]);
        MenuItem::factory()->create(['category_id' => $category->id]);

        $this->actingAs($customer, 'sanctum')
            ->getJson('/api/v1/customer/restaurants')
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->actingAs($customer, 'sanctum')
            ->getJson("/api/v1/customer/restaurants/{$restaurant->id}/menu")
            ->assertOk()
            ->assertJsonPath('data.restaurant.id', $restaurant->id);
    }

    public function test_customer_can_add_items_to_cart_and_place_order(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);
        $restaurant = Restaurant::factory()->create();
        $category = MenuCategory::factory()->create(['restaurant_id' => $restaurant->id]);
        $item = MenuItem::factory()->create(['category_id' => $category->id, 'price' => 20]);

        $this->actingAs($customer, 'sanctum')
            ->postJson('/api/v1/customer/cart/items', [
                'menu_item_id' => $item->id,
                'quantity' => 2,
            ])
            ->assertOk();

        $orderResponse = $this->actingAs($customer, 'sanctum')
            ->postJson('/api/v1/customer/orders', []);

        $orderResponse->assertCreated()
            ->assertJsonPath('data.restaurant_id', $restaurant->id);

        $this->actingAs($customer, 'sanctum')
            ->getJson('/api/v1/customer/orders/history')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }
}
