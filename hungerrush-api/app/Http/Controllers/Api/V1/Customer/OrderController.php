<?php

namespace App\Http\Controllers\Api\V1\Customer;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\PlaceOrderRequest;
use App\Http\Resources\OrderResource;
use App\Models\Cart;
use App\Models\LoyaltyOffer;
use App\Models\LoyaltyPoint;
use App\Models\LoyaltyTransaction;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderStatusHistory;
use App\Models\RestaurantBranch;
use App\Models\UserNotification;
use App\Services\OrderNotificationService;
use App\Services\OrderStatusTransitionService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    public function place(PlaceOrderRequest $request, OrderNotificationService $orderNotificationService)
    {
        $validated = $request->validated();
        $cart = $this->resolveCartForPlacement($validated);
        $cart->load('items.menuItem');
        abort_if($cart->items->isEmpty(), 422, 'Cart is empty.');
        abort_if($cart->restaurant_id === null, 422, 'Cart restaurant is missing.');
        abort_if(
            $cart->items->contains(fn ($item) => !$item->menuItem?->is_available),
            422,
            'Cart contains unavailable menu items.'
        );

        $branchId = $validated['branch_id'] ?? null;
        if (
            $branchId !== null
            && !RestaurantBranch::query()
                ->whereKey($branchId)
                ->where('restaurant_id', $cart->restaurant_id)
                ->exists()
        ) {
            return $this->errorResponse(
                'Selected branch does not belong to this restaurant.',
                ['branch_id' => ['Invalid branch.']],
                'invalid_branch',
                422
            );
        }

        $order = DB::transaction(function () use ($cart, $validated, $branchId) {
            $subtotal = 0;
            foreach ($cart->items as $item) {
                $subtotal += (float) $item->menuItem->price * $item->quantity;
            }
            $fees = round($subtotal * 0.10, 2);
            $appliedOffer = $this->resolveAppliedLoyaltyOffer($cart, $validated);
            $discount = $this->calculateLoyaltyDiscount($appliedOffer, $cart->items, $subtotal, $fees);
            $pointsUsed = (int) ($appliedOffer->required_points ?? 0);
            $this->assertSufficientPoints(
                customerId: (int) auth()->id(),
                restaurantId: (int) $cart->restaurant_id,
                requiredPoints: $pointsUsed,
            );
            $total = round(max(($subtotal + $fees) - $discount, 0), 2);
            $deliveryAddress = $validated['delivery_address'];

            $order = Order::create([
                'customer_id' => auth()->id(),
                'restaurant_id' => $cart->restaurant_id,
                'branch_id' => $branchId,
                'loyalty_offer_id' => $appliedOffer?->id,
                'subtotal' => $subtotal,
                'fees' => $fees,
                'loyalty_points_used' => $pointsUsed,
                'loyalty_discount' => $discount,
                'total' => $total,
                'status' => OrderStatus::Pending->value,
                'payment_status' => PaymentStatus::Unpaid->value,
                'delivery_address' => $deliveryAddress,
                'delivery_address_label' => $validated['delivery_address_label']
                    ?? $this->formatDeliveryAddressLabel($deliveryAddress),
                'delivery_phone' => $validated['delivery_phone'],
                'order_notes' => $validated['order_notes'] ?? null,
                'payment_method' => $validated['payment_method'],
                'delivery_mode' => $validated['delivery_mode'] ?? 'now',
                'scheduled_label' => $validated['scheduled_label'] ?? null,
                'change_request' => $validated['change_request'] ?? null,
                'use_loyalty' => (bool) ($validated['use_loyalty'] ?? false),
                'save_change_in_wallet' => (bool) ($validated['save_change_in_wallet'] ?? false),
            ]);

            foreach ($cart->items as $item) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'menu_item_id' => $item->menu_item_id,
                    'quantity' => $item->quantity,
                    'unit_price' => $item->menuItem->price,
                    'notes' => $item->notes,
                ]);
            }

            if ($appliedOffer !== null) {
                $this->deductPointsAndRecordRedemption(
                    customerId: (int) auth()->id(),
                    restaurantId: (int) $cart->restaurant_id,
                    orderId: (int) $order->id,
                    offer: $appliedOffer,
                    pointsUsed: $pointsUsed,
                );
            }

            OrderStatusHistory::create([
                'order_id' => $order->id,
                'status' => OrderStatus::Pending->value,
                'changed_by' => auth()->id(),
                'changed_at' => now(),
            ]);

            $cart->items()->delete();
            if ($cart->loyalty_offer_id !== null) {
                $cart->loyalty_offer_id = null;
                $cart->save();
            }
            $cart->delete();

            return $order;
        });

        UserNotification::create([
            'user_id' => auth()->id(),
            'type' => 'order',
            'title' => 'Order placed',
            'body' => "Order #{$order->id} was placed successfully.",
            'data' => ['order_id' => $order->id],
        ]);

        $orderNotificationService->notifyNewOrder($order);

        return $this->successResponse(
            new OrderResource($order->load(['customer:id,name,email,phone', 'restaurant.branches', 'branch', 'items.menuItem.category', 'statusHistory', 'loyaltyTransactions', 'loyaltyOffer.menuItem'])),
            message: 'Order placed successfully.',
            status: 201
        );
    }

    public function show(Order $order)
    {
        abort_unless($order->customer_id === auth()->id(), 404);
        return $this->successResponse(new OrderResource($order->load(['restaurant.branches', 'branch', 'items.menuItem.category', 'statusHistory', 'loyaltyTransactions', 'loyaltyOffer.menuItem'])));
    }

    public function history()
    {
        $orders = Order::query()
            ->where('customer_id', auth()->id())
            ->with(['restaurant.branches', 'branch', 'items.menuItem.category', 'statusHistory', 'loyaltyTransactions', 'loyaltyOffer.menuItem'])
            ->latest()
            ->paginate(20);

        return $this->successResponse(OrderResource::collection($orders->items()), [
            'current_page' => $orders->currentPage(),
            'per_page' => $orders->perPage(),
            'total' => $orders->total(),
        ]);
    }

    public function cancel(
        Order $order,
        OrderStatusTransitionService $transitionService,
        OrderNotificationService $orderNotificationService
    ) {
        abort_unless($order->customer_id === auth()->id(), 404);

        if (!in_array($order->status, [OrderStatus::Pending, OrderStatus::Accepted], true)) {
            return $this->errorResponse(
                'Cancel order is not available for the current order status.',
                ['status' => ['Only pending or accepted orders can be canceled.']],
                'cancel_not_available',
                422
            );
        }

        $targetStatus = OrderStatus::Cancelled;
        if (!$transitionService->canTransition($order->status, $targetStatus)) {
            return $this->errorResponse(
                'Invalid status transition.',
                ['status' => ['Transition is not allowed from current status.']],
                'invalid_order_transition',
                422
            );
        }

        $order->update(['status' => $targetStatus->value]);
        OrderStatusHistory::create([
            'order_id' => $order->id,
            'status' => $targetStatus->value,
            'changed_by' => auth()->id(),
            'changed_at' => now(),
        ]);

        $orderNotificationService->notifyCustomerStatusChange($order, $targetStatus);

        return $this->successResponse(
            new OrderResource($order->refresh()->load(['restaurant.branches', 'branch', 'items.menuItem.category', 'statusHistory', 'loyaltyTransactions', 'loyaltyOffer.menuItem'])),
            message: 'Order canceled successfully.'
        );
    }

    private function resolveAppliedLoyaltyOffer(Cart $cart, array $validated): ?LoyaltyOffer
    {
        $offerId = $cart->loyalty_offer_id;
        if ($offerId === null && isset($validated['loyalty_offer_id'])) {
            $cleaned = trim((string) $validated['loyalty_offer_id']);
            $offerId = $cleaned !== '' ? $cleaned : null;
        }
        if ($offerId === null) {
            return null;
        }

        $offer = LoyaltyOffer::query()
            ->with('menuItem:id,name,price,is_available')
            ->lockForUpdate()
            ->find($offerId);
        if ($offer === null) {
            throw ValidationException::withMessages([
                'loyalty_offer_id' => ['The selected loyalty offer does not exist anymore.'],
            ]);
        }
        if (!(bool) $offer->is_active) {
            throw ValidationException::withMessages([
                'loyalty_offer_id' => ['This loyalty offer is currently inactive.'],
            ]);
        }
        if ($offer->expires_at !== null && $offer->expires_at->isPast()) {
            throw ValidationException::withMessages([
                'loyalty_offer_id' => ['This loyalty offer has expired.'],
            ]);
        }
        if ((int) $offer->restaurant_id !== (int) $cart->restaurant_id) {
            throw ValidationException::withMessages([
                'loyalty_offer_id' => ['This loyalty offer belongs to a different restaurant.'],
            ]);
        }
        if ($offer->menu_item_id !== null) {
            $inCart = $cart->items->contains(
                fn ($item) => (int) $item->menu_item_id === (int) $offer->menu_item_id
            );
            if (!$inCart) {
                throw ValidationException::withMessages([
                    'loyalty_offer_id' => ['Add the linked menu item to your cart to redeem this offer.'],
                ]);
            }
        }

        return $offer;
    }

    private function calculateLoyaltyDiscount(
        ?LoyaltyOffer $offer,
        \Illuminate\Support\Collection $items,
        float $subtotal,
        float $fees
    ): float {
        if ($offer === null || $items->isEmpty()) {
            return 0.0;
        }

        $rewardType = (string) ($offer->reward_type ?? 'custom');
        $menuItemId = $offer->menu_item_id;
        $matchingItem = null;
        if ($menuItemId !== null) {
            $matchingItem = $items->first(fn ($item) => (int) $item->menu_item_id === (int) $menuItemId);
        }

        $discount = 0.0;
        if ($rewardType === 'free_delivery') {
            $discount = $fees;
        } elseif ($rewardType === 'free_item' && $matchingItem) {
            $unitPrice = (float) ($matchingItem->menuItem?->price ?? 0);
            $quantity = max((int) ($offer->free_item_quantity ?? 1), 1);
            $discount = $unitPrice * min($quantity, (int) $matchingItem->quantity);
        } elseif ($offer->discount_percentage !== null) {
            $percentage = max(min((float) $offer->discount_percentage, 100.0), 0.0);
            if ($matchingItem) {
                $discount = ((float) ($matchingItem->menuItem?->price ?? 0)) * ($percentage / 100);
            } else {
                $discount = $subtotal * ($percentage / 100);
            }
        } elseif ($offer->discount_amount !== null) {
            $discount = max((float) $offer->discount_amount, 0.0);
            if ($matchingItem) {
                $discount = min($discount, (float) ($matchingItem->menuItem?->price ?? 0));
            }
        }

        return round(min(max($discount, 0.0), $subtotal + $fees), 2);
    }

    private function assertSufficientPoints(int $customerId, int $restaurantId, int $requiredPoints): void
    {
        if ($requiredPoints <= 0) {
            return;
        }

        $ledger = LoyaltyPoint::query()
            ->where('user_id', $customerId)
            ->where('restaurant_id', $restaurantId)
            ->lockForUpdate()
            ->first();

        if ($ledger === null || (int) $ledger->points_balance < $requiredPoints) {
            throw ValidationException::withMessages([
                'points' => ['You do not have enough loyalty points for this restaurant.'],
            ]);
        }
    }

    private function deductPointsAndRecordRedemption(
        int $customerId,
        int $restaurantId,
        int $orderId,
        LoyaltyOffer $offer,
        int $pointsUsed
    ): void {
        $ledger = LoyaltyPoint::query()
            ->where('user_id', $customerId)
            ->where('restaurant_id', $restaurantId)
            ->lockForUpdate()
            ->first();

        if ($pointsUsed > 0) {
            if ($ledger === null || (int) $ledger->points_balance < $pointsUsed) {
                throw ValidationException::withMessages([
                    'points' => ['You do not have enough loyalty points for this restaurant.'],
                ]);
            }

            $ledger->update([
                'points_balance' => max(((int) $ledger->points_balance) - $pointsUsed, 0),
                'total_redeemed' => max(((int) $ledger->total_redeemed) + $pointsUsed, 0),
            ]);
        }

        LoyaltyTransaction::query()->create([
            'user_id' => $customerId,
            'restaurant_id' => $restaurantId,
            'order_id' => $orderId,
            'offer_id' => $offer->id,
            'points' => max($pointsUsed, 0),
            'type' => 'redeemed',
            'description' => "Redeemed loyalty offer: {$offer->title}",
        ]);
    }

    private function resolveCartForPlacement(array $validated): Cart
    {
        $customerId = (int) auth()->id();
        $cartId = isset($validated['cart_id']) ? trim((string) $validated['cart_id']) : '';
        if ($cartId !== '') {
            return Cart::query()
                ->where('customer_id', $customerId)
                ->whereKey($cartId)
                ->firstOrFail();
        }

        $restaurantId = isset($validated['restaurant_id']) ? trim((string) $validated['restaurant_id']) : '';
        if ($restaurantId !== '') {
            return Cart::query()
                ->where('customer_id', $customerId)
                ->where('restaurant_id', $restaurantId)
                ->firstOrFail();
        }

        return Cart::query()
            ->where('customer_id', $customerId)
            ->whereHas('items')
            ->latest('updated_at')
            ->firstOrFail();
    }

    private function formatDeliveryAddressLabel(array $address): string
    {
        return collect([
            $address['city'] ?? null,
            $address['street'] ?? null,
            isset($address['building']) ? 'Building '.$address['building'] : null,
            isset($address['floor']) ? 'Floor '.$address['floor'] : null,
            isset($address['apartment']) ? 'Apt '.$address['apartment'] : null,
            $address['landmark'] ?? null,
        ])
            ->map(fn ($value) => is_string($value) ? trim($value) : null)
            ->filter()
            ->implode(', ');
    }
}
