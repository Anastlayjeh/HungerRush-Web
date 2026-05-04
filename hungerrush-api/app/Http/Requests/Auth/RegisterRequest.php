<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:32', 'unique:users,phone'],
            'password' => ['required', 'confirmed', Password::defaults()],
            'role' => ['required', 'in:customer,restaurant_owner,restaurant_staff,driver,admin'],
            'restaurant_name' => ['nullable', 'string', 'max:255'],
            'restaurant_description' => ['nullable', 'string', 'max:4000'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $email = $this->input('email');
        if (is_string($email)) {
            $this->merge([
                'email' => strtolower(trim($email)),
            ]);
        }

        $phone = $this->input('phone');
        if (is_string($phone)) {
            $this->merge([
                'phone' => trim($phone),
            ]);
        }
    }
}
