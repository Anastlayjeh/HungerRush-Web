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
            'reward_type' => ['nullable', 'in:discount,free_item,free_delivery,cashback,custom'],
            'status' => ['nullable', 'in:active,draft,archived'],
        ];
    }
}

