<?php

namespace App\Observers;

use App\Models\Order;
use App\Services\LoyaltyPointService;
use Illuminate\Support\Facades\Log;
use Throwable;

class OrderObserver
{
    public function created(Order $order): void
    {
        try {
            app(LoyaltyPointService::class)->awardForOrderIfEligible($order);
        } catch (Throwable $error) {
            Log::warning('Order loyalty observer failed on create event.', [
                'order_id' => $order->id,
                'error' => $error->getMessage(),
            ]);
        }
    }

    public function updated(Order $order): void
    {
        if (!$order->wasChanged(['status', 'payment_status'])) {
            return;
        }

        try {
            app(LoyaltyPointService::class)->awardForOrderIfEligible($order);
        } catch (Throwable $error) {
            Log::warning('Order loyalty observer failed on update event.', [
                'order_id' => $order->id,
                'error' => $error->getMessage(),
            ]);
        }
    }
}
