<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SampleUsersSeeder extends Seeder
{
    public function run(): void
    {
        Model::unguarded(function (): void {
            foreach ($this->users() as $user) {
                User::query()->updateOrCreate(
                    ['email' => $user['email']],
                    [
                        'name' => $user['name'],
                        'phone' => $user['phone'],
                        'role' => $user['role'],
                        'status' => 'active',
                        'email_verified_at' => now(),
                        'password' => Hash::make('password'),
                        'last_login_at' => $user['last_login_at'] ?? null,
                    ]
                );
            }
        });
    }

    /**
     * @return array<int, array{name: string, email: string, phone: string, role: string, last_login_at?: mixed}>
     */
    private function users(): array
    {
        return [
            [
                'name' => 'HungerRush Admin',
                'email' => 'admin@hungerrush.local',
                'phone' => '+96170000001',
                'role' => 'admin',
                'last_login_at' => now()->subHours(2),
            ],
            [
                'name' => 'Maya Haddad',
                'email' => 'owner@hungerrush.local',
                'phone' => '+96170000002',
                'role' => 'restaurant_owner',
                'last_login_at' => now()->subMinutes(45),
            ],
            [
                'name' => 'Omar Khoury',
                'email' => 'owner.cedar@hungerrush.local',
                'phone' => '+96170000003',
                'role' => 'restaurant_owner',
            ],
            [
                'name' => 'Nour Saliba',
                'email' => 'owner.sushi@hungerrush.local',
                'phone' => '+96170000004',
                'role' => 'restaurant_owner',
            ],
            [
                'name' => 'Karim Mansour',
                'email' => 'staff@hungerrush.local',
                'phone' => '+96170000005',
                'role' => 'restaurant_staff',
            ],
            [
                'name' => 'Lina Saad',
                'email' => 'customer@hungerrush.local',
                'phone' => '+96171000001',
                'role' => 'customer',
                'last_login_at' => now()->subDay(),
            ],
            [
                'name' => 'Rami Daher',
                'email' => 'customer.rami@hungerrush.local',
                'phone' => '+96171000002',
                'role' => 'customer',
            ],
            [
                'name' => 'Sara Nassar',
                'email' => 'customer.sara@hungerrush.local',
                'phone' => '+96171000003',
                'role' => 'customer',
            ],
            [
                'name' => 'Tarek Fares',
                'email' => 'customer.tarek@hungerrush.local',
                'phone' => '+96171000004',
                'role' => 'customer',
            ],
            [
                'name' => 'Dina Rahal',
                'email' => 'customer.dina@hungerrush.local',
                'phone' => '+96171000005',
                'role' => 'customer',
            ],
            [
                'name' => 'Jad Abi Nader',
                'email' => 'customer.jad@hungerrush.local',
                'phone' => '+96171000006',
                'role' => 'customer',
            ],
            [
                'name' => 'Mira Karam',
                'email' => 'customer.mira@hungerrush.local',
                'phone' => '+96171000007',
                'role' => 'customer',
            ],
            [
                'name' => 'Ali Hamdan',
                'email' => 'driver.ali@hungerrush.local',
                'phone' => '+96176000001',
                'role' => 'driver',
            ],
            [
                'name' => 'Hadi Younes',
                'email' => 'driver.hadi@hungerrush.local',
                'phone' => '+96176000002',
                'role' => 'driver',
            ],
            [
                'name' => 'Elie Haddad',
                'email' => 'driver.elie@hungerrush.local',
                'phone' => '+96176000003',
                'role' => 'driver',
            ],
        ];
    }
}
