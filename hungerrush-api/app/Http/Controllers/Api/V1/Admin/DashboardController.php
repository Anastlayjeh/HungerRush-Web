<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\OrderStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Http\Resources\ReportResource;
use App\Http\Resources\RestaurantResource;
use App\Models\Conversation;
use App\Models\Order;
use App\Models\OrderStatusHistory;
use App\Models\Report;
use App\Models\Restaurant;
use App\Models\RestaurantRegistration;
use App\Models\SupportRequest;
use App\Models\User;
use App\Models\UserNotification;
use App\Models\Video;
use App\Services\OrderStatusTransitionService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

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
                'pending_approvals' => RestaurantRegistration::query()->where('status', 'pending')->count(),
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
            ->with(['owner:id,name,email,phone,role,status,last_login_at,email_verified_at,created_at,updated_at', 'branches'])
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

    public function restaurantRegistrations(Request $request)
    {
        $this->assertAdmin($request);
        $validated = $request->validate([
            'q' => ['nullable', 'string', 'max:200'],
            'status' => ['nullable', 'in:pending,approved,rejected'],
            'per_page' => ['nullable', 'integer', 'min:5', 'max:100'],
        ]);

        $registrations = RestaurantRegistration::query()
            ->with([
                'owner:id,name,email,phone,role,status,last_login_at,email_verified_at,created_at,updated_at',
                'reviewer:id,name,email',
            ])
            ->latest();

        if (!empty($validated['status'])) {
            $registrations->where('status', $validated['status']);
        }

        if (!empty($validated['q'])) {
            $search = trim((string) $validated['q']);
            $registrations->where(function ($builder) use ($search) {
                $builder
                    ->where('restaurant_name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('contact_email', 'like', "%{$search}%")
                    ->orWhere('contact_phone', 'like', "%{$search}%")
                    ->orWhere('id', 'like', "%{$search}%")
                    ->orWhereHas('owner', function ($ownerBuilder) use ($search) {
                        $ownerBuilder
                            ->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%")
                            ->orWhere('phone', 'like', "%{$search}%");
                    });
            });
        }

        $results = $registrations->paginate((int) ($validated['per_page'] ?? 30));

        return $this->successResponse(
            $results->getCollection()->map(fn (RestaurantRegistration $registration) => $this->transformRestaurantRegistration($registration))->values(),
            [
                'current_page' => $results->currentPage(),
                'per_page' => $results->perPage(),
                'total' => $results->total(),
            ]
        );
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

    public function videos(Request $request)
    {
        $this->assertAdmin($request);
        $validated = $request->validate([
            'q' => ['nullable', 'string', 'max:200'],
            'restaurant_id' => ['nullable', 'integer', 'exists:restaurants,id'],
            'status' => ['nullable', 'in:draft,published,archived'],
            'stream_state' => ['nullable', 'in:ready,processing'],
            'created_from' => ['nullable', 'date'],
            'created_to' => ['nullable', 'date', 'after_or_equal:created_from'],
            'per_page' => ['nullable', 'integer', 'min:5', 'max:100'],
        ]);

        $videos = Video::query()
            ->with([
                'restaurant:id,name,owner_user_id',
                'restaurant.owner:id,name,email,phone',
                'menuItem:id,name,price,is_available',
            ])
            ->withCount([
                'engagements as views_count' => fn ($builder) => $builder->where('type', 'view'),
                'engagements as likes_count' => fn ($builder) => $builder->where('type', 'like'),
                'engagements as shares_count' => fn ($builder) => $builder->where('type', 'share'),
                'comments as comments_count',
            ])
            ->latest();

        if (!empty($validated['restaurant_id'])) {
            $videos->where('restaurant_id', $validated['restaurant_id']);
        }

        if (!empty($validated['status'])) {
            $videos->where('status', $validated['status']);
        }

        if (!empty($validated['stream_state'])) {
            $videos->where('stream_ready', $validated['stream_state'] === 'ready');
        }

        if (!empty($validated['created_from'])) {
            $videos->whereDate('created_at', '>=', $validated['created_from']);
        }

        if (!empty($validated['created_to'])) {
            $videos->whereDate('created_at', '<=', $validated['created_to']);
        }

        if (!empty($validated['q'])) {
            $search = trim((string) $validated['q']);
            $videos->where(function ($builder) use ($search) {
                $builder
                    ->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('id', 'like', "%{$search}%")
                    ->orWhereHas('restaurant', fn ($restaurantBuilder) => $restaurantBuilder->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('menuItem', fn ($menuItemBuilder) => $menuItemBuilder->where('name', 'like', "%{$search}%"));
            });
        }

        $perPage = (int) ($validated['per_page'] ?? 20);
        $results = $videos->paginate($perPage);

        return $this->successResponse(
            $results->getCollection()->map(fn (Video $video) => $this->transformAdminVideo($video))->values(),
            [
                'current_page' => $results->currentPage(),
                'per_page' => $results->perPage(),
                'total' => $results->total(),
            ]
        );
    }

    public function updateOrder(Request $request, Order $order, OrderStatusTransitionService $transitionService)
    {
        $this->assertAdmin($request);
        $validated = $request->validate([
            'status' => ['nullable', 'in:pending,accepted,rejected,preparing,ready_for_pickup,picked_up,on_the_way,delivered,cancelled'],
            'payment_status' => ['nullable', 'in:unpaid,authorized,paid,refunded,failed'],
        ]);

        if (!array_key_exists('status', $validated) && !array_key_exists('payment_status', $validated)) {
            return $this->errorResponse(
                'At least one field is required.',
                ['status' => ['Provide status and/or payment_status.']],
                code: 'missing_update_fields'
            );
        }

        $payload = [];
        $statusChanged = false;
        $nextStatus = $order->status;

        if (array_key_exists('status', $validated) && $validated['status'] !== null) {
            $nextStatus = OrderStatus::from($validated['status']);
            $statusChanged = $order->status !== $nextStatus;

            // Admins can force-cancel/refund orders from any state.
            $isAdminCancelOverride = $nextStatus === OrderStatus::Cancelled;

            if ($statusChanged && !$isAdminCancelOverride && !$transitionService->canTransition($order->status, $nextStatus)) {
                return $this->errorResponse(
                    'Invalid status transition.',
                    ['status' => ['Transition is not allowed from current status.']],
                    'invalid_order_transition'
                );
            }

            if ($statusChanged) {
                $payload['status'] = $nextStatus->value;
            }
        }

        if (array_key_exists('payment_status', $validated) && $validated['payment_status'] !== null) {
            $currentPaymentStatus = $order->payment_status?->value ?? $order->payment_status;
            if ($currentPaymentStatus !== $validated['payment_status']) {
                $payload['payment_status'] = $validated['payment_status'];
            }
        }

        if (!empty($payload)) {
            $order->update($payload);
        }

        if ($statusChanged) {
            OrderStatusHistory::create([
                'order_id' => $order->id,
                'status' => $nextStatus->value,
                'changed_by' => $request->user()->id,
                'changed_at' => now(),
            ]);

            UserNotification::create([
                'user_id' => $order->customer_id,
                'type' => 'order_status',
                'title' => 'Order status updated',
                'body' => "Order #{$order->id} is now {$nextStatus->value}.",
                'data' => ['order_id' => $order->id, 'status' => $nextStatus->value],
            ]);
        }

        return $this->successResponse(
            new OrderResource(
                $order->refresh()->load(['customer:id,name,email,phone', 'restaurant.branches', 'branch', 'items.menuItem.category', 'statusHistory'])
            ),
            message: 'Order updated.'
        );
    }

    public function updateRestaurantRegistration(Request $request, RestaurantRegistration $registration)
    {
        $this->assertAdmin($request);
        $validated = $request->validate([
            'status' => ['required', 'in:pending,approved,rejected'],
            'review_note' => ['nullable', 'string', 'max:4000'],
        ]);

        $payload = [
            'status' => $validated['status'],
            'review_note' => $validated['review_note'] ?? $registration->review_note,
        ];

        if ($validated['status'] === 'pending') {
            $payload['reviewed_by'] = null;
            $payload['reviewed_at'] = null;
        } else {
            $payload['reviewed_by'] = $request->user()->id;
            $payload['reviewed_at'] = now();
        }

        $registration->update($payload);

        if ($validated['status'] === 'approved') {
            $registrationEmail = $this->normalizeEmail($registration->contact_email);
            $registrationPhone = is_string($registration->contact_phone) ? trim($registration->contact_phone) : $registration->contact_phone;
            $owner = User::query()->find($registration->owner_user_id);

            if (!$owner && !blank($registrationEmail)) {
                $owner = User::query()->whereRaw('LOWER(email) = ?', [$registrationEmail])->first();
            }

            if (!$owner && !blank($registrationPhone)) {
                $owner = User::query()->where('phone', $registrationPhone)->first();
            }

            if (!$owner) {
                $owner = User::create([
                    'name' => trim((string) ($registration->payload['owner_name'] ?? '')) ?: ($registration->restaurant_name ?: 'Restaurant Owner'),
                    'email' => $registrationEmail ?: null,
                    'phone' => $registrationPhone ?: null,
                    'password' => Str::random(32),
                    'role' => UserRole::RestaurantOwner->value,
                    'status' => 'active',
                ]);
            }

            $ownerUpdates = [
                'role' => UserRole::RestaurantOwner->value,
                'status' => 'active',
            ];

            if (blank($owner->email) && !blank($registrationEmail)) {
                $emailInUse = User::query()
                    ->whereRaw('LOWER(email) = ?', [$registrationEmail])
                    ->where('id', '!=', $owner->id)
                    ->exists();

                if (!$emailInUse) {
                    $ownerUpdates['email'] = $registrationEmail;
                }
            }

            if (blank($owner->phone) && !blank($registrationPhone)) {
                $phoneInUse = User::query()
                    ->where('phone', $registrationPhone)
                    ->where('id', '!=', $owner->id)
                    ->exists();

                if (!$phoneInUse) {
                    $ownerUpdates['phone'] = $registrationPhone;
                }
            }

            $owner->forceFill($ownerUpdates)->save();

            if ((int) $registration->owner_user_id !== (int) $owner->id) {
                $registration->forceFill(['owner_user_id' => $owner->id])->save();
            }

            $restaurant = Restaurant::firstOrNew([
                'owner_user_id' => $owner->id,
            ]);

            if (!$restaurant->exists) {
                $restaurant->name = $registration->restaurant_name ?: (($owner->name ?? 'Owner') . "'s Restaurant");
                $restaurant->description = $registration->description;
                $restaurant->status = 'active';
            } else {
                if (blank($restaurant->name) || $restaurant->name === 'My Restaurant') {
                    $restaurant->name = $registration->restaurant_name ?: $restaurant->name;
                }

                if (blank($restaurant->description) && !blank($registration->description)) {
                    $restaurant->description = $registration->description;
                }

                $restaurant->status = 'active';
            }

            $restaurant->save();
        }

        return $this->successResponse(
            $this->transformRestaurantRegistration($registration->refresh()->load([
                'owner:id,name,email,phone,role,status,last_login_at,email_verified_at,created_at,updated_at',
                'reviewer:id,name,email',
            ])),
            message: 'Registration updated.'
        );
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

    private function transformAdminVideo(Video $video): array
    {
        return [
            'id' => $video->id,
            'restaurant_id' => $video->restaurant_id,
            'restaurant_name' => $video->restaurant?->name,
            'owner' => $video->restaurant?->owner ? [
                'id' => $video->restaurant->owner->id,
                'name' => $video->restaurant->owner->name,
                'email' => $video->restaurant->owner->email,
                'phone' => $video->restaurant->owner->phone,
            ] : null,
            'menu_item_id' => $video->menu_item_id,
            'menu_item' => $video->menuItem ? [
                'id' => $video->menuItem->id,
                'name' => $video->menuItem->name,
                'price' => (float) $video->menuItem->price,
                'is_available' => (bool) $video->menuItem->is_available,
            ] : null,
            'title' => $video->title,
            'description' => $video->description,
            'media_url' => $video->media_url,
            'thumbnail_url' => $video->thumbnail_url,
            'stream_uid' => $video->cloudflare_stream_uid,
            'duration_seconds' => $video->duration_seconds ? (int) $video->duration_seconds : null,
            'stream_status' => $video->stream_status,
            'stream_ready' => (bool) $video->stream_ready,
            'stream_hls_url' => $video->stream_hls_url,
            'stream_dash_url' => $video->stream_dash_url,
            'stream_preview_url' => $video->stream_preview_url,
            'status' => $video->status,
            'published_at' => optional($video->published_at)->toISOString(),
            'views_count' => (int) ($video->views_count ?? 0),
            'likes_count' => (int) ($video->likes_count ?? 0),
            'shares_count' => (int) ($video->shares_count ?? 0),
            'comments_count' => (int) ($video->comments_count ?? 0),
            'created_at' => optional($video->created_at)->toISOString(),
            'updated_at' => optional($video->updated_at)->toISOString(),
        ];
    }

    private function transformRestaurantRegistration(RestaurantRegistration $registration): array
    {
        return [
            'id' => $registration->id,
            'owner_user_id' => $registration->owner_user_id,
            'restaurant_name' => $registration->restaurant_name,
            'description' => $registration->description,
            'contact_email' => $registration->contact_email,
            'contact_phone' => $registration->contact_phone,
            'status' => $registration->status,
            'review_note' => $registration->review_note,
            'reviewed_at' => optional($registration->reviewed_at)->toISOString(),
            'created_at' => optional($registration->created_at)->toISOString(),
            'updated_at' => optional($registration->updated_at)->toISOString(),
            'payload' => $registration->payload,
            'owner' => $registration->owner ? [
                'id' => $registration->owner->id,
                'name' => $registration->owner->name,
                'email' => $registration->owner->email,
                'phone' => $registration->owner->phone,
                'role' => $registration->owner->role?->value ?? $registration->owner->role,
                'status' => $registration->owner->status,
                'last_login_at' => optional($registration->owner->last_login_at)->toISOString(),
                'email_verified_at' => optional($registration->owner->email_verified_at)->toISOString(),
                'created_at' => optional($registration->owner->created_at)->toISOString(),
                'updated_at' => optional($registration->owner->updated_at)->toISOString(),
            ] : null,
            'reviewer' => $registration->reviewer ? [
                'id' => $registration->reviewer->id,
                'name' => $registration->reviewer->name,
                'email' => $registration->reviewer->email,
            ] : null,
        ];
    }

    private function assertAdmin(Request $request): void
    {
        abort_unless(($request->user()->role?->value ?? $request->user()->role) === UserRole::Admin->value, 403, 'Admin access required.');
    }

    private function normalizeEmail(mixed $email): ?string
    {
        if (!is_string($email)) {
            return null;
        }

        $normalized = strtolower(trim($email));

        return $normalized === '' ? null : $normalized;
    }
}
