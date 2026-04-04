<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LoyaltyMember extends Model
{
    use HasFactory;

    protected $fillable = [
        'restaurant_id',
        'customer_id',
        'points',
        'orders_count',
        'tier',
        'last_activity_at',
    ];

    protected function casts(): array
    {
        return [
            'points' => 'integer',
            'orders_count' => 'integer',
            'last_activity_at' => 'datetime',
        ];
    }

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function redemptions(): HasMany
    {
        return $this->hasMany(LoyaltyRedemption::class);
    }
}

