<?php

namespace Tests\Feature\Api\V1\Admin;

use App\Enums\OrderStatus;
use App\Enums\UserRole;
use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\Report;
use App\Models\Restaurant;
use App\Models\SupportRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminDashboardApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_dashboard_returns_real_stats(): void
    {
        $admin = User::factory()->create([
            'role' => UserRole::Admin->value,
        ]);
        $owner = User::factory()->create([
            'role' => UserRole::RestaurantOwner->value,
        ]);
        $customer = User::factory()->create([
            'role' => UserRole::Customer->value,
        ]);
        $restaurant = Restaurant::factory()->create([
            'owner_user_id' => $owner->id,
            'status' => 'active',
        ]);
        $category = MenuCategory::factory()->create([
            'restaurant_id' => $restaurant->id,
        ]);
        MenuItem::factory()->create([
            'category_id' => $category->id,
        ]);
        Order::factory()->create([
            'customer_id' => $customer->id,
            'restaurant_id' => $restaurant->id,
            'status' => OrderStatus::Delivered->value,
            'total' => 42.75,
        ]);
        Order::factory()->create([
            'customer_id' => $customer->id,
            'restaurant_id' => $restaurant->id,
            'status' => OrderStatus::Pending->value,
            'total' => 18.25,
        ]);
        Report::query()->create([
            'reporter_user_id' => $customer->id,
            'restaurant_id' => $restaurant->id,
            'subject' => 'Incorrect listing',
            'message' => 'The listing needs review.',
            'status' => 'open',
        ]);
        SupportRequest::query()->create([
            'user_id' => $customer->id,
            'subject' => 'Need help',
            'message' => 'Please help.',
            'status' => 'open',
        ]);

        $token = $admin->createToken('test-admin')->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/admin/dashboard')
            ->assertOk()
            ->assertJsonPath('data.stats.customers', 1)
            ->assertJsonPath('data.stats.restaurant_owners', 1)
            ->assertJsonPath('data.stats.restaurants', 1)
            ->assertJsonPath('data.stats.active_restaurants', 1)
            ->assertJsonPath('data.stats.menu_items', 1)
            ->assertJsonPath('data.stats.orders', 2)
            ->assertJsonPath('data.stats.pending_orders', 1)
            ->assertJsonPath('data.stats.total_revenue', 42.75)
            ->assertJsonPath('data.stats.reported_content', 1)
            ->assertJsonPath('data.stats.open_support_requests', 1)
            ->assertJsonCount(2, 'data.recent_orders')
            ->assertJsonCount(1, 'data.recent_reports');
    }

    public function test_admin_can_read_and_update_restaurant_menu_items(): void
    {
        $admin = User::factory()->create([
            'role' => UserRole::Admin->value,
        ]);
        $restaurant = Restaurant::factory()->create();
        $category = MenuCategory::factory()->create([
            'restaurant_id' => $restaurant->id,
            'name' => 'Burgers',
        ]);
        $item = MenuItem::factory()->create([
            'category_id' => $category->id,
            'name' => 'Classic Burger',
            'price' => 12.50,
        ]);

        $token = $admin->createToken('test-admin')->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/v1/admin/restaurants/{$restaurant->id}/menu")
            ->assertOk()
            ->assertJsonPath('data.menu_items.0.name', 'Classic Burger')
            ->assertJsonPath('data.categories.0.name', 'Burgers');

        $this->withHeader('Authorization', "Bearer {$token}")
            ->patchJson("/api/v1/admin/menu-items/{$item->id}", [
                'name' => 'Signature Burger',
                'category' => 'Combos',
                'price' => 10,
                'is_available' => false,
            ])
            ->assertOk()
            ->assertJsonPath('data.name', 'Signature Burger')
            ->assertJsonPath('data.category', 'Combos')
            ->assertJsonPath('data.price', 11)
            ->assertJsonPath('data.is_available', false);

        $this->assertDatabaseHas('menu_items', [
            'id' => $item->id,
            'name' => 'Signature Burger',
            'price' => 11,
            'is_available' => false,
        ]);
    }
}
