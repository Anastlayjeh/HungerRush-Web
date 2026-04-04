<?php

namespace App\Http\Controllers\Api\V1\Restaurant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Restaurant\UploadMenuImagesRequest;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class MenuImageUploadController extends Controller
{
    public function store(UploadMenuImagesRequest $request)
    {
        $destination = public_path('uploads/menu-items');
        if (!File::exists($destination)) {
            File::makeDirectory($destination, 0755, true);
        }

        $baseUrl = rtrim($request->getSchemeAndHttpHost(), '/');
        $urls = [];
        foreach ($request->file('images', []) as $image) {
            $extension = strtolower($image->getClientOriginalExtension() ?: 'jpg');
            $filename = (string) Str::uuid() . '.' . $extension;
            $image->move($destination, $filename);
            $urls[] = "{$baseUrl}/uploads/menu-items/{$filename}";
        }

        return $this->successResponse(
            ['urls' => $urls],
            message: 'Menu images uploaded successfully.',
            status: 201
        );
    }
}
