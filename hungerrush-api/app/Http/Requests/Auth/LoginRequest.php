<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => ['nullable', 'email', 'required_without:phone'],
            'phone' => ['nullable', 'string', 'required_without:email'],
            'password' => ['required', 'string'],
            'role' => ['nullable', 'in:customer,restaurant_owner,restaurant_staff,driver,admin'],
            'device_name' => ['nullable', 'string', 'max:120'],
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
