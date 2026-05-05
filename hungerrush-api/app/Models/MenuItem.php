<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MenuItem extends Model
{
    use HasFactory;

    public const COMMISSION_RATE = 0.10;

    protected $fillable = ['category_id', 'name', 'description', 'ingredients', 'image_urls', 'price', 'is_available', 'prep_time'];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'is_available' => 'boolean',
            'image_urls' => 'array',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(MenuCategory::class, 'category_id');
    }

    public function videos(): HasMany
    {
        return $this->hasMany(Video::class);
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function cartItems(): HasMany
    {
        return $this->hasMany(CartItem::class);
    }

    public static function applyCommissionToBasePrice(float|int|string $basePrice): float
    {
        $normalizedBasePrice = max((float) $basePrice, 0);

        return round($normalizedBasePrice * (1 + self::COMMISSION_RATE), 2);
    }

    public static function basePriceFromFinalPrice(float|int|string $finalPrice): float
    {
        $normalizedFinalPrice = max((float) $finalPrice, 0);
        $divisor = 1 + self::COMMISSION_RATE;

        if ($divisor <= 0) {
            return $normalizedFinalPrice;
        }

        return round($normalizedFinalPrice / $divisor, 2);
    }

    public static function commissionAmountFromFinalPrice(float|int|string $finalPrice): float
    {
        $normalizedFinalPrice = max((float) $finalPrice, 0);
        $basePrice = self::basePriceFromFinalPrice($normalizedFinalPrice);

        return round(max($normalizedFinalPrice - $basePrice, 0), 2);
    }
}
