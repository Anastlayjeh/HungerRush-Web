<?php

namespace App\Http\Requests\Restaurant;

use Illuminate\Foundation\Http\FormRequest;

class StoreVideoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'media_url' => ['required', 'url', 'max:2048'],
            'thumbnail_url' => ['nullable', 'url', 'max:2048'],
            'status' => ['nullable', 'in:draft,published,archived'],
            'menu_item_id' => ['nullable', 'exists:menu_items,id'],
            'published_at' => ['nullable', 'date'],
        ];
    }
}

