<?php

namespace App\Http\Requests\Customer;

use Illuminate\Foundation\Http\FormRequest;

class PlaceOrderRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'delivery_address' => $this->input('delivery_address', $this->input('address')),
            'delivery_phone' => $this->input('delivery_phone', $this->input('phone')),
            'order_notes' => $this->input('order_notes', $this->input('notes')),
        ]);
    }

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
            'loyalty_offer_id' => ['nullable', 'exists:loyalty_offers,id'],
            'delivery_address' => ['required', 'array'],
            'delivery_address.city' => ['required', 'string', 'max:120'],
            'delivery_address.street' => ['required', 'string', 'max:255'],
            'delivery_address.building' => ['required', 'string', 'max:255'],
            'delivery_address.floor' => ['nullable', 'string', 'max:64'],
            'delivery_address.apartment' => ['nullable', 'string', 'max:64'],
            'delivery_address.landmark' => ['nullable', 'string', 'max:255'],
            'delivery_address_label' => ['nullable', 'string', 'max:1000'],
            'delivery_phone' => ['required', 'string', 'max:32'],
            'phone' => ['nullable', 'string', 'max:32'],
            'order_notes' => ['nullable', 'string', 'max:1000'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'payment_method' => ['required', 'string', 'max:64'],
            'delivery_mode' => ['nullable', 'string', 'max:32'],
            'scheduled_label' => ['nullable', 'string', 'max:255'],
            'change_request' => ['nullable', 'string', 'max:255'],
            'use_loyalty' => ['nullable', 'boolean'],
            'save_change_in_wallet' => ['nullable', 'boolean'],
            'client_subtotal' => ['nullable', 'numeric', 'min:0'],
            'client_delivery_fee' => ['nullable', 'numeric', 'min:0'],
            'client_service_fee' => ['nullable', 'numeric', 'min:0'],
            'client_total' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
