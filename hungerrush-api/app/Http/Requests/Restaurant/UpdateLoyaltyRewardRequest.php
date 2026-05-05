<?php

namespace App\Http\Requests\Restaurant;

use Illuminate\Foundation\Http\FormRequest;

class UpdateLoyaltyRewardRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:120'],
            'description' => ['nullable', 'string'],
            'points_required' => ['sometimes', 'integer', 'min:0'],
            'reward_type' => ['sometimes', 'in:discount,free_item,free_delivery'],
            'status' => ['sometimes', 'in:active,draft,archived'],
            'menu_item_id' => ['sometimes', 'nullable', 'integer', 'exists:menu_items,id'],
            'discount_percentage' => ['sometimes', 'nullable', 'numeric', 'min:0', 'max:100'],
            'usage_count' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
