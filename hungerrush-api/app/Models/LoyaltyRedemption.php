<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoyaltyRedemption extends Model
{
    use HasFactory;

    protected $fillable = [
        'restaurant_id',
        'loyalty_member_id',
        'loyalty_reward_id',
        'points_spent',
    ];

    protected function casts(): array
    {
        return [
            'points_spent' => 'integer',
        ];
    }

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function loyaltyMember(): BelongsTo
    {
        return $this->belongsTo(LoyaltyMember::class);
    }

    public function loyaltyReward(): BelongsTo
    {
        return $this->belongsTo(LoyaltyReward::class);
    }
}

