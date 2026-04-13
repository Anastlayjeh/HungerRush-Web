<?php

namespace App\Http\Controllers\Api\V1\Restaurant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Restaurant\StoreLoyaltyRewardRequest;
use App\Http\Requests\Restaurant\UpdateLoyaltyRewardRequest;
use App\Models\LoyaltyMember;
use App\Models\LoyaltyRedemption;
use App\Models\LoyaltyReward;
use App\Models\Restaurant;
use Illuminate\Http\Request;

class LoyaltyController extends Controller
{
    public function overview(Request $request)
    {
        $restaurant = $this->resolveRestaurant();
        $search = trim((string) $request->query('q', ''));
        $status = trim((string) $request->query('status', 'all'));
        $allowedRewardStatuses = ['active', 'draft', 'archived'];

        $membersQuery = LoyaltyMember::query()
            ->where('restaurant_id', $restaurant->id)
            ->with('customer:id,name,email')
            ->orderByDesc('points');

        if ($search !== '') {
            $membersQuery->whereHas(
                'customer',
                fn ($builder) => $builder->where('name', 'like', "%{$search}%")
            );
        }

        $members = $membersQuery->get();
        $rewardsQuery = LoyaltyReward::query()->where('restaurant_id', $restaurant->id);
        if (in_array($status, $allowedRewardStatuses, true)) {
            $rewardsQuery->where('status', $status);
        }

        $rewards = $rewardsQuery
            ->latest()
            ->get();

        $redemptionsBase = LoyaltyRedemption::query()->where('restaurant_id', $restaurant->id);
        $pointsRedeemed = (int) (clone $redemptionsBase)->sum('points_spent');
        $pointsIssued = (int) $members->sum('points') + $pointsRedeemed;

        return $this->successResponse([
            'stats' => [
                'total_points_issued' => $pointsIssued,
                'points_redeemed' => $pointsRedeemed,
                'active_members' => (int) $members->where('orders_count', '>', 0)->count(),
            ],
            'rewards' => $rewards->map(fn (LoyaltyReward $reward) => $this->transformReward($reward))->values(),
            'top_customers' => $members->map(fn (LoyaltyMember $member) => $this->transformMember($member))->values(),
            'weekly_trend' => $this->buildWeeklyTrend($restaurant),
        ]);
    }

    public function storeReward(StoreLoyaltyRewardRequest $request)
    {
        $restaurant = $this->resolveRestaurant();
        $reward = $restaurant->loyaltyRewards()->create($request->validated());

        return $this->successResponse(
            $this->transformReward($reward),
            message: 'Loyalty reward created successfully.',
            status: 201
        );
    }

    public function updateReward(UpdateLoyaltyRewardRequest $request, LoyaltyReward $loyaltyReward)
    {
        $restaurant = $this->resolveRestaurant();
        abort_unless($loyaltyReward->restaurant_id === $restaurant->id, 404);

        $loyaltyReward->update($request->validated());

        return $this->successResponse(
            $this->transformReward($loyaltyReward->refresh()),
            message: 'Loyalty reward updated successfully.'
        );
    }

    private function buildWeeklyTrend(Restaurant $restaurant): array
    {
        $start = now()->subDays(6)->startOfDay();
        $rows = LoyaltyRedemption::query()
            ->where('restaurant_id', $restaurant->id)
            ->where('created_at', '>=', $start)
            ->selectRaw('DATE(created_at) as day, SUM(points_spent) as points, COUNT(*) as redemptions')
            ->groupBy('day')
            ->get()
            ->keyBy('day');

        $trend = [];
        for ($offset = 6; $offset >= 0; $offset--) {
            $day = now()->subDays($offset)->toDateString();
            $row = $rows->get($day);

            $trend[] = [
                'day' => $day,
                'label' => now()->subDays($offset)->format('D'),
                'points' => (int) ($row->points ?? 0),
                'redemptions' => (int) ($row->redemptions ?? 0),
            ];
        }

        return $trend;
    }

    private function transformReward(LoyaltyReward $reward): array
    {
        return [
            'id' => $reward->id,
            'restaurant_id' => $reward->restaurant_id,
            'name' => $reward->name,
            'description' => $reward->description,
            'points_required' => (int) $reward->points_required,
            'reward_type' => $reward->reward_type,
            'status' => $reward->status,
            'usage_count' => (int) $reward->usage_count,
            'created_at' => optional($reward->created_at)->toISOString(),
            'updated_at' => optional($reward->updated_at)->toISOString(),
        ];
    }

    private function transformMember(LoyaltyMember $member): array
    {
        return [
            'id' => $member->id,
            'customer_id' => $member->customer_id,
            'restaurant_id' => $member->restaurant_id,
            'points' => (int) $member->points,
            'orders_count' => (int) $member->orders_count,
            'tier' => $member->tier,
            'last_activity_at' => optional($member->last_activity_at)->toISOString(),
            'customer' => $member->customer ? [
                'id' => $member->customer->id,
                'name' => $member->customer->name,
                'email' => $member->customer->email,
            ] : null,
        ];
    }

    private function resolveRestaurant(): Restaurant
    {
        return Restaurant::firstOrCreate(
            ['owner_user_id' => auth()->id()],
            ['name' => 'My Restaurant', 'status' => 'active']
        );
    }
}
