<?php

namespace Tests\Feature\Api\V1\Customer;

use App\Models\LoyaltyOffer;
use App\Models\LoyaltyPoint;
use App\Models\LoyaltyTransaction;
use App\Models\Cart;
use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CustomerLoyaltyApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_points_are_earned_once_and_returned_by_customer_endpoints(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);
        $owner = User::factory()->create(['role' => 'restaurant_owner']);
        $restaurant = Restaurant::factory()->create(['owner_user_id' => $owner->id]);

        $order = Order::factory()->create([
            'customer_id' => $customer->id,
            'restaurant_id' => $restaurant->id,
            'status' => 'on_the_way',
            'payment_status' => 'unpaid',
            'total' => 2.75,
        ]);

        $order->update(['status' => 'delivered']);

        $this->assertDatabaseHas('loyalty_points', [
            'user_id' => $customer->id,
            'restaurant_id' => $restaurant->id,
            'points_balance' => 40,
            'total_earned' => 40,
            'total_redeemed' => 0,
        ]);
        $this->assertDatabaseHas('loyalty_transactions', [
            'user_id' => $customer->id,
            'restaurant_id' => $restaurant->id,
            'order_id' => $order->id,
            'points' => 40,
            'type' => 'earned',
        ]);

        $order->update(['payment_status' => 'paid']);

        $this->assertSame(
            1,
            LoyaltyTransaction::query()
                ->where('order_id', $order->id)
                ->where('type', 'earned')
                ->count()
        );

        $this->actingAs($customer, 'sanctum')
            ->getJson('/api/v1/customer/loyalty/points')
            ->assertOk()
            ->assertJsonPath('data.total_points_balance', 40)
            ->assertJsonPath('data.restaurants.0.restaurant_id', $restaurant->id)
            ->assertJsonPath('data.restaurants.0.points_balance', 40);

        $this->actingAs($customer, 'sanctum')
            ->getJson("/api/v1/customer/loyalty/points/{$restaurant->id}")
            ->assertOk()
            ->assertJsonPath('data.restaurant_id', $restaurant->id)
            ->assertJsonPath('data.points_balance', 40);
    }

    public function test_loyalty_points_index_only_lists_restaurants_with_positive_points(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);
        $ownerA = User::factory()->create(['role' => 'restaurant_owner']);
        $ownerB = User::factory()->create(['role' => 'restaurant_owner']);
        $restaurantWithPoints = Restaurant::factory()->create(['owner_user_id' => $ownerA->id]);
        $restaurantWithoutPoints = Restaurant::factory()->create(['owner_user_id' => $ownerB->id]);

        LoyaltyPoint::query()->create([
            'user_id' => $customer->id,
            'restaurant_id' => $restaurantWithPoints->id,
            'points_balance' => 60,
            'total_earned' => 60,
            'total_redeemed' => 0,
        ]);

        LoyaltyPoint::query()->create([
            'user_id' => $customer->id,
            'restaurant_id' => $restaurantWithoutPoints->id,
            'points_balance' => 0,
            'total_earned' => 40,
            'total_redeemed' => 40,
        ]);

        $this->actingAs($customer, 'sanctum')
            ->getJson('/api/v1/customer/loyalty/points')
            ->assertOk()
            ->assertJsonPath('data.total_points_balance', 60)
            ->assertJsonCount(1, 'data.restaurants')
            ->assertJsonPath('data.restaurants.0.restaurant_id', $restaurantWithPoints->id);
    }

    public function test_paid_order_awards_twenty_points_per_full_usd_once(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);
        $owner = User::factory()->create(['role' => 'restaurant_owner']);
        $restaurant = Restaurant::factory()->create(['owner_user_id' => $owner->id]);

        $order = Order::factory()->create([
            'customer_id' => $customer->id,
            'restaurant_id' => $restaurant->id,
            'status' => 'pending',
            'payment_status' => 'unpaid',
            'total' => 5.99,
        ]);

        $order->update(['payment_status' => 'paid']);

        $this->assertDatabaseHas('loyalty_points', [
            'user_id' => $customer->id,
            'restaurant_id' => $restaurant->id,
            'points_balance' => 100,
            'total_earned' => 100,
        ]);

        $order->update(['status' => 'delivered']);

        $this->assertSame(
            1,
            LoyaltyTransaction::query()
                ->where('order_id', $order->id)
                ->where('type', 'earned')
                ->count()
        );
    }

    public function test_customer_can_list_offers_and_redeem_only_when_eligible_for_same_restaurant(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);
        $ownerA = User::factory()->create(['role' => 'restaurant_owner']);
        $ownerB = User::factory()->create(['role' => 'restaurant_owner']);
        $restaurantA = Restaurant::factory()->create(['owner_user_id' => $ownerA->id]);
        $restaurantB = Restaurant::factory()->create(['owner_user_id' => $ownerB->id]);

        LoyaltyPoint::query()->create([
            'user_id' => $customer->id,
            'restaurant_id' => $restaurantA->id,
            'points_balance' => 80,
            'total_earned' => 80,
            'total_redeemed' => 0,
        ]);

        $activeOffer = LoyaltyOffer::query()->create([
            'restaurant_id' => $restaurantA->id,
            'title' => 'Free Drink',
            'description' => 'Redeem for one drink.',
            'required_points' => 50,
            'is_active' => true,
        ]);
        $inactiveOffer = LoyaltyOffer::query()->create([
            'restaurant_id' => $restaurantA->id,
            'title' => 'Inactive Offer',
            'description' => 'Hidden',
            'required_points' => 10,
            'is_active' => false,
        ]);
        $otherRestaurantOffer = LoyaltyOffer::query()->create([
            'restaurant_id' => $restaurantB->id,
            'title' => 'Wrong Restaurant Offer',
            'description' => 'Cannot use points from another restaurant.',
            'required_points' => 30,
            'is_active' => true,
        ]);

        $this->actingAs($customer, 'sanctum')
            ->getJson("/api/v1/customer/restaurants/{$restaurantA->id}/loyalty-offers")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $activeOffer->id);

        $this->actingAs($customer, 'sanctum')
            ->postJson("/api/v1/customer/loyalty/offers/{$activeOffer->id}/redeem")
            ->assertOk()
            ->assertJsonPath('data.redeemed', true)
            ->assertJsonPath('data.points.points_balance', 80)
            ->assertJsonPath('data.cart.loyalty_offer_id', $activeOffer->id);

        $this->assertDatabaseHas('loyalty_points', [
            'user_id' => $customer->id,
            'restaurant_id' => $restaurantA->id,
            'points_balance' => 80,
            'total_redeemed' => 0,
        ]);
        $this->assertDatabaseMissing('loyalty_transactions', [
            'user_id' => $customer->id,
            'restaurant_id' => $restaurantA->id,
            'offer_id' => $activeOffer->id,
            'type' => 'redeemed',
        ]);

        $this->actingAs($customer, 'sanctum')
            ->postJson("/api/v1/customer/loyalty/offers/{$inactiveOffer->id}/redeem")
            ->assertUnprocessable()
            ->assertJsonPath('code', 'loyalty_offer_inactive');

        $this->actingAs($customer, 'sanctum')
            ->postJson("/api/v1/customer/loyalty/offers/{$otherRestaurantOffer->id}/redeem")
            ->assertUnprocessable();
    }

    public function test_redeemed_offer_deducts_points_only_after_successful_order(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);
        $owner = User::factory()->create(['role' => 'restaurant_owner']);
        $restaurant = Restaurant::factory()->create(['owner_user_id' => $owner->id]);
        $category = MenuCategory::factory()->create(['restaurant_id' => $restaurant->id]);
        $menuItem = MenuItem::factory()->create([
            'category_id' => $category->id,
            'price' => 12,
            'is_available' => true,
        ]);

        LoyaltyPoint::query()->create([
            'user_id' => $customer->id,
            'restaurant_id' => $restaurant->id,
            'points_balance' => 120,
            'total_earned' => 120,
            'total_redeemed' => 0,
        ]);

        $offer = LoyaltyOffer::query()->create([
            'restaurant_id' => $restaurant->id,
            'title' => 'Free Item Reward',
            'description' => 'Use points for a free menu item.',
            'required_points' => 60,
            'reward_type' => 'free_item',
            'menu_item_id' => $menuItem->id,
            'free_item_quantity' => 1,
            'is_active' => true,
        ]);

        $this->actingAs($customer, 'sanctum')
            ->postJson("/api/v1/customer/loyalty/offers/{$offer->id}/redeem")
            ->assertOk()
            ->assertJsonPath('data.redeemed', true)
            ->assertJsonPath('data.points.points_balance', 120)
            ->assertJsonPath('data.cart.loyalty_offer_id', $offer->id);

        $this->assertDatabaseHas('loyalty_points', [
            'user_id' => $customer->id,
            'restaurant_id' => $restaurant->id,
            'points_balance' => 120,
            'total_redeemed' => 0,
        ]);
        $this->assertDatabaseMissing('loyalty_transactions', [
            'user_id' => $customer->id,
            'restaurant_id' => $restaurant->id,
            'offer_id' => $offer->id,
            'type' => 'redeemed',
        ]);

        $orderResponse = $this->actingAs($customer, 'sanctum')
            ->postJson('/api/v1/customer/orders', [
                'restaurant_id' => $restaurant->id,
                'delivery_address' => [
                    'city' => 'Beirut',
                    'street' => 'Main Street',
                    'building' => '12A',
                ],
                'delivery_phone' => '+96170123456',
                'payment_method' => 'cash_on_delivery',
                'delivery_mode' => 'now',
            ]);

        $orderResponse->assertCreated()
            ->assertJsonPath('data.loyalty_offer_id', $offer->id)
            ->assertJsonPath('data.loyalty_points_used', 60)
            ->assertJsonPath('data.discount', 12);

        $orderId = (int) $orderResponse->json('data.id');
        $this->assertGreaterThan(0, $orderId);

        $this->assertDatabaseHas('loyalty_points', [
            'user_id' => $customer->id,
            'restaurant_id' => $restaurant->id,
            'points_balance' => 60,
            'total_redeemed' => 60,
        ]);
        $this->assertDatabaseHas('loyalty_transactions', [
            'user_id' => $customer->id,
            'restaurant_id' => $restaurant->id,
            'order_id' => $orderId,
            'offer_id' => $offer->id,
            'points' => 60,
            'type' => 'redeemed',
        ]);
    }

    public function test_redeem_uses_existing_cart_for_same_restaurant(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);
        $owner = User::factory()->create(['role' => 'restaurant_owner']);
        $restaurant = Restaurant::factory()->create(['owner_user_id' => $owner->id]);

        LoyaltyPoint::query()->create([
            'user_id' => $customer->id,
            'restaurant_id' => $restaurant->id,
            'points_balance' => 90,
            'total_earned' => 90,
            'total_redeemed' => 0,
        ]);

        $existingCart = Cart::query()->create([
            'customer_id' => $customer->id,
            'restaurant_id' => $restaurant->id,
        ]);

        $offer = LoyaltyOffer::query()->create([
            'restaurant_id' => $restaurant->id,
            'title' => '20% Off',
            'description' => 'Use points for discount.',
            'required_points' => 40,
            'reward_type' => 'discount',
            'discount_percentage' => 20,
            'is_active' => true,
        ]);

        $this->actingAs($customer, 'sanctum')
            ->postJson("/api/v1/customer/loyalty/offers/{$offer->id}/redeem")
            ->assertOk()
            ->assertJsonPath('data.cart.id', $existingCart->id)
            ->assertJsonPath('data.cart.loyalty_offer_id', $offer->id);

        $this->assertDatabaseHas('carts', [
            'id' => $existingCart->id,
            'customer_id' => $customer->id,
            'restaurant_id' => $restaurant->id,
            'loyalty_offer_id' => $offer->id,
        ]);
    }
}
