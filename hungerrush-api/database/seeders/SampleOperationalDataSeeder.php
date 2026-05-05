<?php

namespace Database\Seeders;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Conversation;
use App\Models\ConversationMessage;
use App\Models\CustomerSearch;
use App\Models\LoyaltyMember;
use App\Models\LoyaltyRedemption;
use App\Models\LoyaltyReward;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderStatusHistory;
use App\Models\Report;
use App\Models\Restaurant;
use App\Models\RestaurantBranch;
use App\Models\RestaurantFollow;
use App\Models\Review;
use App\Models\SupportRequest;
use App\Models\User;
use App\Models\UserNotification;
use App\Models\Video;
use App\Models\VideoComment;
use App\Models\VideoEngagement;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class SampleOperationalDataSeeder extends Seeder
{
    /**
     * @var array<string, int>
     */
    private array $driverIdsByEmail = [];

    public function run(): void
    {
        Model::unguarded(function (): void {
            DB::transaction(function (): void {
                $admin = User::query()->where('email', 'admin@hungerrush.local')->firstOrFail();
                $customers = User::query()->where('role', 'customer')->orderBy('id')->get();
                $driverUsers = User::query()->where('role', 'driver')->orderBy('id')->get();
                $restaurants = Restaurant::query()->with(['branches', 'owner'])->orderBy('id')->get();

                $this->driverIdsByEmail = $this->seedDrivers($driverUsers);
                $this->seedCarts($customers, $restaurants);
                $orders = $this->seedOrders($customers, $restaurants);
                $this->seedReviews($orders);
                $this->seedNotifications($admin, $customers, $restaurants, $orders);
                $this->seedLoyalty($customers, $restaurants);
                $videos = $this->seedVideos($customers, $restaurants);
                $this->seedCustomerSignals($customers, $restaurants, $videos);
                $this->seedConversationsAndSupport($admin, $customers, $restaurants, $orders);
            });
        });
    }

    /**
     * @param  Collection<int, User>  $driverUsers
     * @return array<string, int>
     */
    private function seedDrivers(Collection $driverUsers): array
    {
        $vehicles = ['scooter', 'motorcycle', 'car'];
        $driverIdsByEmail = [];

        foreach ($driverUsers->values() as $index => $driverUser) {
            $existingDriver = DB::table('drivers')
                ->where('user_id', $driverUser->id)
                ->first();

            $driverPayload = [
                'user_id' => $driverUser->id,
                'vehicle_type' => $vehicles[$index % count($vehicles)],
                'verification_status' => $index === 2 ? 'pending' : 'verified',
                'online_status' => $index !== 2,
                'updated_at' => now(),
            ];

            if ($existingDriver) {
                DB::table('drivers')
                    ->where('id', $existingDriver->id)
                    ->update($driverPayload);
                $driverId = (int) $existingDriver->id;
            } else {
                $driverId = (int) DB::table('drivers')->insertGetId([
                    ...$driverPayload,
                    'created_at' => now(),
                ]);
            }

            DB::table('driver_locations')->insert([
                'driver_id' => $driverId,
                'lat' => 33.8930000 + ($index * 0.0065000),
                'lng' => 35.5010000 + ($index * 0.0043000),
                'recorded_at' => now()->subMinutes($index * 7),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $driverIdsByEmail[$driverUser->email] = $driverId;
        }

        return $driverIdsByEmail;
    }

    /**
     * @param  Collection<int, User>  $customers
     * @param  Collection<int, Restaurant>  $restaurants
     */
    private function seedCarts(Collection $customers, Collection $restaurants): void
    {
        foreach ($customers->take(3)->values() as $index => $customer) {
            $restaurant = $restaurants[$index % $restaurants->count()];
            $items = $this->menuItemsFor($restaurant);

            if ($items->isEmpty()) {
                continue;
            }

            $cart = Cart::query()->updateOrCreate(
                ['customer_id' => $customer->id],
                ['restaurant_id' => $restaurant->id]
            );
            CartItem::query()->where('cart_id', $cart->id)->delete();

            foreach ($items->take(2)->values() as $itemIndex => $menuItem) {
                CartItem::query()->create([
                    'cart_id' => $cart->id,
                    'menu_item_id' => $menuItem->id,
                    'quantity' => $itemIndex + 1,
                    'notes' => $itemIndex === 0 ? 'Extra sauce on the side.' : null,
                ]);
            }
        }
    }

    /**
     * @param  Collection<int, User>  $customers
     * @param  Collection<int, Restaurant>  $restaurants
     * @return Collection<int, Order>
     */
    private function seedOrders(Collection $customers, Collection $restaurants): Collection
    {
        $orders = collect();
        $statuses = [
            'pending',
            'accepted',
            'preparing',
            'ready_for_pickup',
            'on_the_way',
            'delivered',
            'delivered',
            'cancelled',
        ];

        foreach ($restaurants->values() as $restaurantIndex => $restaurant) {
            $items = $this->menuItemsFor($restaurant);

            if ($items->isEmpty()) {
                continue;
            }

            foreach ($statuses as $statusIndex => $status) {
                $customer = $customers[($restaurantIndex + $statusIndex) % $customers->count()];
                $branch = $restaurant->branches->values()[$statusIndex % max(1, $restaurant->branches->count())] ?? null;
                $driverId = $this->driverIdsByEmail[array_keys($this->driverIdsByEmail)[$statusIndex % max(1, count($this->driverIdsByEmail))] ?? ''] ?? null;

                $orders->push($this->createOrder(
                    $restaurant,
                    $customer,
                    $items,
                    $branch,
                    $driverId,
                    $restaurantIndex * 10 + $statusIndex,
                    $status,
                    $statusIndex === 1
                ));
            }
        }

        return $orders;
    }

    /**
     * @param  Collection<int, MenuItem>  $items
     */
    private function createOrder(
        Restaurant $restaurant,
        User $customer,
        Collection $items,
        ?RestaurantBranch $branch,
        ?int $driverId,
        int $index,
        string $status,
        bool $isQuickOrder
    ): Order {
        $placedAt = now()
            ->subDays($index + 1)
            ->setTime(11 + ($index % 10), ($index * 7) % 60);

        $selectedItems = collect([
            $items[$index % $items->count()],
            $items[($index + 2) % $items->count()],
        ])->unique('id')->values();

        $subtotal = 0.0;
        foreach ($selectedItems->values() as $lineIndex => $item) {
            $subtotal += (float) $item->price * ($lineIndex + 1);
        }
        $fees = round($subtotal * 0.10, 2);

        $order = Order::query()->create([
            'customer_id' => $customer->id,
            'restaurant_id' => $restaurant->id,
            'branch_id' => $branch?->id,
            'subtotal' => round($subtotal, 2),
            'fees' => $fees,
            'total' => round($subtotal + $fees, 2),
            'status' => $status,
            'payment_status' => $status === 'delivered' ? 'paid' : ($status === 'cancelled' ? 'refunded' : 'unpaid'),
            'is_quick_order' => $isQuickOrder,
            'created_at' => $placedAt,
            'updated_at' => $placedAt->copy()->addMinutes(35),
        ]);

        foreach ($selectedItems as $lineIndex => $menuItem) {
            OrderItem::query()->create([
                'order_id' => $order->id,
                'menu_item_id' => $menuItem->id,
                'quantity' => $lineIndex + 1,
                'unit_price' => (float) $menuItem->price,
                'notes' => $lineIndex === 0 ? 'No onions, please.' : null,
                'created_at' => $placedAt,
                'updated_at' => $placedAt,
            ]);
        }

        $this->seedStatusHistory($order, $customer->id, $restaurant->owner_user_id, $placedAt, $status);
        $this->seedDeliveryTask($order, $driverId, $placedAt, $status);

        return $order;
    }

    private function seedStatusHistory(Order $order, int $customerId, int $ownerId, mixed $placedAt, string $status): void
    {
        $statuses = ['pending'];

        if ($status === 'cancelled') {
            $statuses[] = 'cancelled';
        } else {
            foreach (['accepted', 'preparing', 'ready_for_pickup', 'picked_up', 'on_the_way', 'delivered'] as $nextStatus) {
                $statuses[] = $nextStatus;

                if ($nextStatus === $status) {
                    break;
                }
            }
        }

        foreach ($statuses as $index => $historyStatus) {
            OrderStatusHistory::query()->create([
                'order_id' => $order->id,
                'status' => $historyStatus,
                'changed_by' => $historyStatus === 'pending' ? $customerId : $ownerId,
                'changed_at' => $placedAt->copy()->addMinutes($index * 12),
                'created_at' => $placedAt->copy()->addMinutes($index * 12),
                'updated_at' => $placedAt->copy()->addMinutes($index * 12),
            ]);
        }
    }

    private function seedDeliveryTask(Order $order, ?int $driverId, mixed $placedAt, string $orderStatus): void
    {
        if ($driverId === null || in_array($orderStatus, ['pending', 'cancelled', 'rejected'], true)) {
            return;
        }

        $taskStatus = match ($orderStatus) {
            'accepted', 'preparing' => 'assigned',
            'ready_for_pickup' => 'accepted',
            'picked_up', 'on_the_way' => 'picked_up',
            'delivered' => 'delivered',
            default => 'unassigned',
        };

        DB::table('delivery_tasks')->insert([
            'order_id' => $order->id,
            'driver_id' => $driverId,
            'status' => $taskStatus,
            'assigned_at' => $placedAt->copy()->addMinutes(10),
            'picked_at' => in_array($taskStatus, ['picked_up', 'delivered'], true)
                ? $placedAt->copy()->addMinutes(35)
                : null,
            'delivered_at' => $taskStatus === 'delivered'
                ? $placedAt->copy()->addMinutes(58)
                : null,
            'created_at' => $placedAt,
            'updated_at' => $placedAt->copy()->addMinutes(20),
        ]);
    }

    /**
     * @param  Collection<int, Order>  $orders
     */
    private function seedReviews(Collection $orders): void
    {
        $templates = [
            [5, 'Food arrived hot and the packaging was excellent.', 'Thanks for ordering. We are glad it arrived fresh.'],
            [4, 'Great flavor and quick prep. The fries could use more salt.', null],
            [5, 'The sushi box tasted very fresh and looked premium.', 'Thank you. The kitchen team will be happy to hear this.'],
            [3, 'Delivery was late, but the grill platter was still tasty.', null],
            [5, 'The burger was exactly as advertised in the video.', 'Appreciate the feedback. See you again soon.'],
        ];

        $deliveredOrders = $orders
            ->filter(fn (Order $order): bool => ($order->status?->value ?? $order->status) === 'delivered')
            ->values();

        foreach ($deliveredOrders as $index => $order) {
            [$rating, $comment, $reply] = $templates[$index % count($templates)];

            Review::query()->updateOrCreate(
                ['order_id' => $order->id],
                [
                    'restaurant_id' => $order->restaurant_id,
                    'customer_id' => $order->customer_id,
                    'rating' => $rating,
                    'comment' => $comment,
                    'reply' => $reply,
                    'replied_by' => $reply ? $order->restaurant->owner_user_id : null,
                    'replied_at' => $reply ? now()->subDays($index) : null,
                ]
            );
        }
    }

    /**
     * @param  Collection<int, User>  $customers
     * @param  Collection<int, Restaurant>  $restaurants
     * @param  Collection<int, Order>  $orders
     */
    private function seedNotifications(User $admin, Collection $customers, Collection $restaurants, Collection $orders): void
    {
        UserNotification::query()->create([
            'user_id' => $admin->id,
            'type' => 'admin',
            'title' => 'New restaurants pending review',
            'body' => 'Sample data includes active restaurants, reports, support requests, and recent order volume.',
            'data' => ['restaurants_count' => $restaurants->count()],
            'read_at' => null,
        ]);

        foreach ($orders->take(8) as $order) {
            UserNotification::query()->create([
                'user_id' => $order->customer_id,
                'type' => 'order',
                'title' => 'Order status updated',
                'body' => "Order #{$order->id} is now {$order->status->value}.",
                'data' => ['order_id' => $order->id, 'status' => $order->status->value],
                'read_at' => $order->status->value === 'delivered' ? now()->subHours(8) : null,
            ]);

            UserNotification::query()->create([
                'user_id' => $order->restaurant->owner_user_id,
                'type' => 'restaurant_order',
                'title' => 'Restaurant order activity',
                'body' => "Order #{$order->id} was created for {$order->restaurant->name}.",
                'data' => ['order_id' => $order->id, 'restaurant_id' => $order->restaurant_id],
                'read_at' => null,
            ]);
        }

        foreach ($customers->take(3) as $index => $customer) {
            UserNotification::query()->create([
                'user_id' => $customer->id,
                'type' => 'loyalty',
                'title' => 'Loyalty points added',
                'body' => 'You earned sample loyalty points from recent HungerRush orders.',
                'data' => ['points' => 75 + ($index * 25)],
                'read_at' => $index === 0 ? now()->subDay() : null,
            ]);
        }
    }

    /**
     * @param  Collection<int, User>  $customers
     * @param  Collection<int, Restaurant>  $restaurants
     */
    private function seedLoyalty(Collection $customers, Collection $restaurants): void
    {
        foreach ($restaurants as $restaurantIndex => $restaurant) {
            $rewards = collect([
                LoyaltyReward::query()->updateOrCreate(
                    ['restaurant_id' => $restaurant->id, 'name' => '10% Off Next Order'],
                    [
                        'description' => 'Redeem for a discount on any order above $15.',
                        'points_required' => 300,
                        'reward_type' => 'discount',
                        'status' => 'active',
                        'usage_count' => 22 + $restaurantIndex,
                    ]
                ),
                LoyaltyReward::query()->updateOrCreate(
                    ['restaurant_id' => $restaurant->id, 'name' => 'Free Delivery Pass'],
                    [
                        'description' => 'Free delivery on your next eligible order.',
                        'points_required' => 450,
                        'reward_type' => 'free_delivery',
                        'status' => 'active',
                        'usage_count' => 11 + $restaurantIndex,
                    ]
                ),
                LoyaltyReward::query()->updateOrCreate(
                    ['restaurant_id' => $restaurant->id, 'name' => 'Chef Surprise Item'],
                    [
                        'description' => 'A rotating kitchen favorite added to your order.',
                        'points_required' => 650,
                        'reward_type' => 'free_item',
                        'status' => 'draft',
                        'usage_count' => 0,
                    ]
                ),
            ]);

            foreach ($customers->take(5)->values() as $customerIndex => $customer) {
                $member = LoyaltyMember::query()->updateOrCreate(
                    [
                        'restaurant_id' => $restaurant->id,
                        'customer_id' => $customer->id,
                    ],
                    [
                        'points' => 1200 - ($customerIndex * 145) + ($restaurantIndex * 50),
                        'orders_count' => 9 - $customerIndex,
                        'tier' => $customerIndex === 0 ? 'gold' : ($customerIndex < 3 ? 'silver' : 'bronze'),
                        'last_activity_at' => now()->subDays($customerIndex + $restaurantIndex),
                    ]
                );

                if ($customerIndex < 2) {
                    LoyaltyRedemption::query()->firstOrCreate(
                        [
                            'loyalty_member_id' => $member->id,
                            'loyalty_reward_id' => $rewards[$customerIndex]->id,
                        ],
                        [
                            'restaurant_id' => $restaurant->id,
                            'points_spent' => $rewards[$customerIndex]->points_required,
                        ]
                    );
                }
            }
        }
    }

    /**
     * @param  Collection<int, User>  $customers
     * @param  Collection<int, Restaurant>  $restaurants
     * @return Collection<int, Video>
     */
    private function seedVideos(Collection $customers, Collection $restaurants): Collection
    {
        $videos = collect();

        foreach ($restaurants->values() as $restaurantIndex => $restaurant) {
            $items = $this->menuItemsFor($restaurant)->values();

            if ($items->isEmpty()) {
                continue;
            }

            $videoRows = [
                ['Kitchen Rush: Best Seller Prep', 'published', 18],
                ['Fresh Out Of The Kitchen', 'published', 24],
                ['Owner Picks This Week', 'draft', 31],
            ];

            foreach ($videoRows as $videoIndex => [$title, $status, $duration]) {
                $uid = str_pad(dechex(($restaurantIndex + 1) * 1000 + $videoIndex + 1), 32, '0', STR_PAD_LEFT);
                $menuItem = $items[$videoIndex % $items->count()];

                $video = Video::query()->updateOrCreate(
                    [
                        'restaurant_id' => $restaurant->id,
                        'title' => $title,
                    ],
                    [
                        'menu_item_id' => $menuItem->id,
                        'description' => "Short-form promo for {$menuItem->name}.",
                        'media_url' => "https://videodelivery.net/{$uid}/manifest/video.m3u8",
                        'thumbnail_url' => $menuItem->image_urls[0] ?? 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80',
                        'cloudflare_stream_uid' => $uid,
                        'duration_seconds' => $duration,
                        'stream_status' => $status === 'published' ? 'ready' : 'queued',
                        'stream_ready' => $status === 'published',
                        'stream_hls_url' => "https://videodelivery.net/{$uid}/manifest/video.m3u8",
                        'stream_dash_url' => "https://videodelivery.net/{$uid}/manifest/video.mpd",
                        'stream_preview_url' => "https://videodelivery.net/{$uid}/watch",
                        'status' => $status,
                        'published_at' => $status === 'published' ? now()->subDays($videoIndex + 2) : null,
                    ]
                );

                $videos->push($video);
            }
        }

        VideoEngagement::query()->whereIn('video_id', $videos->pluck('id'))->delete();
        VideoComment::query()->whereIn('video_id', $videos->pluck('id'))->delete();

        foreach ($videos as $videoIndex => $video) {
            foreach ($customers->take(6)->values() as $customerIndex => $customer) {
                VideoEngagement::query()->create([
                    'video_id' => $video->id,
                    'user_id' => $customer->id,
                    'type' => 'view',
                    'created_at' => now()->subDays(($videoIndex + $customerIndex) % 7),
                    'updated_at' => now()->subDays(($videoIndex + $customerIndex) % 7),
                ]);

                if (($videoIndex + $customerIndex) % 2 === 0) {
                    VideoEngagement::query()->create([
                        'video_id' => $video->id,
                        'user_id' => $customer->id,
                        'type' => 'like',
                    ]);
                }

                if ($customerIndex % 3 === 0) {
                    VideoEngagement::query()->create([
                        'video_id' => $video->id,
                        'user_id' => $customer->id,
                        'type' => 'share',
                    ]);
                }
            }

            foreach ($customers->take(2)->values() as $customer) {
                VideoComment::query()->create([
                    'video_id' => $video->id,
                    'user_id' => $customer->id,
                    'body' => $video->status === 'published'
                        ? 'This looks great. Adding it to my next order.'
                        : 'Can not wait to try this when it launches.',
                ]);
            }
        }

        return $videos;
    }

    /**
     * @param  Collection<int, User>  $customers
     * @param  Collection<int, Restaurant>  $restaurants
     * @param  Collection<int, Video>  $videos
     */
    private function seedCustomerSignals(Collection $customers, Collection $restaurants, Collection $videos): void
    {
        foreach ($customers->take(5)->values() as $customerIndex => $customer) {
            foreach ($restaurants->take(2)->values() as $restaurant) {
                RestaurantFollow::query()->updateOrCreate([
                    'restaurant_id' => $restaurant->id,
                    'user_id' => $customer->id,
                ]);
            }

            foreach (['burger', 'shawarma', 'sushi', 'late night fries'] as $searchIndex => $query) {
                CustomerSearch::query()->create([
                    'user_id' => $customer->id,
                    'query' => $query,
                    'normalized_query' => strtolower($query),
                    'context' => $searchIndex % 2 === 0 ? 'video_feed' : 'restaurant_search',
                    'created_at' => now()->subDays($customerIndex + $searchIndex),
                    'updated_at' => now()->subDays($customerIndex + $searchIndex),
                ]);
            }
        }

        foreach ($videos->take(3) as $video) {
            foreach ($customers->take(2) as $customer) {
                VideoEngagement::query()->create([
                    'video_id' => $video->id,
                    'user_id' => $customer->id,
                    'type' => 'save',
                ]);
            }
        }
    }

    /**
     * @param  Collection<int, User>  $customers
     * @param  Collection<int, Restaurant>  $restaurants
     * @param  Collection<int, Order>  $orders
     */
    private function seedConversationsAndSupport(User $admin, Collection $customers, Collection $restaurants, Collection $orders): void
    {
        foreach ($orders->take(4)->values() as $index => $order) {
            $conversation = Conversation::query()->create([
                'restaurant_id' => $order->restaurant_id,
                'customer_id' => $order->customer_id,
                'order_id' => $order->id,
                'subject' => "Question about order #{$order->id}",
                'status' => $index === 3 ? 'closed' : 'open',
                'last_message_at' => now()->subHours($index + 1),
            ]);

            ConversationMessage::query()->create([
                'conversation_id' => $conversation->id,
                'sender_id' => $order->customer_id,
                'body' => 'Hi, can you confirm the estimated prep time for this order?',
                'read_at' => now()->subHours($index + 1),
            ]);

            ConversationMessage::query()->create([
                'conversation_id' => $conversation->id,
                'sender_id' => $order->restaurant->owner_user_id,
                'body' => 'Thanks for reaching out. The kitchen is preparing it now.',
                'read_at' => $index === 0 ? null : now()->subMinutes(30),
            ]);
        }

        foreach ($customers->take(3)->values() as $index => $customer) {
            SupportRequest::query()->create([
                'user_id' => $customer->id,
                'channel' => 'app',
                'subject' => $index === 0 ? 'Payment receipt question' : 'Need help with delivery address',
                'message' => 'This is realistic sample support data for dashboard testing.',
                'status' => $index === 2 ? 'resolved' : 'open',
                'response' => $index === 2 ? 'Resolved in sample data.' : null,
            ]);
        }

        foreach ($restaurants->take(2)->values() as $index => $restaurant) {
            $reporter = $customers[$index % $customers->count()];
            $order = $orders->firstWhere('restaurant_id', $restaurant->id);

            Report::query()->create([
                'reporter_user_id' => $reporter->id,
                'restaurant_id' => $restaurant->id,
                'order_id' => $order?->id,
                'subject' => $index === 0 ? 'Late delivery report' : 'Menu photo mismatch',
                'message' => 'Sample report for admin dashboard review workflows.',
                'status' => $index === 0 ? 'reviewing' : 'resolved',
                'resolution' => $index === 0 ? null : 'Restaurant updated the listed menu photo.',
                'resolved_by' => $index === 0 ? null : $admin->id,
                'resolved_at' => $index === 0 ? null : now()->subDays(1),
            ]);
        }
    }

    /**
     * @return Collection<int, MenuItem>
     */
    private function menuItemsFor(Restaurant $restaurant): Collection
    {
        return MenuItem::query()
            ->whereHas('category', fn ($query) => $query->where('restaurant_id', $restaurant->id))
            ->where('is_available', true)
            ->orderBy('id')
            ->get();
    }
}
