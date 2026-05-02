<?php

namespace Tests\Feature\Api\V1\Customer;

use App\Models\CustomerSearch;
use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Restaurant;
use App\Models\RestaurantFollow;
use App\Models\User;
use App\Models\Video;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CustomerVideoFeedApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_can_capture_search_follow_engagement_and_comment_signals(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);
        $restaurant = Restaurant::factory()->create();
        $category = MenuCategory::factory()->create(['restaurant_id' => $restaurant->id]);
        $menuItem = MenuItem::factory()->create(['category_id' => $category->id]);
        $video = Video::factory()->create([
            'restaurant_id' => $restaurant->id,
            'menu_item_id' => $menuItem->id,
            'status' => 'published',
            'stream_ready' => true,
            'published_at' => now()->subDay(),
            'title' => 'Burger Build',
        ]);

        $this->actingAs($customer, 'sanctum')
            ->postJson('/api/v1/customer/videos/searches', [
                'query' => 'burger',
                'context' => 'feed_search',
            ])
            ->assertCreated()
            ->assertJsonPath('data.query', 'burger');

        $this->assertDatabaseHas('customer_searches', [
            'user_id' => $customer->id,
            'normalized_query' => 'burger',
            'context' => 'feed_search',
        ]);

        $this->actingAs($customer, 'sanctum')
            ->postJson("/api/v1/customer/restaurants/{$restaurant->id}/follow")
            ->assertCreated()
            ->assertJsonPath('data.is_following', true);

        $this->assertDatabaseHas('restaurant_follows', [
            'user_id' => $customer->id,
            'restaurant_id' => $restaurant->id,
        ]);

        $this->actingAs($customer, 'sanctum')
            ->postJson("/api/v1/customer/videos/{$video->id}/engagements", [
                'type' => 'like',
            ])
            ->assertCreated()
            ->assertJsonPath('data.viewer_state.is_liked', true);

        $this->actingAs($customer, 'sanctum')
            ->postJson("/api/v1/customer/videos/{$video->id}/engagements", [
                'type' => 'view',
            ])
            ->assertCreated()
            ->assertJsonPath('data.stats.views_count', 1);

        $this->actingAs($customer, 'sanctum')
            ->postJson("/api/v1/customer/videos/{$video->id}/comments", [
                'body' => 'This looks amazing.',
            ])
            ->assertCreated()
            ->assertJsonPath('data.body', 'This looks amazing.');

        $this->actingAs($customer, 'sanctum')
            ->getJson("/api/v1/customer/videos/{$video->id}/comments")
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->actingAs($customer, 'sanctum')
            ->getJson('/api/v1/customer/restaurants/following')
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->actingAs($customer, 'sanctum')
            ->deleteJson("/api/v1/customer/videos/{$video->id}/engagements/like")
            ->assertOk()
            ->assertJsonPath('data.viewer_state.is_liked', false);
    }

    public function test_customer_feed_is_personalized_using_orders_follows_and_searches(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);

        $restaurantOrder = Restaurant::factory()->create(['name' => 'Burger House']);
        $restaurantFollow = Restaurant::factory()->create(['name' => 'Followed Grill']);
        $restaurantSearch = Restaurant::factory()->create(['name' => 'Tokyo Sushi']);
        $restaurantOther = Restaurant::factory()->create(['name' => 'Other Kitchen']);

        $categoryOrder = MenuCategory::factory()->create(['restaurant_id' => $restaurantOrder->id]);
        $categoryFollow = MenuCategory::factory()->create(['restaurant_id' => $restaurantFollow->id]);
        $categorySearch = MenuCategory::factory()->create(['restaurant_id' => $restaurantSearch->id]);
        $categoryOther = MenuCategory::factory()->create(['restaurant_id' => $restaurantOther->id]);

        $orderedItem = MenuItem::factory()->create([
            'category_id' => $categoryOrder->id,
            'name' => 'Smash Burger',
        ]);
        $followedItem = MenuItem::factory()->create([
            'category_id' => $categoryFollow->id,
            'name' => 'Mixed Grill',
        ]);
        $searchedItem = MenuItem::factory()->create([
            'category_id' => $categorySearch->id,
            'name' => 'Sushi Boat',
        ]);
        $otherItem = MenuItem::factory()->create([
            'category_id' => $categoryOther->id,
            'name' => 'Pasta Bake',
        ]);

        $order = Order::create([
            'customer_id' => $customer->id,
            'restaurant_id' => $restaurantOrder->id,
            'branch_id' => null,
            'subtotal' => 22,
            'fees' => 2.2,
            'total' => 24.2,
            'status' => 'delivered',
            'payment_status' => 'paid',
            'is_quick_order' => false,
        ]);
        OrderItem::create([
            'order_id' => $order->id,
            'menu_item_id' => $orderedItem->id,
            'quantity' => 1,
            'unit_price' => 22,
            'notes' => null,
        ]);

        RestaurantFollow::create([
            'restaurant_id' => $restaurantFollow->id,
            'user_id' => $customer->id,
        ]);

        CustomerSearch::create([
            'user_id' => $customer->id,
            'query' => 'sushi',
            'normalized_query' => 'sushi',
            'context' => 'video_feed',
        ]);

        $orderVideo = Video::factory()->create([
            'restaurant_id' => $restaurantOrder->id,
            'menu_item_id' => $orderedItem->id,
            'status' => 'published',
            'stream_ready' => true,
            'published_at' => now()->subHours(2),
            'title' => 'Smash Burger close up',
        ]);
        $followVideo = Video::factory()->create([
            'restaurant_id' => $restaurantFollow->id,
            'menu_item_id' => $followedItem->id,
            'status' => 'published',
            'stream_ready' => true,
            'published_at' => now()->subHours(2),
            'title' => 'Grill smoke show',
        ]);
        $searchVideo = Video::factory()->create([
            'restaurant_id' => $restaurantSearch->id,
            'menu_item_id' => $searchedItem->id,
            'status' => 'published',
            'stream_ready' => true,
            'published_at' => now()->subHours(2),
            'title' => 'Fresh sushi platter',
        ]);
        $otherVideo = Video::factory()->create([
            'restaurant_id' => $restaurantOther->id,
            'menu_item_id' => $otherItem->id,
            'status' => 'published',
            'stream_ready' => true,
            'published_at' => now()->subHours(2),
            'title' => 'Kitchen ambience',
        ]);

        $response = $this->actingAs($customer, 'sanctum')
            ->getJson('/api/v1/customer/videos/feed?debug=1')
            ->assertOk();

        $videoIds = collect($response->json('data'))->pluck('id')->all();

        $this->assertSame($orderVideo->id, $videoIds[0]);
        $this->assertContains($followVideo->id, array_slice($videoIds, 0, 3));
        $this->assertContains($searchVideo->id, array_slice($videoIds, 0, 3));
        $this->assertSame($otherVideo->id, end($videoIds));

        $response->assertJsonPath('data.0.viewer_state.is_following_restaurant', false)
            ->assertJsonPath('data.1.viewer_state.is_following_restaurant', true);
    }
}
