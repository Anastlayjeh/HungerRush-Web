<?php

namespace App\Http\Requests\Restaurant;

use Illuminate\Foundation\Http\FormRequest;

class StoreMenuItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category_id' => ['required', 'exists:menu_categories,id'],
            'name' => ['required', 'string', 'max:180'],
            'description' => ['nullable', 'string'],
            'image_urls' => ['nullable', 'array', 'max:8'],
            'image_urls.*' => ['url', 'max:2048'],
            'price' => ['required', 'numeric', 'min:0'],
            'is_available' => ['nullable', 'boolean'],
            'prep_time' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
