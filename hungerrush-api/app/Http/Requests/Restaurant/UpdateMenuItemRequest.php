<?php

namespace App\Http\Requests\Restaurant;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMenuItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category_id' => ['sometimes', 'exists:menu_categories,id'],
            'name' => ['sometimes', 'string', 'max:180'],
            'description' => ['nullable', 'string'],
            'ingredients' => ['nullable', 'string'],
            'image_urls' => ['nullable', 'array', 'max:8'],
            'image_urls.*' => ['url', 'max:2048'],
            'price' => ['sometimes', 'numeric', 'min:0'],
            'is_available' => ['sometimes', 'boolean'],
            'prep_time' => ['sometimes', 'integer', 'min:1'],
        ];
    }
}
