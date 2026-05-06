<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LoyaltyOffer extends Model
{
    use HasFactory;

    protected $fillable = [
        'restaurant_id',
        'title',
        'description',
        'required_points',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'required_points' => 'integer',
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
}
