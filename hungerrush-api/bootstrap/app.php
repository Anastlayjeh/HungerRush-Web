<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        //
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (ValidationException $e) {
            return response()->json([
                'data' => null,
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
                'code' => 'validation_failed',
            ], 422);
        });

        $exceptions->render(function (AuthenticationException $e) {
            return response()->json([
                'data' => null,
                'message' => 'Unauthenticated.',
                'errors' => [],
                'code' => 'unauthenticated',
            ], 401);
        });

        $exceptions->render(function (HttpExceptionInterface $e) {
            return response()->json([
                'data' => null,
                'message' => $e->getMessage() ?: 'HTTP error.',
                'errors' => [],
                'code' => 'http_error',
            ], $e->getStatusCode());
        });
    })->create();
