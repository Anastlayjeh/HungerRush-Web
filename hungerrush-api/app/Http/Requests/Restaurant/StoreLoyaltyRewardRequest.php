<?php

namespace App\Http\Requests\Restaurant;

use Illuminate\Foundation\Http\FormRequest;

class StoreLoyaltyRewardRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string'],
            'points_required' => ['required', 'integer', 'min:0'],
            'reward_type' => ['nullable', 'in:discount,free_item,free_delivery'],
            'status' => ['nullable', 'in:active,draft,archived'],
            'menu_item_id' => ['nullable', 'integer', 'exists:menu_items,id', 'required_if:reward_type,discount,free_item'],
            'discount_percentage' => ['nullable', 'numeric', 'min:0', 'max:100', 'required_if:reward_type,discount,free_item'],
        ];
    }
}
