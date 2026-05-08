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
            'country' => ['nullable', 'string', 'max:120'],
            'city' => ['nullable', 'string', 'max:120'],
            'street' => ['nullable', 'string', 'max:255'],
            'postal_code' => ['nullable', 'string', 'max:32'],
            'phone_numbers' => ['nullable', 'array', 'max:5'],
            'phone_numbers.*.country_code' => ['nullable', 'string', 'max:12'],
            'phone_numbers.*.number' => ['nullable', 'string', 'max:32'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $aliases = [];

        $passwordConfirmation = $this->input('password_confirmation')
            ?? $this->input('confirm_password')
            ?? $this->input('confirmPassword')
            ?? $this->input('passwordConfirm');
        if ($passwordConfirmation !== null) {
            $aliases['password_confirmation'] = $passwordConfirmation;
        }

        $role = $this->input('role');
        if (is_string($role)) {
            $normalizedRole = strtolower(trim($role));
            $aliases['role'] = match ($normalizedRole) {
                'restaurant', 'restaurant_owner', 'restaurant owner', 'restaurant-owner', 'owner' => 'restaurant_owner',
                'restaurant_staff', 'restaurant staff', 'restaurant-staff', 'staff' => 'restaurant_staff',
                default => $normalizedRole,
            };
        }

        $restaurantName = $this->input('restaurant_name')
            ?? $this->input('restaurantName')
            ?? $this->input('business_name')
            ?? $this->input('businessName');
        if (is_string($restaurantName)) {
            $aliases['restaurant_name'] = trim($restaurantName);
        }

        $restaurantDescription = $this->input('restaurant_description')
            ?? $this->input('restaurantDescription')
            ?? $this->input('description');
        if (is_string($restaurantDescription)) {
            $aliases['restaurant_description'] = trim($restaurantDescription);
        }

        $postalCode = $this->input('postal_code')
            ?? $this->input('postalCode')
            ?? $this->input('zip')
            ?? $this->input('zipCode');
        if (is_string($postalCode)) {
            $aliases['postal_code'] = trim($postalCode);
        }

        foreach (['country', 'city', 'street'] as $field) {
            $value = $this->input($field);
            if (is_string($value)) {
                $aliases[$field] = trim($value);
            }
        }

        $phoneNumbers = $this->normalizePhoneNumbers($this->input('phone_numbers') ?? $this->input('phoneNumbers'));
        if ($phoneNumbers !== []) {
            $aliases['phone_numbers'] = $phoneNumbers;
        }

        $phone = $this->input('phone')
            ?? $this->input('phone_number')
            ?? $this->input('phoneNumber')
            ?? $this->primaryPhoneFromNumbers($phoneNumbers);
        if (is_string($phone)) {
            $normalizedPhone = $this->normalizePhone($phone);
            $aliases['phone'] = $normalizedPhone !== '' ? $normalizedPhone : null;
        }

        if ($aliases !== []) {
            $this->merge($aliases);
        }

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

    /**
     * @return array<int, array{country_code: string|null, number: string|null}>
     */
    private function normalizePhoneNumbers(mixed $phoneNumbers): array
    {
        if (!is_array($phoneNumbers)) {
            return [];
        }

        $normalized = [];

        foreach ($phoneNumbers as $phoneNumber) {
            if (is_string($phoneNumber)) {
                $phone = $this->normalizePhone($phoneNumber);
                if ($phone !== '') {
                    $normalized[] = [
                        'country_code' => null,
                        'number' => $phone,
                    ];
                }
                continue;
            }

            if (!is_array($phoneNumber)) {
                continue;
            }

            $countryCode = $phoneNumber['country_code']
                ?? $phoneNumber['countryCode']
                ?? $phoneNumber['dial_code']
                ?? $phoneNumber['dialCode']
                ?? $phoneNumber['code']
                ?? null;
            $number = $phoneNumber['number']
                ?? $phoneNumber['phone']
                ?? $phoneNumber['phone_number']
                ?? $phoneNumber['phoneNumber']
                ?? null;

            $countryCode = is_string($countryCode) ? $this->normalizePhone($countryCode) : null;
            $number = is_string($number) ? $this->normalizePhone($number) : null;

            if (($countryCode ?? '') === '' && ($number ?? '') === '') {
                continue;
            }

            $normalized[] = [
                'country_code' => $countryCode !== '' ? $countryCode : null,
                'number' => $number !== '' ? $number : null,
            ];
        }

        return $normalized;
    }

    private function normalizePhone(string $phone): string
    {
        $trimmed = trim($phone);
        $hasPlus = str_contains($trimmed, '+');
        $digits = preg_replace('/\D+/', '', $trimmed) ?? '';

        return $hasPlus && $digits !== '' ? "+{$digits}" : $digits;
    }

    /**
     * @param array<int, array{country_code: string|null, number: string|null}> $phoneNumbers
     */
    private function primaryPhoneFromNumbers(array $phoneNumbers): ?string
    {
        $firstPhone = $phoneNumbers[0] ?? null;
        if (!is_array($firstPhone)) {
            return null;
        }

        $countryCode = $firstPhone['country_code'] ?? '';
        $number = $firstPhone['number'] ?? '';

        if (!is_string($number) || $number === '') {
            return null;
        }

        return is_string($countryCode) ? "{$countryCode}{$number}" : $number;
    }
}
