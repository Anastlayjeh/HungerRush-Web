<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConversationMessageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'conversation_id' => $this->conversation_id,
            'sender_id' => $this->sender_id,
            'sender' => $this->whenLoaded('sender', fn () => [
                'id' => $this->sender?->id,
                'name' => $this->sender?->name,
                'email' => $this->sender?->email,
                'role' => $this->sender?->role?->value ?? $this->sender?->role,
            ]),
            'body' => $this->body,
            'read_at' => optional($this->read_at)->toISOString(),
            'created_at' => optional($this->created_at)->toISOString(),
        ];
    }
}
