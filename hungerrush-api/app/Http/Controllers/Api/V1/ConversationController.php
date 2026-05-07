<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Resources\ConversationMessageResource;
use App\Http\Resources\ConversationResource;
use App\Models\Conversation;
use App\Models\ConversationMessage;
use App\Models\Restaurant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ConversationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Conversation::query()
            ->with(['restaurant.branches', 'customer:id,name,email,phone', 'latestMessage.sender:id,name,email,role'])
            ->withCount([
                'messages as unread_count' => fn ($builder) => $builder
                    ->where('sender_id', '!=', $user->id)
                    ->whereNull('read_at'),
            ])
            ->latest('last_message_at')
            ->latest('updated_at');

        if ($this->isRestaurantUser($user)) {
            $restaurant = $this->resolveRestaurant($user->id);
            $query->where('restaurant_id', $restaurant->id);
        } elseif ($this->isCustomer($user)) {
            $query->where('customer_id', $user->id);
        } else {
            abort(403, 'Not authorized to view conversations.');
        }

        $search = trim((string) $request->query('q', ''));
        if ($search !== '') {
            $query->where(function ($builder) use ($search) {
                $builder
                    ->where('subject', 'like', "%{$search}%")
                    ->orWhere('id', 'like', "%{$search}%")
                    ->orWhereHas('restaurant', fn ($restaurantBuilder) => $restaurantBuilder->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('customer', function ($customerBuilder) use ($search) {
                        $customerBuilder
                            ->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%")
                            ->orWhere('phone', 'like', "%{$search}%");
                    });
            });
        }

        $conversations = $query->paginate(30);

        return $this->successResponse(ConversationResource::collection($conversations->items()), [
            'current_page' => $conversations->currentPage(),
            'per_page' => $conversations->perPage(),
            'total' => $conversations->total(),
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        abort_unless($this->isCustomer($user), 403, 'Only customers can start a restaurant conversation.');

        $validated = $request->validate([
            'restaurant_id' => ['required', 'exists:restaurants,id'],
            'order_id' => ['nullable', 'exists:orders,id'],
            'subject' => ['nullable', 'string', 'max:180'],
            'message' => ['nullable', 'string', 'max:4000'],
        ]);

        $conversation = Conversation::query()->firstOrCreate(
            [
                'restaurant_id' => $validated['restaurant_id'],
                'customer_id' => $user->id,
                'order_id' => $validated['order_id'] ?? null,
            ],
            [
                'subject' => $validated['subject'] ?? null,
                'status' => 'open',
                'last_message_at' => now(),
            ]
        );

        $message = trim((string) ($validated['message'] ?? ''));
        if ($message !== '') {
            $this->createMessage($conversation, $user->id, $message);
        }

        return $this->successResponse(
            new ConversationResource($conversation->refresh()->load(['restaurant.branches', 'customer:id,name,email,phone', 'messages.sender:id,name,email,role'])),
            message: 'Conversation started.',
            status: 201
        );
    }

    public function show(Request $request, Conversation $conversation)
    {
        $this->assertCanAccess($request, $conversation);
        $conversation->load(['restaurant.branches', 'customer:id,name,email,phone', 'messages.sender:id,name,email,role']);

        return $this->successResponse(new ConversationResource($conversation));
    }

    public function sendMessage(Request $request, Conversation $conversation)
    {
        $this->assertCanAccess($request, $conversation);
        $validated = $request->validate([
            'body' => ['required', 'string', 'max:4000'],
        ]);

        $message = $this->createMessage($conversation, $request->user()->id, $validated['body']);

        return $this->successResponse(
            new ConversationMessageResource($message->load('sender:id,name,email,role')),
            message: 'Message sent.',
            status: 201
        );
    }

    public function markRead(Request $request, Conversation $conversation)
    {
        $this->assertCanAccess($request, $conversation);

        ConversationMessage::query()
            ->where('conversation_id', $conversation->id)
            ->where('sender_id', '!=', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return $this->successResponse(['read' => true], message: 'Conversation marked as read.');
    }

    private function createMessage(Conversation $conversation, int $senderId, string $body): ConversationMessage
    {
        return DB::transaction(function () use ($conversation, $senderId, $body) {
            $message = $conversation->messages()->create([
                'sender_id' => $senderId,
                'body' => trim($body),
            ]);

            $conversation->update([
                'status' => 'open',
                'last_message_at' => now(),
            ]);

            return $message;
        });
    }

    private function assertCanAccess(Request $request, Conversation $conversation): void
    {
        $user = $request->user();
        if ($this->isCustomer($user) && $conversation->customer_id === $user->id) {
            return;
        }

        if ($this->isRestaurantUser($user)) {
            $restaurant = $this->resolveRestaurant($user->id);
            if ($conversation->restaurant_id === $restaurant->id) {
                return;
            }
        }

        abort(404);
    }

    private function resolveRestaurant(int $ownerUserId): Restaurant
    {
        return Restaurant::firstOrCreate(
            ['owner_user_id' => $ownerUserId],
            ['name' => 'My Restaurant', 'status' => 'active']
        );
    }

    private function isRestaurantUser($user): bool
    {
        return in_array($user->role?->value, [UserRole::RestaurantOwner->value, UserRole::RestaurantStaff->value], true);
    }

    private function isCustomer($user): bool
    {
        return ($user->role?->value ?? $user->role) === UserRole::Customer->value;
    }
}
