<?php

namespace Database\Seeders;

use App\Enums\OrderStatus;
use App\Models\LoyaltyMember;
use App\Models\LoyaltyRedemption;
use App\Models\LoyaltyReward;
use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Restaurant;
use App\Models\Review;
use App\Models\User;
use App\Models\Video;
use App\Models\VideoEngagement;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $owner = User::query()->updateOrCreate(
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

        $customer = User::query()->updateOrCreate(
            ['email' => 'customer@hungerrush.local'],
            [
                'name' => 'Demo Customer',
                'phone' => '01999999999',
                'role' => 'customer',
                'status' => 'active',
                'email_verified_at' => now(),
                'password' => Hash::make('password'),
            ]
        );

        $extraCustomers = User::factory()->count(4)->create([
            'role' => 'customer',
        ]);

        $restaurant = Restaurant::query()->updateOrCreate(
            ['owner_user_id' => $owner->id],
            [
                'name' => 'HungerRush Demo Kitchen',
                'description' => 'Demo restaurant for frontend integration.',
                'status' => 'active',
                'settings' => [
                    'default_prep_time' => 20,
                    'auto_accept_orders' => false,
                    'notifications_enabled' => true,
                    'currency' => 'USD',
                    'timezone' => 'Asia/Beirut',
                ],
            ]
        );

        $existingCategoryIds = MenuCategory::query()
            ->where('restaurant_id', $restaurant->id)
            ->pluck('id');
        if ($existingCategoryIds->isNotEmpty()) {
            Review::query()->where('restaurant_id', $restaurant->id)->delete();

            $existingOrderIds = Order::query()
                ->where('restaurant_id', $restaurant->id)
                ->pluck('id');
            if ($existingOrderIds->isNotEmpty()) {
                OrderItem::query()->whereIn('order_id', $existingOrderIds)->delete();
                Order::query()->whereIn('id', $existingOrderIds)->delete();
            }

            $existingVideoIds = Video::query()
                ->where('restaurant_id', $restaurant->id)
                ->pluck('id');
            if ($existingVideoIds->isNotEmpty()) {
                VideoEngagement::query()->whereIn('video_id', $existingVideoIds)->delete();
                Video::query()->whereIn('id', $existingVideoIds)->delete();
            }

            LoyaltyRedemption::query()->where('restaurant_id', $restaurant->id)->delete();
            LoyaltyMember::query()->where('restaurant_id', $restaurant->id)->delete();
            LoyaltyReward::query()->where('restaurant_id', $restaurant->id)->delete();

            MenuItem::query()->whereIn('category_id', $existingCategoryIds)->delete();
            MenuCategory::query()->whereIn('id', $existingCategoryIds)->delete();
        }

        $burgers = MenuCategory::factory()->create([
            'restaurant_id' => $restaurant->id,
            'name' => 'Burgers',
            'sort_order' => 1,
        ]);

        $drinks = MenuCategory::factory()->create([
            'restaurant_id' => $restaurant->id,
            'name' => 'Drinks',
            'sort_order' => 2,
        ]);

        $desserts = MenuCategory::factory()->create([
            'restaurant_id' => $restaurant->id,
            'name' => 'Desserts',
            'sort_order' => 3,
        ]);

        $classicBurger = MenuItem::factory()->create([
            'category_id' => $burgers->id,
            'name' => 'Classic Burger',
            'image_urls' => [
                'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80',
                'https://images.unsplash.com/photo-1550317138-10000687a72b?auto=format&fit=crop&w=900&q=80',
            ],
            'price' => 12.50,
            'prep_time' => 20,
        ]);

        $cheeseBurger = MenuItem::factory()->create([
            'category_id' => $burgers->id,
            'name' => 'Double Cheese Blaze',
            'image_urls' => [
                'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80',
                'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?auto=format&fit=crop&w=900&q=80',
            ],
            'price' => 15.75,
            'prep_time' => 22,
        ]);

        $cola = MenuItem::factory()->create([
            'category_id' => $drinks->id,
            'name' => 'Cola',
            'image_urls' => [
                'https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&w=900&q=80',
            ],
            'price' => 3.50,
            'prep_time' => 5,
        ]);

        $lavaCake = MenuItem::factory()->create([
            'category_id' => $desserts->id,
            'name' => 'Lava Cake',
            'image_urls' => [
                'https://images.unsplash.com/photo-1617305855058-336d24456869?auto=format&fit=crop&w=900&q=80',
                'https://images.unsplash.com/photo-1602351447937-745cb720612f?auto=format&fit=crop&w=900&q=80',
            ],
            'price' => 7.25,
            'prep_time' => 12,
        ]);

        $baseOrder = $this->createOrderForCustomer(
            $customer,
            $restaurant,
            [
                ['item' => $classicBurger, 'quantity' => 1],
                ['item' => $cola, 'quantity' => 1],
            ],
            'pending'
        );

        $allCustomers = $extraCustomers->prepend($customer);
        $statuses = [
            'accepted',
            'preparing',
            'ready_for_pickup',
            'on_the_way',
            'delivered',
            'delivered',
            'delivered',
            'delivered',
            'delivered',
        ];

        $createdOrders = [$baseOrder];
        foreach ($statuses as $index => $status) {
            $createdOrders[] = $this->createOrderForCustomer(
                $allCustomers[$index % $allCustomers->count()],
                $restaurant,
                [
                    ['item' => $index % 2 === 0 ? $cheeseBurger : $classicBurger, 'quantity' => 1 + ($index % 3)],
                    ['item' => $index % 2 === 0 ? $cola : $lavaCake, 'quantity' => 1],
                ],
                $status
            );
        }

        $reviewTemplates = [
            [
                'rating' => 5,
                'comment' => 'Great food and quick delivery.',
                'reply' => 'Thank you for the feedback, we appreciate you.',
            ],
            [
                'rating' => 4,
                'comment' => 'Loved the burger, fries could be hotter.',
                'reply' => null,
            ],
            [
                'rating' => 5,
                'comment' => 'Fantastic quality and packaging.',
                'reply' => 'Glad you enjoyed it. See you again soon.',
            ],
            [
                'rating' => 3,
                'comment' => 'Taste was good, delivery was a little late.',
                'reply' => null,
            ],
            [
                'rating' => 4,
                'comment' => 'Portion size was generous and still warm on arrival.',
                'reply' => 'Thanks for sharing this, we are happy it arrived hot.',
            ],
        ];

        $deliveredOrders = collect($createdOrders)
            ->filter(function (Order $order) {
                $statusValue = $order->status instanceof OrderStatus
                    ? $order->status->value
                    : (string) $order->status;

                return $statusValue === OrderStatus::Delivered->value;
            })
            ->values();

        foreach ($deliveredOrders as $orderIndex => $order) {
            $template = $reviewTemplates[$orderIndex % count($reviewTemplates)];
            $hasReply = $template['reply'] !== null;

            Review::create([
                'restaurant_id' => $restaurant->id,
                'customer_id' => $order->customer_id,
                'order_id' => $order->id,
                'rating' => $template['rating'],
                'comment' => $template['comment'],
                'reply' => $template['reply'],
                'replied_by' => $hasReply ? $owner->id : null,
                'replied_at' => $hasReply ? now()->subDays($orderIndex) : null,
                'created_at' => now()->subDays($orderIndex + 1),
                'updated_at' => now()->subDays($orderIndex + 1),
            ]);
        }

        $videos = collect([
            [
                'title' => 'Classic Burger Build',
                'description' => 'Layering the perfect burger in 20 seconds.',
                'media_url' => 'https://example.com/videos/classic-burger.mp4',
                'thumbnail_url' => 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80',
                'menu_item_id' => $classicBurger->id,
                'status' => 'published',
            ],
            [
                'title' => 'Double Cheese Blaze Reveal',
                'description' => 'A cheesy pull guaranteed to make customers hungry.',
                'media_url' => 'https://example.com/videos/double-cheese-blaze.mp4',
                'thumbnail_url' => 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80',
                'menu_item_id' => $cheeseBurger->id,
                'status' => 'published',
            ],
            [
                'title' => 'Lava Cake Final Touch',
                'description' => 'Dusting cocoa right before serving.',
                'media_url' => 'https://example.com/videos/lava-cake.mp4',
                'thumbnail_url' => 'https://images.unsplash.com/photo-1617305855058-336d24456869?auto=format&fit=crop&w=900&q=80',
                'menu_item_id' => $lavaCake->id,
                'status' => 'draft',
            ],
        ])->map(function (array $videoData, int $index) use ($restaurant) {
            return $restaurant->videos()->create([
                ...$videoData,
                'published_at' => $videoData['status'] === 'published' ? now()->subDays($index + 2) : null,
            ]);
        });

        $engagementUsers = $allCustomers->push($owner);
        foreach ($videos as $video) {
            foreach ($engagementUsers as $engagementUser) {
                VideoEngagement::create([
                    'video_id' => $video->id,
                    'user_id' => $engagementUser->id,
                    'type' => 'view',
                    'created_at' => now()->subDays(random_int(0, 6)),
                    'updated_at' => now()->subDays(random_int(0, 6)),
                ]);

                if (random_int(0, 1) === 1) {
                    VideoEngagement::create([
                        'video_id' => $video->id,
                        'user_id' => $engagementUser->id,
                        'type' => 'like',
                        'created_at' => now()->subDays(random_int(0, 6)),
                        'updated_at' => now()->subDays(random_int(0, 6)),
                    ]);
                }
            }
        }

        $rewards = collect([
            [
                'name' => '10% Off Loyal Special',
                'description' => 'Unlocked after 5 completed orders.',
                'points_required' => 300,
                'reward_type' => 'discount',
                'status' => 'active',
                'usage_count' => 124,
            ],
            [
                'name' => 'Free Dessert Voucher',
                'description' => 'Redeem for any dessert item.',
                'points_required' => 500,
                'reward_type' => 'free_item',
                'status' => 'draft',
                'usage_count' => 0,
            ],
            [
                'name' => 'Free Delivery Weekend',
                'description' => 'No delivery fee for premium members.',
                'points_required' => 700,
                'reward_type' => 'free_delivery',
                'status' => 'active',
                'usage_count' => 52,
            ],
        ])->map(fn (array $rewardData) => $restaurant->loyaltyRewards()->create($rewardData));

        foreach ($allCustomers as $index => $memberUser) {
            $member = LoyaltyMember::create([
                'restaurant_id' => $restaurant->id,
                'customer_id' => $memberUser->id,
                'points' => 3000 - ($index * 450),
                'orders_count' => 8 - $index,
                'tier' => $index === 0 ? 'gold' : ($index < 3 ? 'silver' : 'bronze'),
                'last_activity_at' => now()->subDays($index),
            ]);

            if ($index < 3) {
                LoyaltyRedemption::create([
                    'restaurant_id' => $restaurant->id,
                    'loyalty_member_id' => $member->id,
                    'loyalty_reward_id' => $rewards[0]->id,
                    'points_spent' => 300,
                    'created_at' => now()->subDays($index + 1),
                    'updated_at' => now()->subDays($index + 1),
                ]);
            }
        }
    }

    private function createOrderForCustomer(User $customer, Restaurant $restaurant, array $items, string $status): Order
    {
        $subtotal = collect($items)->sum(
            fn (array $item) => ((float) $item['item']->price) * (int) $item['quantity']
        );
        $fees = round($subtotal * 0.10, 2);

        $order = Order::query()->create([
            'customer_id' => $customer->id,
            'restaurant_id' => $restaurant->id,
            'branch_id' => null,
            'subtotal' => $subtotal,
            'fees' => $fees,
            'total' => round($subtotal + $fees, 2),
            'status' => $status,
            'payment_status' => $status === 'delivered' ? 'paid' : 'unpaid',
        ]);

        foreach ($items as $itemRow) {
            /** @var MenuItem $menuItem */
            $menuItem = $itemRow['item'];
            OrderItem::query()->create([
                'order_id' => $order->id,
                'menu_item_id' => $menuItem->id,
                'quantity' => (int) $itemRow['quantity'],
                'unit_price' => (float) $menuItem->price,
                'notes' => null,
            ]);
        }

        return $order;
    }
}
