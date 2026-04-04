<?php

namespace App\Http\Requests\Restaurant;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRestaurantSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['sometimes', 'in:active,inactive'],
            'owner_name' => ['sometimes', 'string', 'max:120'],
            'owner_email' => [
                'sometimes',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore(auth()->id()),
            ],
            'settings' => ['nullable', 'array'],
            'settings.default_prep_time' => ['nullable', 'integer', 'min:1', 'max:180'],
            'settings.auto_accept_orders' => ['nullable', 'boolean'],
            'settings.notifications_enabled' => ['nullable', 'boolean'],
            'settings.currency' => ['nullable', 'string', 'size:3'],
            'settings.timezone' => ['nullable', 'string', 'max:64'],
        ];
    }
}

