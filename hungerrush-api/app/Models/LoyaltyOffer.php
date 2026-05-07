<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\MenuItem;

class LoyaltyOffer extends Model
{
    use HasFactory;

    protected $fillable = [
        'restaurant_id',
        'title',
        'description',
        'conditions',
        'expires_at',
        'required_points',
        'reward_type',
        'menu_item_id',
        'discount_percentage',
        'discount_amount',
        'free_item_quantity',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'required_points' => 'integer',
            'discount_percentage' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'free_item_quantity' => 'integer',
            'expires_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(LoyaltyTransaction::class, 'offer_id');
    }

    public function menuItem(): BelongsTo
    {
        return $this->belongsTo(MenuItem::class, 'menu_item_id');
    }
}
