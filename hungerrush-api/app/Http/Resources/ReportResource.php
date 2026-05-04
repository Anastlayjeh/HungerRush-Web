<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReportResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reporter_user_id' => $this->reporter_user_id,
            'restaurant_id' => $this->restaurant_id,
            'order_id' => $this->order_id,
            'subject' => $this->subject,
            'message' => $this->message,
            'status' => $this->status,
            'resolution' => $this->resolution,
            'resolved_by' => $this->resolved_by,
            'resolved_at' => optional($this->resolved_at)->toISOString(),
            'reporter' => $this->whenLoaded('reporter', fn () => [
                'id' => $this->reporter?->id,
                'name' => $this->reporter?->name,
                'email' => $this->reporter?->email,
            ]),
            'restaurant' => new RestaurantResource($this->whenLoaded('restaurant')),
            'created_at' => optional($this->created_at)->toISOString(),
            'updated_at' => optional($this->updated_at)->toISOString(),
        ];
    }
}
