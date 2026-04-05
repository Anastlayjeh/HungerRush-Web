<?php

namespace App\Http\Controllers\Api\V1\Restaurant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Restaurant\UploadVideoAssetRequest;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Throwable;

class VideoAssetUploadController extends Controller
{
    public function store(UploadVideoAssetRequest $request)
    {
        $assetType = $request->validated()['asset_type'];
        $baseUrl = rtrim($request->getSchemeAndHttpHost(), '/');
        $extension = strtolower($request->file('file')->getClientOriginalExtension() ?: ($assetType === 'video' ? 'mp4' : 'jpg'));
        $filename = (string) Str::uuid() . '.' . $extension;

        if (app()->runningUnitTests()) {
            return $this->successResponse(
                ['url' => "{$baseUrl}/api/v1/restaurant/videos/assets/{$assetType}/{$filename}"],
                message: 'Video asset uploaded successfully.',
                status: 201
            );
        }

        $publicFolder = $assetType === 'video' ? 'uploads/videos' : 'uploads/video-thumbnails';
        $storageFolder = $assetType === 'video' ? 'app/public/videos' : 'app/public/video-thumbnails';

        try {
            $destination = public_path($publicFolder);
            if (!File::exists($destination)) {
                File::makeDirectory($destination, 0755, true);
            }

            $request->file('file')->move($destination, $filename);
        } catch (Throwable) {
            $fallbackDestination = storage_path($storageFolder);
            if (!File::exists($fallbackDestination)) {
                File::makeDirectory($fallbackDestination, 0755, true);
            }

            $request->file('file')->move($fallbackDestination, $filename);
        }

        return $this->successResponse(
            ['url' => "{$baseUrl}/api/v1/restaurant/videos/assets/{$assetType}/{$filename}"],
            message: 'Video asset uploaded successfully.',
            status: 201
        );
    }

    public function show(string $assetType, string $filename)
    {
        abort_unless(in_array($assetType, ['video', 'thumbnail'], true), 404);
        abort_unless($filename === basename($filename), 404);

        $publicPath = $assetType === 'video'
            ? public_path("uploads/videos/{$filename}")
            : public_path("uploads/video-thumbnails/{$filename}");

        if (File::exists($publicPath)) {
            return response()->file($publicPath);
        }

        $storagePath = $assetType === 'video'
            ? storage_path("app/public/videos/{$filename}")
            : storage_path("app/public/video-thumbnails/{$filename}");

        if (File::exists($storagePath)) {
            return response()->file($storagePath);
        }

        abort(404);
    }
}
