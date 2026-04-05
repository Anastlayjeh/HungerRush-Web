<?php

namespace App\Http\Controllers\Api\V1\Restaurant;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Restaurant;
use App\Models\Video;
use App\Models\VideoEngagement;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    public function overview(Request $request)
    {
        $restaurant = $this->resolveRestaurant();
        $period = $this->resolvePeriod($request);
        [$start, $end, $prevStart, $prevEnd] = $this->resolvePeriodWindow($period);

        $currentOrders = Order::query()
            ->where('restaurant_id', $restaurant->id)
            ->whereBetween('created_at', [$start, $end]);
        $previousOrders = Order::query()
            ->where('restaurant_id', $restaurant->id)
            ->whereBetween('created_at', [$prevStart, $prevEnd]);
        $currentCompletedOrders = (clone $currentOrders)->whereIn('status', $this->doneOrderStatuses());
        $previousCompletedOrders = (clone $previousOrders)->whereIn('status', $this->doneOrderStatuses());

        $currentRevenue = (float) (clone $currentCompletedOrders)->sum('total');
        $previousRevenue = (float) (clone $previousCompletedOrders)->sum('total');
        $currentOrderCount = (int) (clone $currentCompletedOrders)->count();
        $previousOrderCount = (int) (clone $previousCompletedOrders)->count();

        $currentAverage = $currentOrderCount > 0 ? $currentRevenue / $currentOrderCount : 0;
        $previousAverage = $previousOrderCount > 0 ? $previousRevenue / $previousOrderCount : 0;

        $currentRetention = $this->calculateRetentionRate($restaurant->id, $start, $end);
        $previousRetention = $this->calculateRetentionRate($restaurant->id, $prevStart, $prevEnd);

        $revenueTrend = $this->buildRevenueTrend($restaurant->id, $start, $end, $period);
        $topDishes = $this->buildTopDishes($restaurant->id, $start, $end);
        $videoFunnel = $this->buildVideoFunnel($restaurant->id, $start, $end);
        $topVideo = $this->buildTopVideo($restaurant->id, $start, $end);
        $retentionMetrics = $this->buildRetentionMetrics($restaurant->id, $start, $end);

        return $this->successResponse([
            'period' => $period,
            'period_label' => $period === 'yearly' ? $start->format('Y') : $start->format('F Y'),
            'range_days' => (int) $start->diffInDays($end) + 1,
            'metrics' => [
                'total_revenue' => [
                    'value' => round($currentRevenue, 2),
                    'change_percent' => $this->percentChange($currentRevenue, $previousRevenue),
                ],
                'order_volume' => [
                    'value' => $currentOrderCount,
                    'change_percent' => $this->percentChange($currentOrderCount, $previousOrderCount),
                ],
                'avg_order_value' => [
                    'value' => round($currentAverage, 2),
                    'change_percent' => $this->percentChange($currentAverage, $previousAverage),
                ],
                'retention_rate' => [
                    'value' => $currentRetention,
                    'change_percent' => $this->percentChange($currentRetention, $previousRetention),
                ],
            ],
            'revenue_trend' => $revenueTrend,
            'order_split' => [
                'delivery' => (int) (clone $currentOrders)->whereIn('status', ['on_the_way', 'delivered'])->count(),
                'pickup' => (int) (clone $currentOrders)->whereIn('status', ['ready_for_pickup', 'picked_up'])->count(),
            ],
            'top_dishes' => $topDishes,
            'video_funnel' => $videoFunnel,
            'top_video' => $topVideo,
            'retention' => $retentionMetrics,
        ]);
    }

    private function resolvePeriod(Request $request): string
    {
        $period = strtolower(trim((string) $request->query('period', '')));
        if (in_array($period, ['monthly', 'yearly'], true)) {
            return $period;
        }

        $rangeDays = (int) $request->query('range_days', 30);

        return $rangeDays >= 365 ? 'yearly' : 'monthly';
    }

    /**
     * @return array{Carbon, Carbon, Carbon, Carbon}
     */
    private function resolvePeriodWindow(string $period): array
    {
        $now = now();

        if ($period === 'yearly') {
            $start = $now->copy()->startOfYear()->startOfDay();
            $end = $now->copy()->endOfYear()->endOfDay();
            $prevStart = $now->copy()->subYear()->startOfYear()->startOfDay();
            $prevEnd = $now->copy()->subYear()->endOfYear()->endOfDay();

            return [$start, $end, $prevStart, $prevEnd];
        }

        $start = $now->copy()->startOfMonth()->startOfDay();
        $end = $now->copy()->endOfMonth()->endOfDay();
        $prevStart = $now->copy()->subMonthNoOverflow()->startOfMonth()->startOfDay();
        $prevEnd = $now->copy()->subMonthNoOverflow()->endOfMonth()->endOfDay();

        return [$start, $end, $prevStart, $prevEnd];
    }

    private function calculateRetentionRate(int $restaurantId, \DateTimeInterface $start, \DateTimeInterface $end): float
    {
        $rows = Order::query()
            ->where('restaurant_id', $restaurantId)
            ->whereBetween('created_at', [$start, $end])
            ->whereIn('status', $this->doneOrderStatuses())
            ->selectRaw('customer_id, COUNT(*) as order_count')
            ->groupBy('customer_id')
            ->get();

        $totalCustomers = $rows->count();
        if ($totalCustomers === 0) {
            return 0.0;
        }

        $returningCustomers = $rows->where('order_count', '>', 1)->count();

        return round(($returningCustomers / $totalCustomers) * 100, 1);
    }

    private function buildRevenueTrend(
        int $restaurantId,
        \DateTimeInterface $start,
        \DateTimeInterface $end,
        string $period
    ): array {
        $orders = Order::query()
            ->where('restaurant_id', $restaurantId)
            ->whereBetween('created_at', [$start, $end])
            ->whereIn('status', $this->doneOrderStatuses())
            ->get(['created_at', 'total']);

        if ($period === 'yearly') {
            $bucketed = [];
            for ($month = 1; $month <= 12; $month++) {
                $bucketed[$month] = ['orders_count' => 0, 'revenue' => 0.0];
            }

            foreach ($orders as $order) {
                $month = (int) $order->created_at->format('n');
                $bucketed[$month]['orders_count']++;
                $bucketed[$month]['revenue'] += (float) $order->total;
            }

            $year = (int) Carbon::parse($start)->format('Y');
            $months = [];

            for ($month = 1; $month <= 12; $month++) {
                $date = Carbon::create($year, $month, 1);

                $months[] = [
                    'bucket' => $date->format('Y-m'),
                    'day' => null,
                    'month' => $month,
                    'label' => $date->format('M'),
                    'full_label' => $date->format('F Y'),
                    'orders_count' => (int) $bucketed[$month]['orders_count'],
                    'revenue' => round((float) $bucketed[$month]['revenue'], 2),
                ];
            }

            return $months;
        }

        $bucketed = [];
        foreach ($orders as $order) {
            $day = $order->created_at->toDateString();
            if (!isset($bucketed[$day])) {
                $bucketed[$day] = ['orders_count' => 0, 'revenue' => 0.0];
            }

            $bucketed[$day]['orders_count']++;
            $bucketed[$day]['revenue'] += (float) $order->total;
        }

        $days = [];
        $cursor = Carbon::parse($start)->startOfDay();
        $finalDay = Carbon::parse($end)->startOfDay();

        while ($cursor->lte($finalDay)) {
            $key = $cursor->toDateString();
            $row = $bucketed[$key] ?? ['orders_count' => 0, 'revenue' => 0.0];

            $days[] = [
                'bucket' => $key,
                'day' => $key,
                'month' => null,
                'label' => $cursor->format('j'),
                'full_label' => $cursor->format('M d'),
                'orders_count' => (int) $row['orders_count'],
                'revenue' => round((float) $row['revenue'], 2),
            ];

            $cursor->addDay();
        }

        return $days;
    }

    private function buildTopDishes(int $restaurantId, \DateTimeInterface $start, \DateTimeInterface $end): array
    {
        return DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('menu_items', 'menu_items.id', '=', 'order_items.menu_item_id')
            ->where('orders.restaurant_id', $restaurantId)
            ->whereBetween('orders.created_at', [$start, $end])
            ->whereIn('orders.status', $this->doneOrderStatuses())
            ->selectRaw('menu_items.id as menu_item_id, menu_items.name, SUM(order_items.quantity) as sold')
            ->groupBy('menu_items.id', 'menu_items.name')
            ->orderByDesc('sold')
            ->limit(5)
            ->get()
            ->map(fn ($row) => [
                'menu_item_id' => (int) $row->menu_item_id,
                'name' => $row->name,
                'sold' => (int) $row->sold,
            ])
            ->values()
            ->all();
    }

    private function buildVideoFunnel(int $restaurantId, \DateTimeInterface $start, \DateTimeInterface $end): array
    {
        $videoIds = Video::query()
            ->where('restaurant_id', $restaurantId)
            ->pluck('id');

        if ($videoIds->isEmpty()) {
            return [
                'video_views' => 0,
                'item_clicks' => 0,
                'added_to_cart' => 0,
                'orders_completed' => 0,
            ];
        }

        $counts = VideoEngagement::query()
            ->whereIn('video_id', $videoIds)
            ->whereBetween('created_at', [$start, $end])
            ->selectRaw('type, COUNT(*) as count')
            ->groupBy('type')
            ->pluck('count', 'type');

        $videoViews = (int) ($counts['view'] ?? 0);
        $itemClicks = (int) (($counts['like'] ?? 0) + ($counts['save'] ?? 0));
        $addedToCart = (int) round($itemClicks * 0.25);
        $ordersCompleted = (int) min(
            $addedToCart,
            Order::query()
                ->where('restaurant_id', $restaurantId)
                ->whereBetween('created_at', [$start, $end])
                ->whereIn('status', $this->doneOrderStatuses())
                ->count()
        );

        return [
            'video_views' => $videoViews,
            'item_clicks' => $itemClicks,
            'added_to_cart' => $addedToCart,
            'orders_completed' => $ordersCompleted,
        ];
    }

    private function buildTopVideo(int $restaurantId, \DateTimeInterface $start, \DateTimeInterface $end): ?array
    {
        $video = Video::query()
            ->where('restaurant_id', $restaurantId)
            ->withCount([
                'engagements as views_count' => fn ($builder) => $builder
                    ->where('type', 'view')
                    ->whereBetween('created_at', [$start, $end]),
                'engagements as likes_count' => fn ($builder) => $builder
                    ->where('type', 'like')
                    ->whereBetween('created_at', [$start, $end]),
                'engagements as shares_count' => fn ($builder) => $builder
                    ->where('type', 'share')
                    ->whereBetween('created_at', [$start, $end]),
            ])
            ->orderByDesc('views_count')
            ->first();

        if (!$video) {
            return null;
        }

        $views = (int) ($video->views_count ?? 0);
        $likes = (int) ($video->likes_count ?? 0);
        $ctr = $views > 0 ? round(($likes / $views) * 100, 1) : 0;

        return [
            'id' => $video->id,
            'title' => $video->title,
            'thumbnail_url' => $video->thumbnail_url,
            'views_count' => $views,
            'likes_count' => $likes,
            'shares_count' => (int) ($video->shares_count ?? 0),
            'ctr' => $ctr,
        ];
    }

    private function buildRetentionMetrics(int $restaurantId, \DateTimeInterface $start, \DateTimeInterface $end): array
    {
        $customerRows = Order::query()
            ->where('restaurant_id', $restaurantId)
            ->whereBetween('created_at', [$start, $end])
            ->whereIn('status', $this->doneOrderStatuses())
            ->selectRaw('customer_id, COUNT(*) as order_count')
            ->groupBy('customer_id')
            ->get();

        $totalCustomers = $customerRows->count();
        $returningCustomers = $customerRows->where('order_count', '>', 1)->count();
        $newCustomers = max(0, $totalCustomers - $returningCustomers);
        $repeatProbability = $totalCustomers > 0
            ? round(($returningCustomers / $totalCustomers) * 100, 1)
            : 0;

        return [
            'new_customers' => $newCustomers,
            'returning_customers' => $returningCustomers,
            'repeat_probability' => $repeatProbability,
        ];
    }

    private function percentChange(float|int $current, float|int $previous): float
    {
        $currentValue = (float) $current;
        $previousValue = (float) $previous;

        if ($previousValue == 0.0) {
            return $currentValue > 0 ? 100.0 : 0.0;
        }

        return round((($currentValue - $previousValue) / abs($previousValue)) * 100, 1);
    }

    private function doneOrderStatuses(): array
    {
        return ['delivered'];
    }

    private function resolveRestaurant(): Restaurant
    {
        return Restaurant::firstOrCreate(
            ['owner_user_id' => auth()->id()],
            ['name' => 'My Restaurant', 'status' => 'active']
        );
    }
}
