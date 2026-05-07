<?php

namespace App\Http\Requests\Customer;

use Illuminate\Foundation\Http\FormRequest;

class PlaceOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'cart_id' => ['nullable', 'exists:carts,id'],
            'restaurant_id' => ['nullable', 'exists:restaurants,id'],
            'branch_id' => ['nullable', 'exists:restaurant_branches,id'],
        ];
    }
}
