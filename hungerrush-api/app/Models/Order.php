<?php

namespace App\Models;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_id',
        'restaurant_id',
        'branch_id',
        'subtotal',
        'fees',
        'total',
        'status',
        'payment_status',
        'is_quick_order',
        'delivery_address',
        'delivery_address_label',
        'delivery_phone',
        'order_notes',
        'payment_method',
        'delivery_mode',
        'scheduled_label',
        'change_request',
        'use_loyalty',
        'save_change_in_wallet',
    ];

    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'fees' => 'decimal:2',
            'total' => 'decimal:2',
            'status' => OrderStatus::class,
            'payment_status' => PaymentStatus::class,
            'is_quick_order' => 'boolean',
            'delivery_address' => 'array',
            'use_loyalty' => 'boolean',
            'save_change_in_wallet' => 'boolean',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(RestaurantBranch::class, 'branch_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function statusHistory(): HasMany
    {
        return $this->hasMany(OrderStatusHistory::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function loyaltyTransactions(): HasMany
    {
        return $this->hasMany(LoyaltyTransaction::class);
    }
}
