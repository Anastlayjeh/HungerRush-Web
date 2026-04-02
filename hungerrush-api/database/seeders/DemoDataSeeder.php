<?php

namespace Database\Seeders;

use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Database\Seeder;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $owner = User::factory()->create([
            'name' => 'Demo Restaurant Owner',
            'email' => 'owner@hungerrush.local',
            'role' => 'restaurant_owner',
        ]);

        $customer = User::factory()->create([
            'name' => 'Demo Customer',
            'email' => 'customer@hungerrush.local',
            'role' => 'customer',
        ]);

        $restaurant = Restaurant::factory()->create([
            'owner_user_id' => $owner->id,
            'name' => 'HungerRush Demo Kitchen',
            'description' => 'Demo restaurant for frontend integration.',
            'status' => 'active',
        ]);

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

        $classicBurger = MenuItem::factory()->create([
            'category_id' => $burgers->id,
            'name' => 'Classic Burger',
            'price' => 12.50,
        ]);

        $cola = MenuItem::factory()->create([
            'category_id' => $drinks->id,
            'name' => 'Cola',
            'price' => 3.50,
        ]);

        $order = Order::factory()->create([
            'customer_id' => $customer->id,
            'restaurant_id' => $restaurant->id,
            'subtotal' => 16.00,
            'fees' => 1.60,
            'total' => 17.60,
            'status' => 'pending',
            'payment_status' => 'unpaid',
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'menu_item_id' => $classicBurger->id,
            'quantity' => 1,
            'unit_price' => 12.50,
            'notes' => null,
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'menu_item_id' => $cola->id,
            'quantity' => 1,
            'unit_price' => 3.50,
            'notes' => null,
        ]);
    }
}
