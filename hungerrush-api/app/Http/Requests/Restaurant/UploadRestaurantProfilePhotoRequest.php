<?php

namespace App\Http\Requests\Restaurant;

use Illuminate\Foundation\Http\FormRequest;

class UploadRestaurantProfilePhotoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'photo' => [
                'required',
                'file',
                'max:5120',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if (!$this->hasFile('photo')) {
                        return;
                    }

                    $extension = strtolower((string) $this->file('photo')->getClientOriginalExtension());
                    if (!in_array($extension, ['jpg', 'jpeg', 'png', 'webp'], true)) {
                        $fail('The photo must be a JPG, JPEG, PNG, or WEBP file.');
                    }
                },
            ],
        ];
    }
}
