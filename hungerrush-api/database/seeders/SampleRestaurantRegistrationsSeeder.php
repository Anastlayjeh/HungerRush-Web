<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\RestaurantRegistration;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SampleRestaurantRegistrationsSeeder extends Seeder
{
    public function run(): void
    {
        Model::unguarded(function (): void {
            DB::transaction(function (): void {
                $admin = User::query()
                    ->where('role', UserRole::Admin->value)
                    ->orderBy('id')
                    ->first();

                foreach ($this->registrations() as $index => $registration) {
                    $createdAt = now()->subDays(12 - $index)->setTime(10 + ($index % 5), 25, 0);
                    $status = $registration['status'];
                    $isReviewed = $status !== 'pending';

                    RestaurantRegistration::query()->updateOrCreate(
                        [
                            'restaurant_name' => $registration['restaurant_name'],
                            'contact_email' => $registration['contact_email'],
                        ],
                        [
                            'owner_user_id' => $registration['owner_user_id'],
                            'description' => $registration['description'],
                            'contact_phone' => $registration['contact_phone'],
                            'payload' => $registration['payload'],
                            'status' => $status,
                            'review_note' => $registration['review_note'] ?? null,
                            'reviewed_by' => $isReviewed ? $admin?->id : null,
                            'reviewed_at' => $isReviewed ? now()->subDays(max(1, $index)) : null,
                            'created_at' => $createdAt,
                            'updated_at' => $isReviewed ? now()->subDays(max(1, $index)) : $createdAt,
                        ]
                    );
                }
            });
        });
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function registrations(): array
    {
        return [
            [
                'owner_user_id' => 900101,
                'restaurant_name' => 'Olive Grove Kitchen',
                'description' => 'Mediterranean lunch bowls and charcoal wraps focused on office deliveries.',
                'contact_email' => 'owner.olivegrove@hungerrush.local',
                'contact_phone' => '+96170010101',
                'status' => 'pending',
                'review_note' => null,
                'payload' => [
                    'source' => 'seed_sample',
                    'documents_submitted' => true,
                    'owner_name' => 'Rami Zgheib',
                ],
            ],
            [
                'owner_user_id' => 900102,
                'restaurant_name' => 'Sunset Shawarma Station',
                'description' => 'Shawarma-focused concept with rotating sauces and late-night delivery.',
                'contact_email' => 'owner.sunsetshawarma@hungerrush.local',
                'contact_phone' => '+96170010102',
                'status' => 'pending',
                'review_note' => null,
                'payload' => [
                    'source' => 'seed_sample',
                    'documents_submitted' => true,
                    'owner_name' => 'Nadine Hallak',
                ],
            ],
            [
                'owner_user_id' => 900103,
                'restaurant_name' => 'Bamboo Wok Bar',
                'description' => 'Pan-Asian wok dishes and noodle bowls for compact, quick delivery zones.',
                'contact_email' => 'owner.bamboowok@hungerrush.local',
                'contact_phone' => '+96170010103',
                'status' => 'pending',
                'review_note' => null,
                'payload' => [
                    'source' => 'seed_sample',
                    'documents_submitted' => true,
                    'owner_name' => 'Hassan Dalloul',
                ],
            ],
            [
                'owner_user_id' => 900104,
                'restaurant_name' => 'Brick Oven Slices',
                'description' => 'Neighborhood pizza counter requesting onboarding for weekend dinner peaks.',
                'contact_email' => 'owner.brickoven@hungerrush.local',
                'contact_phone' => '+96170010104',
                'status' => 'pending',
                'review_note' => null,
                'payload' => [
                    'source' => 'seed_sample',
                    'documents_submitted' => true,
                    'owner_name' => 'Mira Souaid',
                ],
            ],
            [
                'owner_user_id' => 900105,
                'restaurant_name' => 'Golden Rice House',
                'description' => 'Rice bowls and grilled skewers with family-style combo offerings.',
                'contact_email' => 'owner.goldenrice@hungerrush.local',
                'contact_phone' => '+96170010105',
                'status' => 'rejected',
                'review_note' => 'Missing food safety certificate in the submitted files.',
                'payload' => [
                    'source' => 'seed_sample',
                    'documents_submitted' => false,
                    'owner_name' => 'Salim Harb',
                ],
            ],
            [
                'owner_user_id' => 900106,
                'restaurant_name' => 'Coastline Burgers',
                'description' => 'Compact burger kitchen approved after neighborhood compliance check.',
                'contact_email' => 'owner.coastline@hungerrush.local',
                'contact_phone' => '+96170010106',
                'status' => 'approved',
                'review_note' => 'Approved from admin panel sample workflow.',
                'payload' => [
                    'source' => 'seed_sample',
                    'documents_submitted' => true,
                    'owner_name' => 'Jad Mansour',
                ],
            ],
        ];
    }
}
