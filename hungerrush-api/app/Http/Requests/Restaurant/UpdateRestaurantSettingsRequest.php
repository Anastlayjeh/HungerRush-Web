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
            'owner_phone' => [
                'sometimes',
                'nullable',
                'string',
                'max:32',
                Rule::unique('users', 'phone')->ignore(auth()->id()),
            ],
            'settings' => ['nullable', 'array'],
            'settings.default_prep_time' => ['nullable', 'integer', 'min:1', 'max:180'],
            'settings.auto_accept_orders' => ['nullable', 'boolean'],
            'settings.notifications_enabled' => ['nullable', 'boolean'],
            'settings.currency' => ['nullable', 'string', 'size:3'],
            'settings.timezone' => ['nullable', 'string', 'max:64'],
            'settings.contact_numbers' => ['nullable', 'array', 'max:10'],
            'settings.contact_numbers.*' => ['nullable', 'string', 'max:32'],
            'settings.profile_photo_url' => ['nullable', 'string', 'max:2048'],
            'locations' => ['nullable', 'array', 'max:20'],
            'locations.*.id' => ['nullable', 'integer'],
            'locations.*.name' => ['required_with:locations', 'string', 'max:120'],
            'locations.*.address' => ['required_with:locations', 'string', 'max:500'],
            'locations.*.phone' => ['nullable', 'string', 'max:32'],
            'locations.*.latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'locations.*.longitude' => ['nullable', 'numeric', 'between:-180,180'],
        ];
    }
}
