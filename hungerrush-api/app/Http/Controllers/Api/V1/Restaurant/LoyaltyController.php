<?php

namespace App\Http\Controllers\Api\V1\Restaurant;

use App\Http\Controllers\Controller;
use App\Models\LoyaltyOffer;
use App\Models\LoyaltyPoint;
use App\Models\LoyaltyTransaction;
use App\Models\Order;
use App\Models\Restaurant;
use App\Services\LoyaltyPointService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class LoyaltyController extends Controller
{
    public function overview(Request $request, LoyaltyPointService $loyaltyPointService)
    {
        $restaurant = $this->resolveRestaurant();
        $search = trim((string) $request->query('q', ''));
        $status = strtolower(trim((string) $request->query('status', 'all')));

        if (Schema::hasTable('loyalty_points') && Schema::hasTable('loyalty_transactions')) {
            $loyaltyPointService->syncEligibleOrdersForRestaurant((int) $restaurant->id);
        }

        $offers = $this->loadOffers($restaurant->id, $status, $search);
        $stats = $this->buildStats($restaurant->id, $search);
        $topCustomers = $this->buildTopCustomers($restaurant->id, $search);

        return $this->successResponse([
            'stats' => $stats,
            'rewards' => $offers->map(fn (LoyaltyOffer $offer) => $this->transformOffer($offer))->values(),
            'offers' => $offers->map(fn (LoyaltyOffer $offer) => $this->transformOffer($offer))->values(),
            'top_customers' => $topCustomers,
            'weekly_trend' => $this->buildWeeklyTrend($restaurant->id),
        ]);
    }

    public function storeReward(Request $request)
    {
        if (!Schema::hasTable('loyalty_offers')) {
            return $this->errorResponse(
                'Loyalty offers are not available yet.',
                ['loyalty' => ['Loyalty offers storage is not configured.']],
                'loyalty_not_ready',
                503
            );
        }

        $restaurant = $this->resolveRestaurant();
        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:160'],
            'name' => ['sometimes', 'string', 'max:160'],
            'description' => ['nullable', 'string'],
            'required_points' => ['sometimes', 'integer', 'min:0'],
            'points_required' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
            'status' => ['sometimes', 'in:active,draft,archived'],
        ]);

        $title = trim((string) ($validated['title'] ?? $validated['name'] ?? ''));
        if ($title === '') {
            return $this->errorResponse(
                'Title is required.',
                ['title' => ['Please provide a title for this loyalty offer.']],
                'validation_error',
                422
            );
        }

        $requiredPoints = $validated['required_points'] ?? $validated['points_required'] ?? null;
        if ($requiredPoints === null) {
            return $this->errorResponse(
                'Required points are required.',
                ['required_points' => ['Please provide required points.']],
                'validation_error',
                422
            );
        }

        $isActive = array_key_exists('is_active', $validated)
            ? (bool) $validated['is_active']
            : (($validated['status'] ?? 'active') === 'active');

        $offer = LoyaltyOffer::query()->create([
            'restaurant_id' => $restaurant->id,
            'title' => $title,
            'description' => isset($validated['description']) ? trim((string) $validated['description']) : null,
            'required_points' => (int) $requiredPoints,
            'is_active' => $isActive,
        ]);

        return $this->successResponse(
            $this->transformOffer($offer),
            message: 'Loyalty offer created successfully.',
            status: 201
        );
    }

    public function updateReward(Request $request, string $loyaltyReward)
    {
        if (!Schema::hasTable('loyalty_offers')) {
            return $this->errorResponse(
                'Loyalty offers are not available yet.',
                ['loyalty' => ['Loyalty offers storage is not configured.']],
                'loyalty_not_ready',
                503
            );
        }

        $restaurant = $this->resolveRestaurant();
        $offerId = trim($loyaltyReward);
        $offer = LoyaltyOffer::query()->find($offerId);
        abort_unless($offer !== null && (int) $offer->restaurant_id === (int) $restaurant->id, 404);

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:160'],
            'name' => ['sometimes', 'string', 'max:160'],
            'description' => ['sometimes', 'nullable', 'string'],
            'required_points' => ['sometimes', 'integer', 'min:0'],
            'points_required' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
            'status' => ['sometimes', 'in:active,draft,archived'],
        ]);

        $payload = [];
        if (array_key_exists('title', $validated) || array_key_exists('name', $validated)) {
            $payload['title'] = trim((string) ($validated['title'] ?? $validated['name'] ?? $offer->title));
        }
        if (array_key_exists('description', $validated)) {
            $payload['description'] = $validated['description'] !== null
                ? trim((string) $validated['description'])
                : null;
        }
        if (array_key_exists('required_points', $validated) || array_key_exists('points_required', $validated)) {
            $payload['required_points'] = (int) ($validated['required_points'] ?? $validated['points_required']);
        }
        if (array_key_exists('is_active', $validated)) {
            $payload['is_active'] = (bool) $validated['is_active'];
        } elseif (array_key_exists('status', $validated)) {
            $payload['is_active'] = $validated['status'] === 'active';
        }

        if (!empty($payload)) {
            $offer->update($payload);
        }

        return $this->successResponse(
            $this->transformOffer($offer->refresh()),
            message: 'Loyalty offer updated successfully.'
        );
    }

    public function destroyReward(string $loyaltyReward)
    {
        if (!Schema::hasTable('loyalty_offers')) {
            return $this->errorResponse(
                'Loyalty offers are not available yet.',
                ['loyalty' => ['Loyalty offers storage is not configured.']],
                'loyalty_not_ready',
                503
            );
        }

        $restaurant = $this->resolveRestaurant();
        $offerId = trim($loyaltyReward);
        $offer = LoyaltyOffer::query()->find($offerId);
        abort_unless($offer !== null && (int) $offer->restaurant_id === (int) $restaurant->id, 404);

        $offer->delete();

        return $this->successResponse(['deleted' => true], message: 'Loyalty offer deleted successfully.');
    }

    private function loadOffers(int $restaurantId, string $status, string $search)
    {
        if (!Schema::hasTable('loyalty_offers')) {
            return collect();
        }

        $query = LoyaltyOffer::query()
            ->where('restaurant_id', $restaurantId)
            ->withCount([
                'transactions as usage_count' => fn (Builder $builder) => $builder->where('type', 'redeemed'),
            ])
            ->latest();

        if ($search !== '') {
            $query->where(function (Builder $builder) use ($search) {
                $builder
                    ->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($status === 'active') {
            $query->where('is_active', true);
        } elseif (in_array($status, ['archived', 'draft', 'inactive'], true)) {
            $query->where('is_active', false);
        }

        return $query->get();
    }

    private function buildStats(int $restaurantId, string $search): array
    {
        $pointsIssued = 0;
        $pointsRedeemed = 0;
        $redeemedOffers = 0;

        if (Schema::hasTable('loyalty_transactions')) {
            $base = LoyaltyTransaction::query()->where('restaurant_id', $restaurantId);
            if ($search !== '' && Schema::hasTable('users')) {
                $base->whereHas('user', function (Builder $builder) use ($search) {
                    $builder
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            }

            $pointsIssued = (int) (clone $base)->where('type', 'earned')->sum('points');
            $pointsRedeemed = (int) (clone $base)->where('type', 'redeemed')->sum('points');
            $redeemedOffers = (int) (clone $base)->where('type', 'redeemed')->whereNotNull('offer_id')->count();
        }

        $activeOffers = 0;
        $offersCount = 0;
        if (Schema::hasTable('loyalty_offers')) {
            $offerBase = LoyaltyOffer::query()->where('restaurant_id', $restaurantId);
            if ($search !== '') {
                $offerBase->where(function (Builder $builder) use ($search) {
                    $builder
                        ->where('title', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            }
            $offersCount = (int) (clone $offerBase)->count();
            $activeOffers = (int) (clone $offerBase)->where('is_active', true)->count();
        }

        $activeMembers = 0;
        if (Schema::hasTable('loyalty_points')) {
            $membersBase = LoyaltyPoint::query()
                ->where('restaurant_id', $restaurantId)
                ->where(function (Builder $builder) {
                    $builder
                        ->where('points_balance', '>', 0)
                        ->orWhere('total_earned', '>', 0);
                });

            if ($search !== '' && Schema::hasTable('users')) {
                $membersBase->whereHas('user', function (Builder $builder) use ($search) {
                    $builder
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            }

            $activeMembers = (int) (clone $membersBase)->distinct('user_id')->count('user_id');
        }

        return [
            'total_points_issued' => $pointsIssued,
            'points_redeemed' => $pointsRedeemed,
            'redeemed_offers' => $redeemedOffers,
            'active_members' => $activeMembers,
            'active_offers' => $activeOffers,
            'offers_count' => $offersCount,
        ];
    }

    private function buildTopCustomers(int $restaurantId, string $search): array
    {
        if (!Schema::hasTable('loyalty_points')) {
            return [];
        }

        $query = LoyaltyPoint::query()
            ->where('restaurant_id', $restaurantId)
            ->with('user:id,name,email')
            ->orderByDesc('points_balance')
            ->limit(20);

        if ($search !== '' && Schema::hasTable('users')) {
            $query->whereHas('user', function (Builder $builder) use ($search) {
                $builder
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $pointsRows = $query->get();
        $customerIds = $pointsRows
            ->pluck('user_id')
            ->map(fn ($id) => (int) $id)
            ->filter(fn ($id) => $id > 0)
            ->values()
            ->all();

        $ordersCountByCustomer = collect();
        if (Schema::hasTable('orders') && $customerIds !== []) {
            $ordersCountByCustomer = Order::query()
                ->where('restaurant_id', $restaurantId)
                ->whereIn('customer_id', $customerIds)
                ->selectRaw('customer_id, COUNT(*) as orders_count')
                ->groupBy('customer_id')
                ->pluck('orders_count', 'customer_id');
        }

        return $pointsRows->map(function (LoyaltyPoint $points) use ($ordersCountByCustomer) {
            $ordersCount = (int) ($ordersCountByCustomer->get((int) $points->user_id, 0));
            return [
                'id' => $points->id,
                'customer_id' => $points->user_id,
                'restaurant_id' => $points->restaurant_id,
                'points' => (int) $points->points_balance,
                'orders_count' => $ordersCount,
                'tier' => $this->tierForPoints((int) $points->total_earned),
                'last_activity_at' => optional($points->updated_at)->toISOString(),
                'customer' => $points->user ? [
                    'id' => $points->user->id,
                    'name' => $points->user->name,
                    'email' => $points->user->email,
                ] : null,
                'points_balance' => (int) $points->points_balance,
                'total_earned' => (int) $points->total_earned,
                'total_redeemed' => (int) $points->total_redeemed,
            ];
        })->values()->all();
    }

    private function buildWeeklyTrend(int $restaurantId): array
    {
        if (!Schema::hasTable('loyalty_transactions')) {
            return $this->emptyWeeklyTrend();
        }

        $start = now()->subDays(6)->startOfDay();
        $rows = LoyaltyTransaction::query()
            ->where('restaurant_id', $restaurantId)
            ->where('type', 'redeemed')
            ->where('created_at', '>=', $start)
            ->selectRaw('DATE(created_at) as day, SUM(points) as points, COUNT(*) as redemptions')
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

    private function emptyWeeklyTrend(): array
    {
        $trend = [];
        for ($offset = 6; $offset >= 0; $offset--) {
            $trend[] = [
                'day' => now()->subDays($offset)->toDateString(),
                'label' => now()->subDays($offset)->format('D'),
                'points' => 0,
                'redemptions' => 0,
            ];
        }

        return $trend;
    }

    private function transformOffer(LoyaltyOffer $offer): array
    {
        $status = (bool) $offer->is_active ? 'active' : 'archived';
        $usageCount = (int) ($offer->usage_count ?? 0);

        return [
            'id' => $offer->id,
            'restaurant_id' => $offer->restaurant_id,
            'title' => $offer->title,
            'description' => $offer->description,
            'required_points' => (int) $offer->required_points,
            'is_active' => (bool) $offer->is_active,
            'created_at' => optional($offer->created_at)->toISOString(),
            'updated_at' => optional($offer->updated_at)->toISOString(),

            // Legacy dashboard compatibility fields.
            'name' => $offer->title,
            'points_required' => (int) $offer->required_points,
            'reward_type' => 'discount',
            'status' => $status,
            'usage_count' => $usageCount,
            'menu_item_id' => null,
            'menu_item' => null,
            'discount_percentage' => null,
            'discounted_price' => null,
        ];
    }

    private function tierForPoints(int $totalEarned): string
    {
        if ($totalEarned >= 3000) {
            return 'gold';
        }
        if ($totalEarned >= 1000) {
            return 'silver';
        }

        return 'bronze';
    }

    private function resolveRestaurant(): Restaurant
    {
        return Restaurant::firstOrCreate(
            ['owner_user_id' => auth()->id()],
            ['name' => 'My Restaurant', 'status' => 'active']
        );
    }
}
