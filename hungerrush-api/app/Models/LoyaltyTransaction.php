<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoyaltyTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'restaurant_id',
        'order_id',
        'offer_id',
        'points',
        'type',
        'description',
    ];

    protected function casts(): array
    {
        return [
            'points' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function offer(): BelongsTo
    {
        return $this->belongsTo(LoyaltyOffer::class, 'offer_id');
    }
}
