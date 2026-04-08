<?php

namespace App\Http\Controllers\Api\V1\Restaurant;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Restaurant\StoreQuickOrderRequest;
use App\Http\Requests\Restaurant\UpdateOrderStatusRequest;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderStatusHistory;
use App\Models\Restaurant;
use App\Models\RestaurantBranch;
use App\Models\User;
use App\Services\OrderStatusTransitionService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    public function index()
    {
        $restaurant = $this->resolveRestaurant();
        $orders = Order::query()
            ->where('restaurant_id', $restaurant->id)
            ->with([
                'customer:id,name,email,phone',
                'branch:id,name,address',
            ])
            ->latest('id')
            ->paginate(15);

        return $this->successResponse($orders->items(), [
            'current_page' => $orders->currentPage(),
            'per_page' => $orders->perPage(),
            'total' => $orders->total(),
        ]);
    }

    public function show(Order $order)
    {
        $this->authorize('view', $order);
        $order->load([
            'customer:id,name,email,phone',
            'branch:id,name,address',
            'items.menuItem:id,name,description,price,image_urls',
            'statusHistory',
        ]);

        return $this->successResponse($order);
    }

    public function updateStatus(UpdateOrderStatusRequest $request, Order $order, OrderStatusTransitionService $transitionService)
    {
        $this->authorize('update', $order);
        $targetStatus = OrderStatus::from($request->validated()['status']);

        if (!$transitionService->canTransition($order->status, $targetStatus)) {
            return $this->errorResponse(
                'Invalid status transition.',
                ['status' => ['Transition is not allowed from current status.']],
                'invalid_order_transition'
            );
        }

        $order->update(['status' => $targetStatus->value]);
        OrderStatusHistory::create([
            'order_id' => $order->id,
            'status' => $targetStatus->value,
            'changed_by' => auth()->id(),
            'changed_at' => now(),
        ]);

        return $this->successResponse($order->refresh(), message: 'Order status updated.');
    }

    public function storeQuickOrder(StoreQuickOrderRequest $request)
    {
        $restaurant = $this->resolveRestaurant();
        $validated = $request->validated();
        $branchId = $validated['branch_id'] ?? null;

        if (
            $branchId !== null
            && !RestaurantBranch::query()
                ->where('id', $branchId)
                ->where('restaurant_id', $restaurant->id)
                ->exists()
        ) {
            return $this->errorResponse(
                'Selected branch does not belong to your restaurant.',
                ['branch_id' => ['Invalid branch.']],
                'invalid_branch'
            );
        }

        $requestedItems = collect($validated['items'] ?? []);
        $menuItemIds = $requestedItems
            ->pluck('menu_item_id')
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values();

        $menuItems = MenuItem::query()
            ->whereIn('id', $menuItemIds)
            ->whereHas('category', fn ($query) => $query->where('restaurant_id', $restaurant->id))
            ->get()
            ->keyBy('id');

        if ($menuItems->count() !== $menuItemIds->count()) {
            return $this->errorResponse(
                'Some menu items are not available for your restaurant.',
                ['items' => ['One or more items are invalid.']],
                'invalid_items'
            );
        }

        $quickCustomer = $this->resolveQuickOrderCustomer($restaurant->owner_user_id);

        $order = DB::transaction(function () use (
            $requestedItems,
            $menuItems,
            $restaurant,
            $branchId,
            $quickCustomer
        ) {
            $subtotal = 0.0;
            foreach ($requestedItems as $itemRow) {
                /** @var MenuItem $menuItem */
                $menuItem = $menuItems->get((int) $itemRow['menu_item_id']);
                $subtotal += ((float) $menuItem->price) * (int) $itemRow['quantity'];
            }
            $fees = round($subtotal * 0.10, 2);
            $total = round($subtotal + $fees, 2);

            $order = Order::create([
                'customer_id' => $quickCustomer->id,
                'restaurant_id' => $restaurant->id,
                'branch_id' => $branchId,
                'subtotal' => $subtotal,
                'fees' => $fees,
                'total' => $total,
                'status' => OrderStatus::Pending->value,
                'payment_status' => PaymentStatus::Unpaid->value,
                'is_quick_order' => true,
            ]);

            foreach ($requestedItems as $itemRow) {
                /** @var MenuItem $menuItem */
                $menuItem = $menuItems->get((int) $itemRow['menu_item_id']);

                OrderItem::create([
                    'order_id' => $order->id,
                    'menu_item_id' => $menuItem->id,
                    'quantity' => (int) $itemRow['quantity'],
                    'unit_price' => (float) $menuItem->price,
                    'notes' => $itemRow['notes'] ?? null,
                ]);
            }

            OrderStatusHistory::create([
                'order_id' => $order->id,
                'status' => OrderStatus::Pending->value,
                'changed_by' => auth()->id(),
                'changed_at' => now(),
            ]);

            return $order;
        });

        return $this->successResponse(
            $order->load(['items.menuItem']),
            message: 'Quick order created successfully.',
            status: 201
        );
    }

    private function resolveQuickOrderCustomer(int $ownerUserId): User
    {
        return User::query()->firstOrCreate(
            ['email' => "quick-order-owner-{$ownerUserId}@hungerrush.local"],
            [
                'name' => 'Quick Order Customer',
                'role' => 'customer',
                'status' => 'active',
                'email_verified_at' => now(),
                'password' => Hash::make(Str::random(40)),
            ]
        );
    }

    private function resolveRestaurant(): Restaurant
    {
        return Restaurant::firstOrCreate(
            ['owner_user_id' => auth()->id()],
            ['name' => 'My Restaurant', 'status' => 'active']
        );
    }
}
