<?php

namespace Tests\Feature\Api\V1\Restaurant;

use App\Models\LoyaltyMember;
use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Restaurant;
use App\Models\Review;
use App\Models\User;
use App\Models\Video;
use App\Models\VideoEngagement;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class RestaurantExtendedApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_restaurant_owner_can_upload_menu_images_from_local_files(): void
    {
        $owner = User::factory()->create(['role' => 'restaurant_owner']);
        Restaurant::factory()->create(['owner_user_id' => $owner->id]);

        $response = $this->actingAs($owner, 'sanctum')
            ->post('/api/v1/restaurant/menu/images/upload', [
                'images' => [
                    UploadedFile::fake()->create('burger-1.jpg', 120, 'image/jpeg'),
                    UploadedFile::fake()->create('burger-2.png', 120, 'image/png'),
                ],
            ]);

        $response->assertCreated()
            ->assertJsonCount(2, 'data.urls');
    }

    public function test_restaurant_owner_can_create_menu_item_with_multiple_photos(): void
    {
        $owner = User::factory()->create(['role' => 'restaurant_owner']);
        $restaurant = Restaurant::factory()->create(['owner_user_id' => $owner->id]);
        $category = MenuCategory::factory()->create(['restaurant_id' => $restaurant->id]);
        $secondCategory = MenuCategory::factory()->create(['restaurant_id' => $restaurant->id]);

        $response = $this->actingAs($owner, 'sanctum')
            ->postJson('/api/v1/restaurant/menu/items', [
                'category_id' => $category->id,
                'name' => 'Photo Burger',
                'description' => 'Test burger with image gallery.',
                'ingredients' => 'Beef patty, cheddar cheese, lettuce, tomato, burger sauce',
                'image_urls' => [
                    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80',
                    'https://images.unsplash.com/photo-1550317138-10000687a72b?auto=format&fit=crop&w=900&q=80',
                ],
                'price' => 12.50,
                'is_available' => true,
                'prep_time' => 15,
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.name', 'Photo Burger')
            ->assertJsonPath('data.ingredients', 'Beef patty, cheddar cheese, lettuce, tomato, burger sauce')
            ->assertJsonPath('data.image_urls.0', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80')
            ->assertJsonPath('data.image_urls.1', 'https://images.unsplash.com/photo-1550317138-10000687a72b?auto=format&fit=crop&w=900&q=80');

        $menuItemId = $response->json('data.id');
        $this->assertDatabaseHas('menu_items', [
            'id' => $menuItemId,
            'ingredients' => 'Beef patty, cheddar cheese, lettuce, tomato, burger sauce',
        ]);

        $this->actingAs($owner, 'sanctum')
            ->patchJson("/api/v1/restaurant/menu/items/{$menuItemId}", [
                'category_id' => $secondCategory->id,
                'ingredients' => 'Beef patty, pickles, onions, mustard',
            ])
            ->assertOk()
            ->assertJsonPath('data.category_id', $secondCategory->id)
            ->assertJsonPath('data.ingredients', 'Beef patty, pickles, onions, mustard');

        $this->assertDatabaseHas('menu_items', [
            'id' => $menuItemId,
            'category_id' => $secondCategory->id,
        ]);

        $this->assertDatabaseMissing('menu_categories', [
            'id' => $category->id,
        ]);

        $this->actingAs($owner, 'sanctum')
            ->deleteJson("/api/v1/restaurant/menu/items/{$menuItemId}")
            ->assertOk()
            ->assertJsonPath('data.deleted', true);

        $this->assertDatabaseMissing('menu_categories', [
            'id' => $secondCategory->id,
        ]);
    }

    public function test_restaurant_owner_can_manage_videos(): void
    {
        $owner = User::factory()->create(['role' => 'restaurant_owner']);
        $restaurant = Restaurant::factory()->create(['owner_user_id' => $owner->id]);
        $category = MenuCategory::factory()->create(['restaurant_id' => $restaurant->id]);
        $menuItem = MenuItem::factory()->create(['category_id' => $category->id]);

        $createResponse = $this->actingAs($owner, 'sanctum')
            ->postJson('/api/v1/restaurant/videos', [
                'menu_item_id' => $menuItem->id,
                'title' => 'Burger Build',
                'description' => 'How we build the signature burger.',
                'media_url' => 'https://example.com/video.mp4',
                'thumbnail_url' => 'https://example.com/thumb.jpg',
                'status' => 'draft',
            ]);

        $createResponse->assertCreated()
            ->assertJsonPath('data.title', 'Burger Build');

        $videoId = $createResponse->json('data.id');

        $this->actingAs($owner, 'sanctum')
            ->patchJson("/api/v1/restaurant/videos/{$videoId}", [
                'status' => 'published',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'published');

        $this->actingAs($owner, 'sanctum')
            ->getJson('/api/v1/restaurant/videos?q=burger')
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->actingAs($owner, 'sanctum')
            ->deleteJson("/api/v1/restaurant/videos/{$videoId}")
            ->assertOk()
            ->assertJsonPath('data.deleted', true);
    }

    public function test_restaurant_owner_can_create_quick_order(): void
    {
        $owner = User::factory()->create(['role' => 'restaurant_owner']);
        $restaurant = Restaurant::factory()->create(['owner_user_id' => $owner->id]);
        $category = MenuCategory::factory()->create(['restaurant_id' => $restaurant->id]);
        $burger = MenuItem::factory()->create(['category_id' => $category->id, 'price' => 10]);
        $drink = MenuItem::factory()->create(['category_id' => $category->id, 'price' => 3]);

        $response = $this->actingAs($owner, 'sanctum')
            ->postJson('/api/v1/restaurant/orders/quick', [
                'items' => [
                    ['menu_item_id' => $burger->id, 'quantity' => 2],
                    ['menu_item_id' => $drink->id, 'quantity' => 1, 'notes' => 'No ice'],
                ],
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.is_quick_order', true)
            ->assertJsonCount(2, 'data.items');

        $this->assertDatabaseHas('orders', [
            'id' => $response->json('data.id'),
            'restaurant_id' => $restaurant->id,
            'is_quick_order' => 1,
        ]);
    }

    public function test_new_quick_order_appears_first_in_restaurant_orders_list(): void
    {
        $owner = User::factory()->create(['role' => 'restaurant_owner']);
        $restaurant = Restaurant::factory()->create(['owner_user_id' => $owner->id]);
        $customer = User::factory()->create(['role' => 'customer']);
        $category = MenuCategory::factory()->create(['restaurant_id' => $restaurant->id]);
        $menuItem = MenuItem::factory()->create(['category_id' => $category->id, 'price' => 11.5]);

        Order::factory()->create([
            'restaurant_id' => $restaurant->id,
            'customer_id' => $customer->id,
            'status' => 'delivered',
            'payment_status' => 'paid',
            'created_at' => now()->addDays(45),
            'updated_at' => now()->addDays(45),
        ]);

        $quickOrderResponse = $this->actingAs($owner, 'sanctum')
            ->postJson('/api/v1/restaurant/orders/quick', [
                'items' => [
                    ['menu_item_id' => $menuItem->id, 'quantity' => 2],
                ],
            ]);

        $quickOrderResponse->assertCreated();
        $quickOrderId = $quickOrderResponse->json('data.id');

        $this->actingAs($owner, 'sanctum')
            ->getJson('/api/v1/restaurant/orders')
            ->assertOk()
            ->assertJsonPath('data.0.id', $quickOrderId)
            ->assertJsonPath('data.0.is_quick_order', true);
    }

    public function test_restaurant_owner_can_view_review_summary_and_reply(): void
    {
        $owner = User::factory()->create(['role' => 'restaurant_owner']);
        $restaurant = Restaurant::factory()->create(['owner_user_id' => $owner->id]);
        $customer = User::factory()->create(['role' => 'customer']);

        Review::create([
            'restaurant_id' => $restaurant->id,
            'customer_id' => $customer->id,
            'order_id' => null,
            'rating' => 5,
            'comment' => 'Excellent food.',
        ]);

        $this->actingAs($owner, 'sanctum')
            ->getJson('/api/v1/restaurant/reviews/summary')
            ->assertOk()
            ->assertJsonPath('data.total_reviews', 1)
            ->assertJsonPath('data.average_rating', 5);

        $reviewId = $this->actingAs($owner, 'sanctum')
            ->getJson('/api/v1/restaurant/reviews')
            ->assertOk()
            ->json('data.0.id');

        $this->actingAs($owner, 'sanctum')
            ->patchJson("/api/v1/restaurant/reviews/{$reviewId}/reply", [
                'reply' => 'Thank you for your review!',
            ])
            ->assertOk()
            ->assertJsonPath('data.reply', 'Thank you for your review!');
    }

    public function test_restaurant_owner_can_manage_loyalty_rewards_and_read_overview(): void
    {
        $owner = User::factory()->create(['role' => 'restaurant_owner']);
        $restaurant = Restaurant::factory()->create(['owner_user_id' => $owner->id]);
        $customer = User::factory()->create(['role' => 'customer']);
        LoyaltyMember::factory()->create([
            'restaurant_id' => $restaurant->id,
            'customer_id' => $customer->id,
            'points' => 1200,
            'orders_count' => 8,
        ]);

        $createResponse = $this->actingAs($owner, 'sanctum')
            ->postJson('/api/v1/restaurant/loyalty/rewards', [
                'name' => 'Free Delivery Weekend',
                'description' => 'No delivery fee for top members.',
                'points_required' => 700,
                'reward_type' => 'free_delivery',
                'status' => 'active',
            ]);

        $createResponse->assertCreated()
            ->assertJsonPath('data.name', 'Free Delivery Weekend');

        $rewardId = $createResponse->json('data.id');

        $this->actingAs($owner, 'sanctum')
            ->patchJson("/api/v1/restaurant/loyalty/rewards/{$rewardId}", [
                'status' => 'archived',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'archived');

        $this->actingAs($owner, 'sanctum')
            ->postJson('/api/v1/restaurant/loyalty/rewards', [
                'name' => 'Welcome Discount',
                'description' => 'Starter discount for first redemptions.',
                'points_required' => 300,
                'reward_type' => 'discount',
                'status' => 'active',
            ])
            ->assertCreated();

        $this->actingAs($owner, 'sanctum')
            ->postJson('/api/v1/restaurant/loyalty/rewards', [
                'name' => 'Draft Reward',
                'description' => 'Still being prepared.',
                'points_required' => 500,
                'reward_type' => 'custom',
                'status' => 'draft',
            ])
            ->assertCreated();

        $this->actingAs($owner, 'sanctum')
            ->getJson('/api/v1/restaurant/loyalty/overview')
            ->assertOk()
            ->assertJsonPath('data.stats.active_members', 1)
            ->assertJsonCount(3, 'data.rewards')
            ->assertJsonCount(1, 'data.top_customers');

        $this->actingAs($owner, 'sanctum')
            ->getJson('/api/v1/restaurant/loyalty/overview?status=active')
            ->assertOk()
            ->assertJsonCount(1, 'data.rewards')
            ->assertJsonPath('data.rewards.0.status', 'active');

        $this->actingAs($owner, 'sanctum')
            ->getJson('/api/v1/restaurant/loyalty/overview?status=draft')
            ->assertOk()
            ->assertJsonCount(1, 'data.rewards')
            ->assertJsonPath('data.rewards.0.status', 'draft');

        $this->actingAs($owner, 'sanctum')
            ->getJson('/api/v1/restaurant/loyalty/overview?status=archived')
            ->assertOk()
            ->assertJsonCount(1, 'data.rewards')
            ->assertJsonPath('data.rewards.0.status', 'archived');
    }

    public function test_restaurant_owner_can_fetch_analytics_and_update_settings(): void
    {
        $owner = User::factory()->create([
            'name' => 'Owner One',
            'email' => 'owner-one@example.com',
            'role' => 'restaurant_owner',
        ]);
        $restaurant = Restaurant::factory()->create(['owner_user_id' => $owner->id]);
        $customer = User::factory()->create(['role' => 'customer']);
        $category = MenuCategory::factory()->create(['restaurant_id' => $restaurant->id]);
        $menuItem = MenuItem::factory()->create(['category_id' => $category->id, 'price' => 20]);
        $order = Order::factory()->create([
            'restaurant_id' => $restaurant->id,
            'customer_id' => $customer->id,
            'total' => 44,
            'subtotal' => 40,
            'fees' => 4,
            'status' => 'delivered',
        ]);
        OrderItem::create([
            'order_id' => $order->id,
            'menu_item_id' => $menuItem->id,
            'quantity' => 2,
            'unit_price' => 20,
            'notes' => null,
        ]);

        $video = Video::factory()->create([
            'restaurant_id' => $restaurant->id,
            'menu_item_id' => $menuItem->id,
            'status' => 'published',
        ]);
        VideoEngagement::create([
            'video_id' => $video->id,
            'user_id' => $customer->id,
            'type' => 'view',
        ]);

        $this->actingAs($owner, 'sanctum')
            ->getJson('/api/v1/restaurant/analytics?period=monthly')
            ->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'period',
                    'metrics' => [
                        'total_revenue',
                        'order_volume',
                        'avg_order_value',
                        'retention_rate',
                    ],
                    'revenue_trend',
                    'top_dishes',
                    'video_funnel',
                ],
            ]);

        $this->actingAs($owner, 'sanctum')
            ->patchJson('/api/v1/restaurant/settings', [
                'name' => 'Updated Demo Kitchen',
                'owner_name' => 'Updated Owner',
                'owner_email' => 'owner-updated@example.com',
                'settings' => [
                    'auto_accept_orders' => true,
                    'default_prep_time' => 18,
                ],
            ])
            ->assertOk()
            ->assertJsonPath('data.restaurant.name', 'Updated Demo Kitchen')
            ->assertJsonPath('data.owner.name', 'Updated Owner')
            ->assertJsonPath('data.settings.auto_accept_orders', true)
            ->assertJsonPath('data.settings.default_prep_time', 18);
    }

    public function test_restaurant_owner_can_manage_locations_numbers_and_profile_photo_in_settings(): void
    {
        $owner = User::factory()->create(['role' => 'restaurant_owner']);
        $restaurant = Restaurant::factory()->create(['owner_user_id' => $owner->id]);

        $uploadResponse = $this->actingAs($owner, 'sanctum')
            ->post('/api/v1/restaurant/profile-photo/upload', [
                'photo' => UploadedFile::fake()->create('profile.jpg', 120, 'image/jpeg'),
            ]);

        $uploadResponse->assertCreated()->assertJsonPath('message', 'Profile photo uploaded successfully.');
        $photoUrl = $uploadResponse->json('data.url');

        $createSettingsResponse = $this->actingAs($owner, 'sanctum')
            ->patchJson('/api/v1/restaurant/settings', [
                'owner_phone' => '70111222',
                'settings' => [
                    'contact_numbers' => ['76112233', '03123456'],
                    'profile_photo_url' => $photoUrl,
                ],
                'locations' => [
                    [
                        'name' => 'Main Branch',
                        'address' => 'Hamra Street, Beirut',
                        'phone' => '01111222',
                        'latitude' => 33.8938,
                        'longitude' => 35.5018,
                    ],
                ],
            ]);

        $createSettingsResponse->assertOk()
            ->assertJsonPath('data.owner.phone', '70111222')
            ->assertJsonPath('data.settings.contact_numbers.0', '76112233')
            ->assertJsonPath('data.settings.profile_photo_url', $photoUrl)
            ->assertJsonPath('data.locations.0.name', 'Main Branch')
            ->assertJsonPath('data.locations.0.address', 'Hamra Street, Beirut')
            ->assertJsonPath('data.locations.0.phone', '01111222');

        $locationId = $createSettingsResponse->json('data.locations.0.id');
        $this->assertDatabaseHas('restaurant_branches', [
            'id' => $locationId,
            'restaurant_id' => $restaurant->id,
            'name' => 'Main Branch',
        ]);

        $this->actingAs($owner, 'sanctum')
            ->patchJson('/api/v1/restaurant/settings', [
                'locations' => [
                    [
                        'id' => $locationId,
                        'name' => 'Main Branch Updated',
                        'address' => 'Hamra Street, Beirut',
                        'phone' => '01999000',
                    ],
                ],
            ])
            ->assertOk()
            ->assertJsonPath('data.locations.0.id', $locationId)
            ->assertJsonPath('data.locations.0.name', 'Main Branch Updated')
            ->assertJsonPath('data.locations.0.phone', '01999000');

        $this->actingAs($owner, 'sanctum')
            ->patchJson('/api/v1/restaurant/settings', [
                'locations' => [],
            ])
            ->assertOk()
            ->assertJsonCount(0, 'data.locations');

        $this->assertDatabaseMissing('restaurant_branches', [
            'id' => $locationId,
        ]);
    }

    public function test_analytics_financial_metrics_only_count_delivered_orders(): void
    {
        $owner = User::factory()->create(['role' => 'restaurant_owner']);
        $restaurant = Restaurant::factory()->create(['owner_user_id' => $owner->id]);
        $customer = User::factory()->create(['role' => 'customer']);
        $category = MenuCategory::factory()->create(['restaurant_id' => $restaurant->id]);
        $menuItem = MenuItem::factory()->create(['category_id' => $category->id, 'price' => 25]);

        $deliveredOrder = Order::factory()->create([
            'restaurant_id' => $restaurant->id,
            'customer_id' => $customer->id,
            'subtotal' => 100,
            'fees' => 10,
            'total' => 110,
            'status' => 'delivered',
        ]);

        $pendingOrder = Order::factory()->create([
            'restaurant_id' => $restaurant->id,
            'customer_id' => $customer->id,
            'subtotal' => 50,
            'fees' => 5,
            'total' => 55,
            'status' => 'pending',
        ]);

        OrderItem::create([
            'order_id' => $deliveredOrder->id,
            'menu_item_id' => $menuItem->id,
            'quantity' => 2,
            'unit_price' => 25,
            'notes' => null,
        ]);

        OrderItem::create([
            'order_id' => $pendingOrder->id,
            'menu_item_id' => $menuItem->id,
            'quantity' => 4,
            'unit_price' => 25,
            'notes' => null,
        ]);

        $this->actingAs($owner, 'sanctum')
            ->getJson('/api/v1/restaurant/analytics?period=monthly')
            ->assertOk()
            ->assertJsonPath('data.metrics.total_revenue.value', 110)
            ->assertJsonPath('data.metrics.order_volume.value', 1)
            ->assertJsonPath('data.metrics.avg_order_value.value', 110)
            ->assertJsonPath('data.top_dishes.0.sold', 2);
    }

    public function test_analytics_returns_full_month_and_year_revenue_trend_points(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-04-05 10:00:00'));

        try {
            $owner = User::factory()->create(['role' => 'restaurant_owner']);
            $restaurant = Restaurant::factory()->create(['owner_user_id' => $owner->id]);
            $customer = User::factory()->create(['role' => 'customer']);

            Order::factory()->create([
                'restaurant_id' => $restaurant->id,
                'customer_id' => $customer->id,
                'total' => 32,
                'status' => 'delivered',
                'created_at' => Carbon::parse('2026-04-02 12:00:00'),
            ]);

            Order::factory()->create([
                'restaurant_id' => $restaurant->id,
                'customer_id' => $customer->id,
                'total' => 48,
                'status' => 'delivered',
                'created_at' => Carbon::parse('2026-02-11 12:00:00'),
            ]);

            $monthly = $this->actingAs($owner, 'sanctum')
                ->getJson('/api/v1/restaurant/analytics?period=monthly')
                ->assertOk();

            $yearly = $this->actingAs($owner, 'sanctum')
                ->getJson('/api/v1/restaurant/analytics?period=yearly')
                ->assertOk();

            $monthlyTrend = $monthly->json('data.revenue_trend');
            $yearlyTrend = $yearly->json('data.revenue_trend');

            $this->assertCount(30, $monthlyTrend);
            $this->assertSame('1', $monthlyTrend[0]['label']);
            $this->assertSame('30', $monthlyTrend[29]['label']);

            $this->assertCount(12, $yearlyTrend);
            $this->assertSame('Jan', $yearlyTrend[0]['label']);
            $this->assertSame('Dec', $yearlyTrend[11]['label']);
        } finally {
            Carbon::setTestNow();
        }
    }
}
