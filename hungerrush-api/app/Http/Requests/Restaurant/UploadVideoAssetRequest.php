<?php

namespace App\Http\Requests\Restaurant;

use Illuminate\Foundation\Http\FormRequest;

class UploadVideoAssetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $assetType = $this->input('asset_type');

        return [
            'asset_type' => ['required', 'in:video,thumbnail'],
            'file' => array_filter([
                'required',
                'file',
                $assetType === 'video'
                    ? 'mimes:mp4,mov,webm,m4v,avi,mpeg,mpg'
                    : 'mimes:jpg,jpeg,png,webp',
                $assetType === 'video' ? 'max:102400' : 'max:5120',
            ]),
        ];
    }
}
