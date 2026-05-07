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

    public function test_customer_can_filter_restaurants_by_cuisine_and_read_cuisine_counts(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);
        $italian = Restaurant::factory()->create([
            'name' => 'Italian House',
            'settings' => ['cuisine_type' => 'Italian'],
        ]);
        Restaurant::factory()->create([
            'name' => 'Sushi House',
            'settings' => ['cuisine_type' => 'Sushi'],
        ]);

        $this->actingAs($customer, 'sanctum')
            ->getJson('/api/v1/customer/restaurants/cuisines')
            ->assertOk()
            ->assertJsonFragment([
                'title' => 'Italian',
                'restaurants_count' => 1,
            ])
            ->assertJsonFragment([
                'title' => 'Sushi',
                'restaurants_count' => 1,
            ]);

        $this->actingAs($customer, 'sanctum')
            ->getJson('/api/v1/customer/restaurants?cuisine=Italian')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $italian->id)
            ->assertJsonPath('data.0.cuisine_type', 'Italian');
    }

    public function test_customer_quick_cravings_come_from_available_menu_items(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);
        $restaurant = Restaurant::factory()->create([
            'name' => 'Live Burger House',
            'settings' => ['cuisine_type' => 'Burgers'],
        ]);
        $category = MenuCategory::factory()->create([
            'restaurant_id' => $restaurant->id,
            'name' => 'Burgers',
        ]);
        $item = MenuItem::factory()->create([
            'category_id' => $category->id,
            'name' => 'Smash Burger',
            'is_available' => true,
        ]);
        MenuItem::factory()->create([
            'category_id' => $category->id,
            'name' => 'Unavailable Burger',
            'is_available' => false,
        ]);

        $this->actingAs($customer, 'sanctum')
            ->getJson('/api/v1/customer/quick-cravings')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.menu_item.id', $item->id)
            ->assertJsonPath('data.0.menu_item.title', 'Smash Burger')
            ->assertJsonPath('data.0.restaurant.id', $restaurant->id);
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
            ->postJson('/api/v1/customer/orders', [
                'delivery_address' => [
                    'city' => 'Beirut',
                    'street' => 'Hamra Main Street',
                    'building' => '12B',
                    'floor' => '3',
                    'apartment' => 'A',
                    'landmark' => 'Near the pharmacy',
                ],
                'delivery_phone' => '+96170123456',
                'order_notes' => 'Leave at reception.',
                'payment_method' => 'cash_on_delivery',
                'delivery_mode' => 'now',
            ]);

        $orderResponse->assertCreated()
            ->assertJsonPath('data.restaurant_id', $restaurant->id)
            ->assertJsonPath('data.customer_id', $customer->id)
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.delivery_address.city', 'Beirut')
            ->assertJsonPath('data.delivery_phone', '+96170123456')
            ->assertJsonPath('data.order_notes', 'Leave at reception.')
            ->assertJsonPath('data.payment_method', 'cash_on_delivery');

        $this->assertDatabaseHas('orders', [
            'customer_id' => $customer->id,
            'restaurant_id' => $restaurant->id,
            'status' => 'pending',
            'subtotal' => 40,
            'fees' => 4,
            'total' => 44,
            'delivery_phone' => '+96170123456',
            'order_notes' => 'Leave at reception.',
            'payment_method' => 'cash_on_delivery',
        ]);

        $this->assertDatabaseHas('order_items', [
            'menu_item_id' => $item->id,
            'quantity' => 2,
            'unit_price' => 20,
        ]);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $restaurant->owner_user_id,
            'type' => 'restaurant_order',
            'title' => 'New order received',
            'body' => 'You received a new order.',
        ]);

        $this->actingAs($customer, 'sanctum')
            ->getJson('/api/v1/customer/orders/history')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_customer_cart_items_are_split_by_restaurant(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);

        $firstRestaurant = Restaurant::factory()->create(['name' => 'First Kitchen']);
        $firstCategory = MenuCategory::factory()->create(['restaurant_id' => $firstRestaurant->id]);
        $firstItem = MenuItem::factory()->create(['category_id' => $firstCategory->id]);

        $secondRestaurant = Restaurant::factory()->create(['name' => 'Second Kitchen']);
        $secondCategory = MenuCategory::factory()->create(['restaurant_id' => $secondRestaurant->id]);
        $secondItem = MenuItem::factory()->create(['category_id' => $secondCategory->id]);

        $this->actingAs($customer, 'sanctum')
            ->postJson('/api/v1/customer/cart/items', [
                'menu_item_id' => $firstItem->id,
                'quantity' => 1,
            ])
            ->assertOk();

        $this->actingAs($customer, 'sanctum')
            ->postJson('/api/v1/customer/cart/items', [
                'menu_item_id' => $secondItem->id,
                'quantity' => 2,
            ])
            ->assertOk();

        $this->actingAs($customer, 'sanctum')
            ->getJson('/api/v1/customer/carts')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonFragment([
                'restaurant_id' => $firstRestaurant->id,
                'restaurant_name' => 'First Kitchen',
            ])
            ->assertJsonFragment([
                'restaurant_id' => $secondRestaurant->id,
                'restaurant_name' => 'Second Kitchen',
            ]);

        $this->assertDatabaseHas('carts', [
            'customer_id' => $customer->id,
            'restaurant_id' => $firstRestaurant->id,
        ]);
        $this->assertDatabaseHas('carts', [
            'customer_id' => $customer->id,
            'restaurant_id' => $secondRestaurant->id,
        ]);
    }
}
