<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RestaurantBranch extends Model
{
    protected $fillable = ['restaurant_id', 'name', 'address', 'phone', 'latitude', 'longitude', 'open_hours'];

    protected function casts(): array
    {
        return [
            'open_hours' => 'array',
        ];
    }

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }
}
