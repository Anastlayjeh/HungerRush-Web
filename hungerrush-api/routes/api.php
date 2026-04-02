<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\Customer\CartController;
use App\Http\Controllers\Api\V1\Customer\OrderController as CustomerOrderController;
use App\Http\Controllers\Api\V1\Customer\RestaurantController as CustomerRestaurantController;
use App\Http\Controllers\Api\V1\Restaurant\MenuCategoryController;
use App\Http\Controllers\Api\V1\Restaurant\MenuItemController;
use App\Http\Controllers\Api\V1\Restaurant\OrderController;
use App\Http\Controllers\Api\V1\Restaurant\ProfileController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::prefix('auth')->group(function () {
        Route::post('/register', [AuthController::class, 'register']);
        Route::post('/login', [AuthController::class, 'login']);
        Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
        Route::post('/reset-password', [AuthController::class, 'resetPassword']);

        Route::middleware('auth:sanctum')->group(function () {
            Route::post('/logout', [AuthController::class, 'logout']);
            Route::get('/me', [AuthController::class, 'me']);
        });
    });

    Route::prefix('restaurant')->middleware('auth:sanctum')->group(function () {
        Route::get('/profile', [ProfileController::class, 'show']);
        Route::patch('/profile', [ProfileController::class, 'update']);

        Route::get('/menu/categories', [MenuCategoryController::class, 'index']);
        Route::post('/menu/categories', [MenuCategoryController::class, 'store']);
        Route::patch('/menu/categories/{menuCategory}', [MenuCategoryController::class, 'update']);
        Route::delete('/menu/categories/{menuCategory}', [MenuCategoryController::class, 'destroy']);

        Route::get('/menu/items', [MenuItemController::class, 'index']);
        Route::post('/menu/items', [MenuItemController::class, 'store']);
        Route::patch('/menu/items/{menuItem}', [MenuItemController::class, 'update']);
        Route::patch('/menu/items/{menuItem}/availability', [MenuItemController::class, 'updateAvailability']);
        Route::delete('/menu/items/{menuItem}', [MenuItemController::class, 'destroy']);

        Route::get('/orders', [OrderController::class, 'index']);
        Route::get('/orders/{order}', [OrderController::class, 'show']);
        Route::patch('/orders/{order}/status', [OrderController::class, 'updateStatus']);
    });

    Route::prefix('customer')->middleware('auth:sanctum')->group(function () {
        Route::get('/restaurants', [CustomerRestaurantController::class, 'index']);
        Route::get('/restaurants/{restaurant}', [CustomerRestaurantController::class, 'show']);
        Route::get('/restaurants/{restaurant}/menu', [CustomerRestaurantController::class, 'menu']);

        Route::get('/cart', [CartController::class, 'show']);
        Route::post('/cart/items', [CartController::class, 'addItem']);
        Route::patch('/cart/items/{cartItem}', [CartController::class, 'updateItem']);
        Route::delete('/cart/items/{cartItem}', [CartController::class, 'removeItem']);

        Route::post('/orders', [CustomerOrderController::class, 'place']);
        Route::get('/orders/history', [CustomerOrderController::class, 'history']);
        Route::get('/orders/{order}', [CustomerOrderController::class, 'show']);
    });
});
