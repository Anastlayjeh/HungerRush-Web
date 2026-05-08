<?php

namespace Tests\Feature\Api\V1\Admin;

use App\Enums\UserRole;
use App\Models\RestaurantRegistration;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminRestaurantRegistrationApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_approval_creates_restaurant_owner_user_for_new_registration(): void
    {
        $admin = User::factory()->create([
            'role' => UserRole::Admin->value,
        ]);

        $registration = RestaurantRegistration::query()->create([
            'owner_user_id' => 990001,
            'restaurant_name' => 'Test Registration Kitchen',
            'description' => 'Seed-style pending application used for admin approval tests.',
            'contact_email' => 'new.registration.owner@hungerrush.local',
            'contact_phone' => '+96170090901',
            'payload' => [
                'source' => 'test_case',
                'documents_submitted' => true,
                'owner_name' => 'Test Registration Owner',
                'phone_numbers' => [
                    [
                        'country_code' => '+961',
                        'number' => '70090901',
                    ],
                ],
                'location' => [
                    'country' => 'lebanon',
                    'city' => 'beirut',
                    'street' => 'hadath',
                    'postal_code' => '1103',
                ],
            ],
            'status' => 'pending',
        ]);

        $token = $admin->createToken('test-admin')->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$token}")
            ->patchJson("/api/v1/admin/restaurant-registrations/{$registration->id}", [
                'status' => 'approved',
                'review_note' => 'Approved in test.',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'approved')
            ->assertJsonPath('data.location.city', 'beirut')
            ->assertJsonPath('data.phone_numbers.0.country_code', '+961');

        $owner = User::query()
            ->whereRaw('LOWER(email) = ?', ['new.registration.owner@hungerrush.local'])
            ->first();

        $this->assertNotNull($owner);
        $this->assertSame(UserRole::RestaurantOwner->value, $owner->role?->value ?? $owner->role);

        $this->assertDatabaseHas('restaurant_registrations', [
            'id' => $registration->id,
            'owner_user_id' => $owner->id,
            'status' => 'approved',
        ]);

        $this->assertDatabaseHas('restaurants', [
            'owner_user_id' => $owner->id,
            'name' => 'Test Registration Kitchen',
            'status' => 'active',
        ]);

        $this->assertDatabaseHas('restaurant_branches', [
            'name' => 'Main Branch',
            'address' => 'hadath, beirut, lebanon, 1103',
            'phone' => '+96170090901',
        ]);
    }
}
