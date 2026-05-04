<?php

namespace App\Http\Requests\Restaurant;

use Illuminate\Foundation\Http\FormRequest;

class StoreVideoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'menu_item_id' => $this->filled('menu_item_id') ? $this->input('menu_item_id') : null,
            'description' => $this->filled('description') ? $this->input('description') : null,
            'published_at' => $this->filled('published_at') ? $this->input('published_at') : null,
        ]);
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'video' => ['required', 'file', 'mimes:mp4,mov,webm,m4v,avi,mpeg,mpg', 'max:204800'],
            'status' => ['nullable', 'in:draft,published,archived'],
            'menu_item_id' => ['nullable', 'exists:menu_items,id'],
            'published_at' => ['nullable', 'date'],
        ];
    }
}
