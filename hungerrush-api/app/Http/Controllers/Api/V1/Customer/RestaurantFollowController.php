<?php

namespace App\Http\Controllers\Api\V1\Customer;

use App\Http\Controllers\Controller;
use App\Http\Resources\RestaurantResource;
use App\Models\Restaurant;
use App\Models\RestaurantFollow;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class RestaurantFollowController extends Controller
{
    public function index()
    {
        if (!$this->tableIsQueryable('restaurant_follows')) {
            return $this->successResponse([], [
                'current_page' => 1,
                'per_page' => 20,
                'total' => 0,
            ]);
        }

        $query = Restaurant::query()
            ->whereHas('follows', fn ($builder) => $builder->where('user_id', auth()->id()))
            ->with(['owner:id,name,email,phone', 'branches']);

        $this->applyRestaurantAggregatesToQuery($query);

        $restaurants = $query->latest()->paginate(20);

        return $this->successResponse(RestaurantResource::collection($restaurants->items()), [
            'current_page' => $restaurants->currentPage(),
            'per_page' => $restaurants->perPage(),
            'total' => $restaurants->total(),
        ]);
    }

    public function store(Restaurant $restaurant)
    {
        if (!$this->tableIsQueryable('restaurant_follows')) {
            return $this->errorResponse(
                'Following restaurants is not available yet.',
                ['follow' => ['Restaurant follow storage is not configured.']],
                'follow_not_ready',
                503
            );
        }

        RestaurantFollow::firstOrCreate([
            'restaurant_id' => $restaurant->id,
            'user_id' => auth()->id(),
        ]);

        return $this->successResponse([
            'restaurant_id' => $restaurant->id,
            'is_following' => true,
        ], message: 'Restaurant followed successfully.', status: 201);
    }

    public function destroy(Restaurant $restaurant)
    {
        if (!$this->tableIsQueryable('restaurant_follows')) {
            return $this->errorResponse(
                'Following restaurants is not available yet.',
                ['follow' => ['Restaurant follow storage is not configured.']],
                'follow_not_ready',
                503
            );
        }

        RestaurantFollow::query()
            ->where('restaurant_id', $restaurant->id)
            ->where('user_id', auth()->id())
            ->delete();

        return $this->successResponse([
            'restaurant_id' => $restaurant->id,
            'is_following' => false,
        ], message: 'Restaurant unfollowed successfully.');
    }

    private function applyRestaurantAggregatesToQuery(Builder $query): void
    {
        if ($this->tableIsQueryable('orders')) {
            $query->withCount('orders');
        }

        if ($this->tableIsQueryable('reviews')) {
            $query->withCount('reviews')->withAvg('reviews', 'rating');
        }

        if ($this->tableIsQueryable('menu_items') && $this->tableIsQueryable('menu_categories')) {
            $query->withCount('menuItems');
        }

        if ($this->tableIsQueryable('restaurant_follows')) {
            $query->withCount('follows');
        }
    }

    private function tableIsQueryable(string $table): bool
    {
        if (!Schema::hasTable($table)) {
            return false;
        }

        try {
            DB::table($table)->limit(1)->get();

            return true;
        } catch (\Throwable) {
            return false;
        }
    }
}
