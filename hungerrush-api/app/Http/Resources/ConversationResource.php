<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConversationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $latest = $this->resource->relationLoaded('latestMessage')
            ? $this->latestMessage
            : null;

        return [
            'id' => $this->id,
            'restaurant_id' => $this->restaurant_id,
            'customer_id' => $this->customer_id,
            'order_id' => $this->order_id,
            'subject' => $this->subject,
            'status' => $this->status,
            'last_message_at' => optional($this->last_message_at)->toISOString(),
            'restaurant' => new RestaurantResource($this->whenLoaded('restaurant')),
            'customer' => $this->whenLoaded('customer', fn () => [
                'id' => $this->customer?->id,
                'name' => $this->customer?->name,
                'email' => $this->customer?->email,
                'phone' => $this->customer?->phone,
            ]),
            'latest_message' => $latest ? new ConversationMessageResource($latest) : null,
            'messages' => ConversationMessageResource::collection($this->whenLoaded('messages')),
            'unread_count' => (int) ($this->unread_count ?? 0),
            'created_at' => optional($this->created_at)->toISOString(),
            'updated_at' => optional($this->updated_at)->toISOString(),
        ];
    }
}
