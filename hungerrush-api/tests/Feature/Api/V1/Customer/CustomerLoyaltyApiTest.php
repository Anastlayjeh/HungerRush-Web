<?php

namespace Tests\Feature\Api\V1\Customer;

use App\Models\LoyaltyOffer;
use App\Models\LoyaltyPoint;
use App\Models\LoyaltyTransaction;
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
            ->assertJsonPath('data.points.points_balance', 30);

        $this->assertDatabaseHas('loyalty_points', [
            'user_id' => $customer->id,
            'restaurant_id' => $restaurantA->id,
            'points_balance' => 30,
            'total_redeemed' => 50,
        ]);
        $this->assertDatabaseHas('loyalty_transactions', [
            'user_id' => $customer->id,
            'restaurant_id' => $restaurantA->id,
            'offer_id' => $activeOffer->id,
            'points' => 50,
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
}
