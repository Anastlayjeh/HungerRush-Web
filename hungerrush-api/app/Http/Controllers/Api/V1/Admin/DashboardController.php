<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Http\Resources\ReportResource;
use App\Http\Resources\RestaurantResource;
use App\Models\Conversation;
use App\Models\Order;
use App\Models\Report;
use App\Models\Restaurant;
use App\Models\SupportRequest;
use App\Models\User;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function dashboard(Request $request)
    {
        $this->assertAdmin($request);

        return $this->successResponse([
            'stats' => [
                'users' => User::query()->count(),
                'customers' => User::query()->where('role', UserRole::Customer->value)->count(),
                'restaurant_owners' => User::query()->where('role', UserRole::RestaurantOwner->value)->count(),
                'restaurants' => Restaurant::query()->count(),
                'active_restaurants' => Restaurant::query()->where('status', 'active')->count(),
                'orders' => Order::query()->count(),
                'open_reports' => Report::query()->whereIn('status', ['open', 'reviewing'])->count(),
                'open_support_requests' => SupportRequest::query()->whereIn('status', ['open', 'in_progress'])->count(),
                'conversations' => Conversation::query()->count(),
            ],
            'recent_orders' => OrderResource::collection(
                Order::query()->with(['customer:id,name,email,phone', 'restaurant.branches', 'items.menuItem.category'])->latest()->limit(5)->get()
            ),
            'recent_reports' => ReportResource::collection(
                Report::query()->with(['reporter:id,name,email', 'restaurant.branches'])->latest()->limit(5)->get()
            ),
        ]);
    }

    public function users(Request $request)
    {
        $this->assertAdmin($request);
        $users = User::query()->latest()->paginate(30);

        return $this->successResponse($users->items(), [
            'current_page' => $users->currentPage(),
            'per_page' => $users->perPage(),
            'total' => $users->total(),
        ]);
    }

    public function restaurants(Request $request)
    {
        $this->assertAdmin($request);
        $restaurants = Restaurant::query()
            ->with(['owner:id,name,email,phone', 'branches'])
            ->withCount(['orders', 'reviews'])
            ->withAvg('reviews', 'rating')
            ->latest()
            ->paginate(30);

        return $this->successResponse(RestaurantResource::collection($restaurants->items()), [
            'current_page' => $restaurants->currentPage(),
            'per_page' => $restaurants->perPage(),
            'total' => $restaurants->total(),
        ]);
    }

    public function orders(Request $request)
    {
        $this->assertAdmin($request);
        $orders = Order::query()
            ->with(['customer:id,name,email,phone', 'restaurant.branches', 'branch', 'items.menuItem.category'])
            ->latest()
            ->paginate(30);

        return $this->successResponse(OrderResource::collection($orders->items()), [
            'current_page' => $orders->currentPage(),
            'per_page' => $orders->perPage(),
            'total' => $orders->total(),
        ]);
    }

    public function reports(Request $request)
    {
        $this->assertAdmin($request);
        $reports = Report::query()
            ->with(['reporter:id,name,email', 'restaurant.branches'])
            ->latest()
            ->paginate(30);

        return $this->successResponse(ReportResource::collection($reports->items()), [
            'current_page' => $reports->currentPage(),
            'per_page' => $reports->perPage(),
            'total' => $reports->total(),
        ]);
    }

    public function updateReport(Request $request, Report $report)
    {
        $this->assertAdmin($request);
        $validated = $request->validate([
            'status' => ['required', 'in:open,reviewing,resolved,dismissed'],
            'resolution' => ['nullable', 'string', 'max:4000'],
        ]);

        $payload = [
            'status' => $validated['status'],
            'resolution' => $validated['resolution'] ?? $report->resolution,
        ];

        if (in_array($validated['status'], ['resolved', 'dismissed'], true)) {
            $payload['resolved_by'] = $request->user()->id;
            $payload['resolved_at'] = now();
        }

        $report->update($payload);

        return $this->successResponse(new ReportResource($report->refresh()->load(['reporter:id,name,email', 'restaurant.branches'])), message: 'Report updated.');
    }

    private function assertAdmin(Request $request): void
    {
        abort_unless(($request->user()->role?->value ?? $request->user()->role) === UserRole::Admin->value, 403, 'Admin access required.');
    }
}
