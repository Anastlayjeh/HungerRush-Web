<?php

namespace App\Services;

use App\Models\LoyaltyPoint;
use App\Models\LoyaltyTransaction;
use App\Models\Order;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Throwable;

class LoyaltyPointService
{
    private const LBP_PER_USD = 90000;
    private const POINTS_PER_USD = 20;

    public function awardForOrderIfEligible(Order $order): ?LoyaltyTransaction
    {
        if (!$this->loyaltyTablesReady()) {
            return null;
        }

        if (!$this->isEligibleForEarning($order)) {
            return null;
        }

        $points = $this->calculateEarnedPoints($order);
        if ($points <= 0) {
            return null;
        }

        try {
            return DB::transaction(function () use ($order, $points) {
                $existing = LoyaltyTransaction::query()
                    ->where('order_id', $order->id)
                    ->where('type', 'earned')
                    ->lockForUpdate()
                    ->first();

                if ($existing) {
                    return $existing;
                }

                $ledger = LoyaltyPoint::query()->firstOrCreate(
                    [
                        'user_id' => $order->customer_id,
                        'restaurant_id' => $order->restaurant_id,
                    ],
                    [
                        'points_balance' => 0,
                        'total_earned' => 0,
                        'total_redeemed' => 0,
                    ]
                );

                $ledger->update([
                    'points_balance' => max(((int) $ledger->points_balance) + $points, 0),
                    'total_earned' => max(((int) $ledger->total_earned) + $points, 0),
                ]);

                return LoyaltyTransaction::query()->create([
                    'user_id' => $order->customer_id,
                    'restaurant_id' => $order->restaurant_id,
                    'order_id' => $order->id,
                    'offer_id' => null,
                    'points' => $points,
                    'type' => 'earned',
                    'description' => "Points earned from order #{$order->id}.",
                ]);
            });
        } catch (Throwable $error) {
            Log::warning('Skipping loyalty point award due to backend error.', [
                'order_id' => $order->id,
                'customer_id' => $order->customer_id,
                'restaurant_id' => $order->restaurant_id,
                'error' => $error->getMessage(),
            ]);

            return null;
        }
    }

    public function calculateEarnedPoints(Order $order): int
    {
        $totalLbp = (int) floor(((float) $order->total) * self::LBP_PER_USD);
        if ($totalLbp <= 0) {
            return 0;
        }

        return intdiv($totalLbp, self::LBP_PER_USD) * self::POINTS_PER_USD;
    }

    private function isEligibleForEarning(Order $order): bool
    {
        $status = strtolower((string) ($order->status?->value ?? $order->status));
        $paymentStatus = strtolower((string) ($order->payment_status?->value ?? $order->payment_status));

        if ($paymentStatus === 'paid') {
            return true;
        }

        return in_array($status, ['delivered', 'completed'], true);
    }

    private function loyaltyTablesReady(): bool
    {
        return Schema::hasTable('loyalty_points')
            && Schema::hasTable('loyalty_transactions');
    }
}
