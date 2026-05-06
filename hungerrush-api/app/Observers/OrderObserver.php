<?php

namespace App\Observers;

use App\Models\Order;
use App\Services\LoyaltyPointService;

class OrderObserver
{
    public function created(Order $order): void
    {
        app(LoyaltyPointService::class)->awardForOrderIfEligible($order);
    }

    public function updated(Order $order): void
    {
        if (!$order->wasChanged(['status', 'payment_status'])) {
            return;
        }

        app(LoyaltyPointService::class)->awardForOrderIfEligible($order);
    }
}
