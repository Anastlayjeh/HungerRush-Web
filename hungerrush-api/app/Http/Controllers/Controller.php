<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

abstract class Controller
{
    use AuthorizesRequests;

    protected function successResponse(mixed $data, ?array $meta = null, ?string $message = null, int $status = 200): JsonResponse
    {
        return response()->json([
            'data' => $data,
            'meta' => $meta,
            'message' => $message,
        ], $status);
    }

    protected function errorResponse(string $message, array $errors = [], string $code = 'unprocessable_request', int $status = 422): JsonResponse
    {
        return response()->json([
            'data' => null,
            'message' => $message,
            'errors' => $errors,
            'code' => $code,
        ], $status);
    }
}
