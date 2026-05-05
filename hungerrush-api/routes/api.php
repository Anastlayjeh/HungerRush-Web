<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Api\V1\ConversationController;
use App\Http\Controllers\Api\V1\Customer\CartController;
use App\Http\Controllers\Api\V1\Customer\OrderController as CustomerOrderController;
use App\Http\Controllers\Api\V1\Customer\ProfileController as CustomerProfileController;
use App\Http\Controllers\Api\V1\Customer\RestaurantFollowController;
use App\Http\Controllers\Api\V1\Customer\RestaurantController as CustomerRestaurantController;
use App\Http\Controllers\Api\V1\Customer\VideoFeedController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\ReportController;
use App\Http\Controllers\Api\V1\Restaurant\AnalyticsController;
use App\Http\Controllers\Api\V1\Restaurant\LoyaltyController;
use App\Http\Controllers\Api\V1\Restaurant\MenuCategoryController;
use App\Http\Controllers\Api\V1\Restaurant\MenuImageUploadController;
use App\Http\Controllers\Api\V1\Restaurant\MenuItemController;
use App\Http\Controllers\Api\V1\Restaurant\OrderController;
use App\Http\Controllers\Api\V1\Restaurant\ProfileController;
use App\Http\Controllers\Api\V1\Restaurant\RestaurantProfilePhotoUploadController;
use App\Http\Controllers\Api\V1\Restaurant\ReviewController;
use App\Http\Controllers\Api\V1\Restaurant\SettingsController;
use App\Http\Controllers\Api\V1\Restaurant\VideoAssetUploadController;
use App\Http\Controllers\Api\V1\Restaurant\VideoController;
use App\Http\Controllers\Api\V1\SupportRequestController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/google', [AuthController::class, 'google']);

Route::prefix('v1')->group(function () {
    Route::get('/restaurant/menu/images/{filename}', [MenuImageUploadController::class, 'show'])
        ->where('filename', '[A-Za-z0-9\-\._]+');
    Route::get('/restaurant/videos/assets/{assetType}/{filename}', [VideoAssetUploadController::class, 'show'])
        ->where([
            'assetType' => 'video|thumbnail',
            'filename' => '[A-Za-z0-9\-\._]+',
        ]);
    Route::get('/restaurant/profile-photos/{filename}', [RestaurantProfilePhotoUploadController::class, 'show'])
        ->where('filename', '[A-Za-z0-9\-\._]+');

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

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/conversations', [ConversationController::class, 'index']);
        Route::post('/conversations', [ConversationController::class, 'store']);
        Route::get('/conversations/{conversation}', [ConversationController::class, 'show']);
        Route::post('/conversations/{conversation}/messages', [ConversationController::class, 'sendMessage']);
        Route::patch('/conversations/{conversation}/read', [ConversationController::class, 'markRead']);

        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::patch('/notifications/read-all', [NotificationController::class, 'markAllRead']);
        Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markRead']);

        Route::post('/support-requests', [SupportRequestController::class, 'store']);
        Route::post('/reports', [ReportController::class, 'store']);

        Route::prefix('admin')->group(function () {
            Route::get('/dashboard', [AdminDashboardController::class, 'dashboard']);
            Route::get('/users', [AdminDashboardController::class, 'users']);
            Route::get('/restaurants', [AdminDashboardController::class, 'restaurants']);
            Route::get('/restaurant-registrations', [AdminDashboardController::class, 'restaurantRegistrations']);
            Route::patch('/restaurant-registrations/{registration}', [AdminDashboardController::class, 'updateRestaurantRegistration']);
            Route::get('/videos', [AdminDashboardController::class, 'videos']);
            Route::patch('/videos/{video}', [AdminDashboardController::class, 'updateVideo']);
            Route::delete('/videos/{video}', [AdminDashboardController::class, 'deleteVideo']);
            Route::get('/orders', [AdminDashboardController::class, 'orders']);
            Route::patch('/orders/{order}', [AdminDashboardController::class, 'updateOrder']);
            Route::get('/reports', [AdminDashboardController::class, 'reports']);
            Route::patch('/reports/{report}', [AdminDashboardController::class, 'updateReport']);
        });
    });

    Route::prefix('restaurant')->middleware('auth:sanctum')->group(function () {
        Route::get('/profile', [ProfileController::class, 'show']);
        Route::patch('/profile', [ProfileController::class, 'update']);
        Route::get('/settings', [SettingsController::class, 'show']);
        Route::patch('/settings', [SettingsController::class, 'update']);
        Route::post('/profile-photo/upload', [RestaurantProfilePhotoUploadController::class, 'store']);

        Route::get('/menu/categories', [MenuCategoryController::class, 'index']);
        Route::post('/menu/categories', [MenuCategoryController::class, 'store']);
        Route::patch('/menu/categories/{menuCategory}', [MenuCategoryController::class, 'update']);
        Route::delete('/menu/categories/{menuCategory}', [MenuCategoryController::class, 'destroy']);

        Route::get('/menu/items', [MenuItemController::class, 'index']);
        Route::post('/menu/items', [MenuItemController::class, 'store']);
        Route::patch('/menu/items/{menuItem}', [MenuItemController::class, 'update']);
        Route::patch('/menu/items/{menuItem}/availability', [MenuItemController::class, 'updateAvailability']);
        Route::delete('/menu/items/{menuItem}', [MenuItemController::class, 'destroy']);
        Route::post('/menu/images/upload', [MenuImageUploadController::class, 'store']);

        Route::get('/orders', [OrderController::class, 'index']);
        Route::get('/orders/{order}', [OrderController::class, 'show']);
        Route::post('/orders/quick', [OrderController::class, 'storeQuickOrder']);
        Route::patch('/orders/{order}/status', [OrderController::class, 'updateStatus']);

        Route::get('/videos', [VideoController::class, 'index']);
        Route::post('/videos', [VideoController::class, 'store']);
        Route::patch('/videos/{video}', [VideoController::class, 'update']);
        Route::delete('/videos/{video}', [VideoController::class, 'destroy']);
        Route::post('/videos/assets/upload', [VideoAssetUploadController::class, 'store']);

        Route::get('/reviews/summary', [ReviewController::class, 'summary']);
        Route::get('/reviews', [ReviewController::class, 'index']);
        Route::patch('/reviews/{review}/reply', [ReviewController::class, 'reply']);

        Route::get('/loyalty/overview', [LoyaltyController::class, 'overview']);
        Route::post('/loyalty/rewards', [LoyaltyController::class, 'storeReward']);
        Route::patch('/loyalty/rewards/{loyaltyReward}', [LoyaltyController::class, 'updateReward']);

        Route::get('/analytics', [AnalyticsController::class, 'overview']);
    });

    Route::prefix('customer')->middleware('auth:sanctum')->group(function () {
        Route::get('/profile', [CustomerProfileController::class, 'show']);
        Route::patch('/profile', [CustomerProfileController::class, 'update']);

        Route::get('/videos/feed', [VideoFeedController::class, 'index']);
        Route::post('/videos/searches', [VideoFeedController::class, 'storeSearch']);
        Route::post('/videos/{video}/engagements', [VideoFeedController::class, 'storeEngagement']);
        Route::delete('/videos/{video}/engagements/{type}', [VideoFeedController::class, 'destroyEngagement'])
            ->where('type', 'like|save');
        Route::get('/videos/{video}/comments', [VideoFeedController::class, 'comments']);
        Route::post('/videos/{video}/comments', [VideoFeedController::class, 'storeComment']);

        Route::get('/restaurants/following', [RestaurantFollowController::class, 'index']);
        Route::post('/restaurants/{restaurant}/follow', [RestaurantFollowController::class, 'store']);
        Route::delete('/restaurants/{restaurant}/follow', [RestaurantFollowController::class, 'destroy']);

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
