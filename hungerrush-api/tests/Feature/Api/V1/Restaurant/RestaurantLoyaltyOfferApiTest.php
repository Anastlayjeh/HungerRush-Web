<?php

namespace Tests\Feature\Api\V1\Restaurant;

use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RestaurantLoyaltyOfferApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_restaurant_owner_can_create_list_and_update_loyalty_offers(): void
    {
        $owner = User::factory()->create(['role' => 'restaurant_owner']);
        $restaurant = Restaurant::factory()->create(['owner_user_id' => $owner->id]);

        $create = $this->actingAs($owner, 'sanctum')
            ->postJson('/api/v1/restaurant/loyalty/offers', [
                'title' => 'Free Dessert',
                'description' => 'Redeem for dessert.',
                'required_points' => 120,
                'is_active' => true,
            ]);

        $create->assertCreated()
            ->assertJsonPath('data.restaurant_id', $restaurant->id)
            ->assertJsonPath('data.title', 'Free Dessert')
            ->assertJsonPath('data.required_points', 120)
            ->assertJsonPath('data.is_active', true);

        $offerId = $create->json('data.id');

        $this->actingAs($owner, 'sanctum')
            ->getJson('/api/v1/restaurant/loyalty/offers')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $offerId);

        $this->actingAs($owner, 'sanctum')
            ->patchJson("/api/v1/restaurant/loyalty/offers/{$offerId}", [
                'required_points' => 140,
                'is_active' => false,
            ])
            ->assertOk()
            ->assertJsonPath('data.required_points', 140)
            ->assertJsonPath('data.is_active', false);

        $this->actingAs($owner, 'sanctum')
            ->deleteJson("/api/v1/restaurant/loyalty/offers/{$offerId}")
            ->assertOk()
            ->assertJsonPath('data.deleted', true);
    }
}
