<?php

namespace Database\Seeders;

use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\Restaurant;
use App\Models\User;
use App\Models\Video;
use App\Models\VideoEngagement;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class LongTermAnalyticsSeeder extends Seeder
{
    private const CUSTOMER_COUNT = 36;

    public function run(): void
    {
        $restaurants = Restaurant::query()->get();

        if ($restaurants->isEmpty()) {
            $owner = User::query()->firstOrCreate(
                ['email' => 'owner@hungerrush.local'],
                [
                    'name' => 'Demo Restaurant Owner',
                    'phone' => '01111111111',
                    'role' => 'restaurant_owner',
                    'status' => 'active',
                    'email_verified_at' => now(),
                    'password' => Hash::make('password'),
                ]
            );

            $restaurants = collect([
                Restaurant::query()->firstOrCreate(
                    ['owner_user_id' => $owner->id],
                    [
                        'name' => 'HungerRush Demo Kitchen',
                        'status' => 'active',
                    ]
                ),
            ]);
        }

        $customers = $this->ensureAnalyticsCustomers();
        $customerIds = $customers->pluck('id')->all();

        foreach ($restaurants as $restaurant) {
            [$menuItems, $videoIds] = $this->ensureMenuItemsAndVideos($restaurant);
            $this->resetRestaurantSyntheticData($restaurant->id, $customerIds, $videoIds);

            [$ordersCount, $orderItemsCount] = $this->seedOrdersForFullYear(
                $restaurant->id,
                $menuItems,
                $customerIds
            );
            $engagementCount = $this->seedVideoEngagementForFullYear($videoIds, $customerIds);

            $this->command?->info(
                "Restaurant #{$restaurant->id}: seeded {$ordersCount} delivered orders, {$orderItemsCount} order items, {$engagementCount} video engagements."
            );
        }
    }

    private function ensureAnalyticsCustomers(): Collection
    {
        return collect(range(1, self::CUSTOMER_COUNT))
            ->map(function (int $index): User {
                $email = "analytics.customer{$index}@hungerrush.local";
                $phone = sprintf('07%09d', $index);

                return User::query()->firstOrCreate(
                    ['email' => $email],
                    [
                        'name' => "Analytics Customer {$index}",
                        'phone' => $phone,
                        'role' => 'customer',
                        'status' => 'active',
                        'email_verified_at' => now(),
                        'password' => Hash::make('password'),
                    ]
                );
            });
    }

    /**
     * @return array{Collection<int, MenuItem>, array<int, int>}
     */
    private function ensureMenuItemsAndVideos(Restaurant $restaurant): array
    {
        $category = MenuCategory::query()->firstOrCreate(
            ['restaurant_id' => $restaurant->id, 'name' => 'Best Sellers'],
            ['sort_order' => 1]
        );

        $seedItems = [
            ['name' => 'Signature Burger', 'price' => 13.50, 'prep_time' => 18],
            ['name' => 'Loaded Fries', 'price' => 6.75, 'prep_time' => 12],
            ['name' => 'Chicken Wrap', 'price' => 10.90, 'prep_time' => 14],
            ['name' => 'Sparkling Drink', 'price' => 3.50, 'prep_time' => 4],
            ['name' => 'Chocolate Shake', 'price' => 5.80, 'prep_time' => 7],
        ];

        foreach ($seedItems as $position => $item) {
            MenuItem::query()->firstOrCreate(
                ['category_id' => $category->id, 'name' => $item['name']],
                [
                    'description' => 'Auto-generated analytics seed item.',
                    'image_urls' => [
                        'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80',
                    ],
                    'price' => $item['price'],
                    'is_available' => true,
                    'prep_time' => $item['prep_time'],
                ]
            );
        }

        $menuItems = MenuItem::query()
            ->whereHas('category', fn ($query) => $query->where('restaurant_id', $restaurant->id))
            ->get();

        if ($menuItems->isEmpty()) {
            $menuItems = collect([
                MenuItem::query()->create([
                    'category_id' => $category->id,
                    'name' => 'Fallback Item',
                    'description' => 'Fallback item for analytics seeding.',
                    'image_urls' => [
                        'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80',
                    ],
                    'price' => 9.99,
                    'is_available' => true,
                    'prep_time' => 15,
                ]),
            ]);
        }

        $publishedVideos = Video::query()
            ->where('restaurant_id', $restaurant->id)
            ->where('status', 'published')
            ->get();

        if ($publishedVideos->count() < 3) {
            $titles = [
                'Behind the Grill',
                'Cheese Pull Special',
                'Kitchen Speed Challenge',
            ];

            foreach ($titles as $title) {
                Video::query()->create([
                    'restaurant_id' => $restaurant->id,
                    'menu_item_id' => $menuItems->random()->id,
                    'title' => $title,
                    'description' => 'Auto-generated analytics seed video.',
                    'media_url' => 'https://example.com/videos/demo.mp4',
                    'thumbnail_url' => 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80',
                    'status' => 'published',
                    'published_at' => now()->subDays(random_int(15, 300)),
                ]);
            }

            $publishedVideos = Video::query()
                ->where('restaurant_id', $restaurant->id)
                ->where('status', 'published')
                ->get();
        }

        return [$menuItems->values(), $publishedVideos->pluck('id')->all()];
    }

    private function resetRestaurantSyntheticData(int $restaurantId, array $customerIds, array $videoIds): void
    {
        Order::query()
            ->where('restaurant_id', $restaurantId)
            ->whereIn('customer_id', $customerIds)
            ->delete();

        if (!empty($videoIds)) {
            VideoEngagement::query()
                ->whereIn('video_id', $videoIds)
                ->whereIn('user_id', $customerIds)
                ->delete();
        }
    }

    /**
     * @param  Collection<int, MenuItem>  $menuItems
     * @return array{int, int}
     */
    private function seedOrdersForFullYear(int $restaurantId, Collection $menuItems, array $customerIds): array
    {
        $start = now()->startOfYear()->startOfDay();
        $end = now()->endOfYear()->startOfDay();
        $cursor = $start->copy();

        $ordersCount = 0;
        $orderItemsCount = 0;

        while ($cursor->lte($end)) {
            $ordersForDay = $this->ordersCountForDay($cursor);

            for ($index = 0; $index < $ordersForDay; $index++) {
                $createdAt = $cursor->copy()->setTime(
                    random_int(10, 22),
                    random_int(0, 59),
                    random_int(0, 59)
                );

                $selectedItems = $menuItems->shuffle()->take(random_int(1, min(3, $menuItems->count())));

                $subtotal = 0.0;
                $itemRows = [];

                foreach ($selectedItems as $menuItem) {
                    $quantity = random_int(1, 3);
                    $unitPrice = max(1.5, (float) $menuItem->price);
                    $subtotal += $unitPrice * $quantity;

                    $itemRows[] = [
                        'menu_item_id' => $menuItem->id,
                        'quantity' => $quantity,
                        'unit_price' => round($unitPrice, 2),
                    ];
                }

                $fees = round($subtotal * 0.10, 2);
                $total = round($subtotal + $fees, 2);
                $customerId = $customerIds[array_rand($customerIds)];

                $orderId = DB::table('orders')->insertGetId([
                    'customer_id' => $customerId,
                    'restaurant_id' => $restaurantId,
                    'branch_id' => null,
                    'subtotal' => round($subtotal, 2),
                    'fees' => $fees,
                    'total' => $total,
                    'status' => 'delivered',
                    'payment_status' => 'paid',
                    'is_quick_order' => true,
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                ]);

                foreach ($itemRows as $itemRow) {
                    DB::table('order_items')->insert([
                        'order_id' => $orderId,
                        'menu_item_id' => $itemRow['menu_item_id'],
                        'quantity' => $itemRow['quantity'],
                        'unit_price' => $itemRow['unit_price'],
                        'notes' => 'Synthetic analytics seed item.',
                        'created_at' => $createdAt,
                        'updated_at' => $createdAt,
                    ]);
                    $orderItemsCount++;
                }

                $ordersCount++;
            }

            $cursor->addDay();
        }

        return [$ordersCount, $orderItemsCount];
    }

    private function ordersCountForDay(Carbon $date): int
    {
        $monthBoost = match ((int) $date->month) {
            1, 2 => 2,
            3, 4, 5 => 3,
            6, 7, 8 => 4,
            9, 10, 11 => 3,
            12 => 5,
            default => 2,
        };

        $weekendBoost = $date->isWeekend() ? 2 : 0;

        return 1 + $monthBoost + $weekendBoost + random_int(0, 2);
    }

    private function seedVideoEngagementForFullYear(array $videoIds, array $customerIds): int
    {
        if (empty($videoIds)) {
            return 0;
        }

        $start = now()->startOfYear()->startOfDay();
        $end = now()->endOfYear()->startOfDay();
        $cursor = $start->copy();

        $rows = [];
        $inserted = 0;

        while ($cursor->lte($end)) {
            $engagementDate = $cursor->copy()->setTime(random_int(11, 23), random_int(0, 59), random_int(0, 59));
            $videoId = $videoIds[array_rand($videoIds)];
            $viewCount = random_int(18, 75);
            $likeCount = max(1, (int) floor($viewCount * 0.20));
            $shareCount = max(1, (int) floor($viewCount * 0.07));
            $saveCount = max(1, (int) floor($viewCount * 0.10));

            foreach (['view' => $viewCount, 'like' => $likeCount, 'share' => $shareCount, 'save' => $saveCount] as $type => $count) {
                for ($index = 0; $index < $count; $index++) {
                    $rows[] = [
                        'video_id' => $videoId,
                        'user_id' => $customerIds[array_rand($customerIds)],
                        'type' => $type,
                        'created_at' => $engagementDate,
                        'updated_at' => $engagementDate,
                    ];

                    if (count($rows) >= 1000) {
                        DB::table('video_engagements')->insert($rows);
                        $inserted += count($rows);
                        $rows = [];
                    }
                }
            }

            $cursor->addDay();
        }

        if (!empty($rows)) {
            DB::table('video_engagements')->insert($rows);
            $inserted += count($rows);
        }

        return $inserted;
    }
}
