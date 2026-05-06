<?php

namespace Database\Seeders;

use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\Restaurant;
use App\Models\RestaurantBranch;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SampleRestaurantCatalogSeeder extends Seeder
{
    public function run(): void
    {
        Model::unguarded(function (): void {
            DB::transaction(function (): void {
                foreach ($this->restaurants() as $restaurantData) {
                    $owner = User::query()
                        ->where('email', $restaurantData['owner_email'])
                        ->firstOrFail();

                    $restaurant = Restaurant::query()->updateOrCreate(
                        ['owner_user_id' => $owner->id],
                        [
                            'name' => $restaurantData['name'],
                            'description' => $restaurantData['description'],
                            'status' => $restaurantData['status'],
                            'settings' => $restaurantData['settings'],
                        ]
                    );

                    foreach ($restaurantData['branches'] as $branchData) {
                        RestaurantBranch::query()->updateOrCreate(
                            [
                                'restaurant_id' => $restaurant->id,
                                'name' => $branchData['name'],
                            ],
                            [
                                'address' => $branchData['address'],
                                'phone' => $branchData['phone'],
                                'latitude' => $branchData['latitude'],
                                'longitude' => $branchData['longitude'],
                                'open_hours' => $branchData['open_hours'],
                            ]
                        );
                    }

                    foreach ($restaurantData['categories'] as $sortOrder => $categoryData) {
                        $category = MenuCategory::query()->updateOrCreate(
                            [
                                'restaurant_id' => $restaurant->id,
                                'name' => $categoryData['name'],
                            ],
                            ['sort_order' => $sortOrder + 1]
                        );

                        foreach ($categoryData['items'] as $itemData) {
                            MenuItem::query()->updateOrCreate(
                                [
                                    'category_id' => $category->id,
                                    'name' => $itemData['name'],
                                ],
                                [
                                    'description' => $itemData['description'],
                                    'ingredients' => $itemData['ingredients'],
                                    'image_urls' => $itemData['image_urls'],
                                    'price' => $itemData['price'],
                                    'is_available' => $itemData['is_available'],
                                    'prep_time' => $itemData['prep_time'],
                                ]
                            );
                        }
                    }
                }
            });
        });
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function restaurants(): array
    {
        return [
            [
                'owner_email' => 'owner@hungerrush.local',
                'name' => 'HungerRush Demo Kitchen',
                'description' => 'Fast casual burgers, loaded sides, and late-night comfort food.',
                'status' => 'active',
                'settings' => $this->settings(
                    20,
                    false,
                    ['+961 1 555 010', '+961 70 555 010'],
                    'Burgers',
                    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80'
                ),
                'branches' => [
                    $this->branch('Hamra Flagship', 'Hamra Street, Beirut', '+961 1 555 010', 33.8967800, 35.4839100),
                    $this->branch('Mar Mikhael Pickup', 'Armenia Street, Beirut', '+961 1 555 011', 33.8961100, 35.5211200),
                ],
                'categories' => [
                    [
                        'name' => 'Burgers',
                        'items' => [
                            $this->item(
                                'Classic Smash Burger',
                                'Double smashed beef patties with cheddar, pickles, and house sauce.',
                                'Beef patty, cheddar cheese, pickles, lettuce, onion, potato bun, house sauce',
                                12.50,
                                18,
                                [
                                    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80',
                                    'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80',
                                ]
                            ),
                            $this->item(
                                'Crispy Chicken Stack',
                                'Buttermilk crispy chicken with slaw, spicy mayo, and brioche bun.',
                                'Chicken breast, buttermilk, cabbage slaw, spicy mayo, brioche bun',
                                10.75,
                                20,
                                [
                                    'https://images.unsplash.com/photo-1606755962773-d324e0a13086?auto=format&fit=crop&w=900&q=80',
                                ]
                            ),
                        ],
                    ],
                    [
                        'name' => 'Sides',
                        'items' => [
                            $this->item(
                                'Loaded Fries',
                                'Crispy fries with cheese sauce, jalapenos, herbs, and special seasoning.',
                                'Potatoes, cheese sauce, jalapenos, parsley, paprika, salt',
                                6.25,
                                12,
                                [
                                    'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=900&q=80',
                                ]
                            ),
                            $this->item(
                                'Garlic Parmesan Bites',
                                'Golden chicken bites tossed in garlic butter and parmesan.',
                                'Chicken, garlic butter, parmesan, parsley, black pepper',
                                7.50,
                                14,
                                [
                                    'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=900&q=80',
                                ]
                            ),
                        ],
                    ],
                    [
                        'name' => 'Drinks',
                        'items' => [
                            $this->item(
                                'Mint Lemonade',
                                'Fresh lemonade shaken with mint and crushed ice.',
                                'Lemon juice, mint, sugar syrup, ice, sparkling water',
                                3.75,
                                5,
                                [
                                    'https://images.unsplash.com/photo-1621263764928-df1444c5e859?auto=format&fit=crop&w=900&q=80',
                                ]
                            ),
                        ],
                    ],
                ],
            ],
            [
                'owner_email' => 'owner.cedar@hungerrush.local',
                'name' => 'Cedar Grill Beirut',
                'description' => 'Lebanese grill plates, wraps, mezze, and fresh-baked bread.',
                'status' => 'active',
                'settings' => $this->settings(
                    25,
                    true,
                    ['+961 1 555 020'],
                    'Lebanese Grill',
                    'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?auto=format&fit=crop&w=900&q=80'
                ),
                'branches' => [
                    $this->branch('Achrafieh Grill House', 'Sassine Square, Beirut', '+961 1 555 020', 33.8879400, 35.5201700),
                    $this->branch('Verdun Express', 'Verdun Main Road, Beirut', '+961 1 555 021', 33.8862500, 35.4865500),
                ],
                'categories' => [
                    [
                        'name' => 'Grill Plates',
                        'items' => [
                            $this->item(
                                'Mixed Grill Platter',
                                'Kafta, tawouk, and beef skewers with grilled vegetables and fries.',
                                'Kafta, chicken tawouk, beef skewers, tomatoes, onions, fries, garlic sauce',
                                18.00,
                                28,
                                [
                                    'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=900&q=80',
                                ]
                            ),
                            $this->item(
                                'Chicken Tawouk Plate',
                                'Marinated chicken skewers with rice, pickles, and garlic dip.',
                                'Chicken breast, lemon, garlic, yogurt, rice, pickles, toum',
                                13.75,
                                24,
                                [
                                    'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=900&q=80',
                                ]
                            ),
                        ],
                    ],
                    [
                        'name' => 'Wraps',
                        'items' => [
                            $this->item(
                                'Beef Shawarma Wrap',
                                'Thin sliced beef shawarma with tarator, parsley, and pickles.',
                                'Beef shawarma, tarator, parsley, tomato, pickles, saj bread',
                                8.50,
                                13,
                                [
                                    'https://images.unsplash.com/photo-1615870216519-2f9fa575fa5c?auto=format&fit=crop&w=900&q=80',
                                ]
                            ),
                            $this->item(
                                'Falafel Saj',
                                'Crispy falafel with tahini, vegetables, and fresh herbs.',
                                'Falafel, tahini, tomato, parsley, mint, pickles, saj bread',
                                6.75,
                                10,
                                [
                                    'https://images.unsplash.com/photo-1593001874117-c99c800e3eb5?auto=format&fit=crop&w=900&q=80',
                                ],
                                true
                            ),
                        ],
                    ],
                    [
                        'name' => 'Mezze',
                        'items' => [
                            $this->item(
                                'Hummus Bowl',
                                'Creamy hummus with olive oil, paprika, chickpeas, and warm pita.',
                                'Chickpeas, tahini, lemon juice, olive oil, paprika, pita bread',
                                5.25,
                                8,
                                [
                                    'https://images.unsplash.com/photo-1577906096429-f73c2c312435?auto=format&fit=crop&w=900&q=80',
                                ]
                            ),
                        ],
                    ],
                ],
            ],
            [
                'owner_email' => 'owner.sushi@hungerrush.local',
                'name' => 'Urban Sushi Box',
                'description' => 'Fresh sushi boxes, poke bowls, and quick Japanese-inspired bites.',
                'status' => 'active',
                'settings' => $this->settings(
                    18,
                    false,
                    ['+961 1 555 030'],
                    'Japanese',
                    'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=900&q=80'
                ),
                'branches' => [
                    $this->branch('Downtown Sushi Bar', 'Allenby Street, Beirut', '+961 1 555 030', 33.8985400, 35.5028300),
                ],
                'categories' => [
                    [
                        'name' => 'Sushi Boxes',
                        'items' => [
                            $this->item(
                                'Salmon Crunch Box',
                                'Eight salmon rolls with crispy tempura flakes and spicy mayo.',
                                'Sushi rice, salmon, nori, cucumber, tempura flakes, spicy mayo',
                                14.50,
                                16,
                                [
                                    'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?auto=format&fit=crop&w=900&q=80',
                                ]
                            ),
                            $this->item(
                                'California Roll Set',
                                'Classic crab, avocado, cucumber, sesame, and tobiko rolls.',
                                'Sushi rice, crab, avocado, cucumber, sesame, tobiko, nori',
                                11.25,
                                14,
                                [
                                    'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?auto=format&fit=crop&w=900&q=80',
                                ]
                            ),
                        ],
                    ],
                    [
                        'name' => 'Bowls',
                        'items' => [
                            $this->item(
                                'Tuna Poke Bowl',
                                'Tuna, edamame, cucumber, mango, rice, sesame, and ponzu.',
                                'Tuna, sushi rice, edamame, cucumber, mango, sesame, ponzu',
                                13.00,
                                12,
                                [
                                    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80',
                                ]
                            ),
                        ],
                    ],
                    [
                        'name' => 'Drinks',
                        'items' => [
                            $this->item(
                                'Iced Matcha Latte',
                                'Cold matcha with milk and light vanilla syrup.',
                                'Matcha powder, milk, vanilla syrup, ice',
                                4.50,
                                6,
                                [
                                    'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?auto=format&fit=crop&w=900&q=80',
                                ]
                            ),
                        ],
                    ],
                ],
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function settings(int $prepTime, bool $autoAcceptOrders, array $contactNumbers, string $cuisineType, string $profilePhotoUrl): array
    {
        return [
            'default_prep_time' => $prepTime,
            'auto_accept_orders' => $autoAcceptOrders,
            'notifications_enabled' => true,
            'cuisine_type' => $cuisineType,
            'currency' => 'USD',
            'timezone' => 'Asia/Beirut',
            'contact_numbers' => $contactNumbers,
            'profile_photo_url' => $profilePhotoUrl,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function branch(string $name, string $address, string $phone, float $latitude, float $longitude): array
    {
        return [
            'name' => $name,
            'address' => $address,
            'phone' => $phone,
            'latitude' => $latitude,
            'longitude' => $longitude,
            'open_hours' => [
                'monday' => ['10:00', '23:00'],
                'tuesday' => ['10:00', '23:00'],
                'wednesday' => ['10:00', '23:00'],
                'thursday' => ['10:00', '23:30'],
                'friday' => ['10:00', '00:30'],
                'saturday' => ['11:00', '00:30'],
                'sunday' => ['11:00', '22:30'],
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function item(
        string $name,
        string $description,
        string $ingredients,
        float $price,
        int $prepTime,
        array $imageUrls,
        bool $isAvailable = true
    ): array {
        return [
            'name' => $name,
            'description' => $description,
            'ingredients' => $ingredients,
            'image_urls' => $imageUrls,
            'price' => $price,
            'is_available' => $isAvailable,
            'prep_time' => $prepTime,
        ];
    }
}
