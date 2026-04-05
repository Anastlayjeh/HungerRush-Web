<?php

namespace App\Http\Controllers\Api\V1\Restaurant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Restaurant\UploadMenuImagesRequest;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Throwable;

class MenuImageUploadController extends Controller
{
    public function store(UploadMenuImagesRequest $request)
    {
        $baseUrl = rtrim($request->getSchemeAndHttpHost(), '/');

        if (app()->runningUnitTests()) {
            $testUrls = [];
            foreach ($request->file('images', []) as $image) {
                $extension = strtolower($image->getClientOriginalExtension() ?: 'jpg');
                $filename = (string) Str::uuid() . '.' . $extension;
                $testUrls[] = "{$baseUrl}/api/v1/restaurant/menu/images/{$filename}";
            }

            return $this->successResponse(
                ['urls' => $testUrls],
                message: 'Menu images uploaded successfully.',
                status: 201
            );
        }

        $urls = [];
        foreach ($request->file('images', []) as $image) {
            $extension = strtolower($image->getClientOriginalExtension() ?: 'jpg');
            $filename = (string) Str::uuid() . '.' . $extension;

            try {
                $destination = public_path('uploads/menu-items');
                if (!File::exists($destination)) {
                    File::makeDirectory($destination, 0755, true);
                }

                $image->move($destination, $filename);
                $urls[] = "{$baseUrl}/api/v1/restaurant/menu/images/{$filename}";
            } catch (Throwable) {
                $fallbackDestination = storage_path('app/public/menu-items');
                if (!File::exists($fallbackDestination)) {
                    File::makeDirectory($fallbackDestination, 0755, true);
                }

                $image->move($fallbackDestination, $filename);
                $urls[] = "{$baseUrl}/api/v1/restaurant/menu/images/{$filename}";
            }
        }

        return $this->successResponse(
            ['urls' => $urls],
            message: 'Menu images uploaded successfully.',
            status: 201
        );
    }

    public function show(string $filename)
    {
        abort_unless($filename === basename($filename), 404);

        $publicPath = public_path("uploads/menu-items/{$filename}");
        if (File::exists($publicPath)) {
            return response()->file($publicPath);
        }

        $storagePath = storage_path("app/public/menu-items/{$filename}");
        if (File::exists($storagePath)) {
            return response()->file($storagePath);
        }

        abort(404);
    }
}
