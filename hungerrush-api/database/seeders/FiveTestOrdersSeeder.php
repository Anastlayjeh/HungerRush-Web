<?php

namespace Database\Seeders;

use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Database\Seeder;

class FiveTestOrdersSeeder extends Seeder
{
    public function run(): void
    {
        $restaurant = Restaurant::query()->first();

        if (!$restaurant) {
            $this->command?->error('No restaurant found. Run DemoDataSeeder first.');
            return;
        }

        $customer = User::query()->where('role', 'customer')->first();

        if (!$customer) {
            $customer = User::factory()->create([
                'name' => 'Test Customer',
                'email' => 'testcustomer@hungerrush.local',
                'role' => 'customer',
            ]);
        }

        $menuItems = MenuItem::query()
            ->whereHas('category', fn ($query) => $query->where('restaurant_id', $restaurant->id))
            ->get();

        if ($menuItems->isEmpty()) {
            $this->command?->error('No menu items found for the restaurant.');
            return;
        }

        $statuses = [
            'pending',
            'accepted',
            'preparing',
            'ready_for_pickup',
            'on_the_way',
        ];

        $createdIds = [];

        foreach ($statuses as $status) {
            $selectedItems = $menuItems->shuffle()->take(min(2, $menuItems->count()));

            $order = Order::query()->create([
                'customer_id' => $customer->id,
                'restaurant_id' => $restaurant->id,
                'branch_id' => null,
                'subtotal' => 0,
                'fees' => 0,
                'total' => 0,
                'status' => $status,
                'payment_status' => 'unpaid',
            ]);

            $subtotal = 0;

            foreach ($selectedItems as $item) {
                $quantity = random_int(1, 3);
                $unitPrice = (float) $item->price;

                OrderItem::query()->create([
                    'order_id' => $order->id,
                    'menu_item_id' => $item->id,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'notes' => null,
                ]);

                $subtotal += ($unitPrice * $quantity);
            }

            $fees = round($subtotal * 0.10, 2);
            $total = round($subtotal + $fees, 2);

            $order->update([
                'subtotal' => $subtotal,
                'fees' => $fees,
                'total' => $total,
            ]);

            $createdIds[] = $order->id;
        }

        $this->command?->info('Created test orders: ' . implode(', ', $createdIds));
    }
}
