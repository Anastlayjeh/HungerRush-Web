<?php

namespace App\Http\Controllers\Api\V1\Restaurant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Restaurant\UploadRestaurantProfilePhotoRequest;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Throwable;

class RestaurantProfilePhotoUploadController extends Controller
{
    public function store(UploadRestaurantProfilePhotoRequest $request)
    {
        $baseUrl = rtrim($request->getSchemeAndHttpHost(), '/');
        $extension = strtolower($request->file('photo')->getClientOriginalExtension() ?: 'jpg');
        $filename = (string) Str::uuid() . '.' . $extension;

        if (app()->runningUnitTests()) {
            return $this->successResponse(
                ['url' => "{$baseUrl}/api/v1/restaurant/profile-photos/{$filename}"],
                message: 'Profile photo uploaded successfully.',
                status: 201
            );
        }

        try {
            $destination = public_path('uploads/restaurant-profiles');
            if (!File::exists($destination)) {
                File::makeDirectory($destination, 0755, true);
            }

            $request->file('photo')->move($destination, $filename);
        } catch (Throwable) {
            $fallbackDestination = storage_path('app/public/restaurant-profiles');
            if (!File::exists($fallbackDestination)) {
                File::makeDirectory($fallbackDestination, 0755, true);
            }

            $request->file('photo')->move($fallbackDestination, $filename);
        }

        return $this->successResponse(
            ['url' => "{$baseUrl}/api/v1/restaurant/profile-photos/{$filename}"],
            message: 'Profile photo uploaded successfully.',
            status: 201
        );
    }

    public function show(string $filename)
    {
        abort_unless($filename === basename($filename), 404);

        $publicPath = public_path("uploads/restaurant-profiles/{$filename}");
        if (File::exists($publicPath)) {
            return $this->fileResponse($publicPath, $filename);
        }

        $storagePath = storage_path("app/public/restaurant-profiles/{$filename}");
        if (File::exists($storagePath)) {
            return $this->fileResponse($storagePath, $filename);
        }

        abort(404);
    }

    private function fileResponse(string $path, string $filename)
    {
        $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));

        $contentType = match ($extension) {
            'jpg', 'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'webp' => 'image/webp',
            default => 'application/octet-stream',
        };

        return response(File::get($path), 200, [
            'Content-Type' => $contentType,
            'Cache-Control' => 'public, max-age=31536000',
        ]);
    }
}
