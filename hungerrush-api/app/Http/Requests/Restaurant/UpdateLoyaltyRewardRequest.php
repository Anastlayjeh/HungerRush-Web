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
            'reward_type' => ['sometimes', 'in:discount,free_item,free_delivery,cashback,custom'],
            'status' => ['sometimes', 'in:active,draft,archived'],
            'usage_count' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}

