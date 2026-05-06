<?php

namespace App\Models;

use App\Enums\UserRole;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Restaurant extends Model
{
    use HasFactory;

    protected static function booted(): void
    {
        static::created(function (Restaurant $restaurant): void {
            $restaurant->promoteOwnerToRestaurantOwnerRole();
        });

        static::updated(function (Restaurant $restaurant): void {
            if ($restaurant->wasChanged('owner_user_id')) {
                $restaurant->promoteOwnerToRestaurantOwnerRole();
            }
        });
    }

    protected $fillable = [
        'owner_user_id',
        'name',
        'description',
        'status',
        'settings',
    ];

    protected function casts(): array
    {
        return [
            'settings' => 'array',
        ];
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_user_id');
    }

    public function branches(): HasMany
    {
        return $this->hasMany(RestaurantBranch::class);
    }

    public function categories(): HasMany
    {
        return $this->hasMany(MenuCategory::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function videos(): HasMany
    {
        return $this->hasMany(Video::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function loyaltyRewards(): HasMany
    {
        return $this->hasMany(LoyaltyReward::class);
    }

    public function loyaltyMembers(): HasMany
    {
        return $this->hasMany(LoyaltyMember::class);
    }

    public function loyaltyPoints(): HasMany
    {
        return $this->hasMany(LoyaltyPoint::class);
    }

    public function loyaltyOffers(): HasMany
    {
        return $this->hasMany(LoyaltyOffer::class);
    }

    public function loyaltyTransactions(): HasMany
    {
        return $this->hasMany(LoyaltyTransaction::class);
    }

    public function conversations(): HasMany
    {
        return $this->hasMany(Conversation::class);
    }

    public function reports(): HasMany
    {
        return $this->hasMany(Report::class);
    }

    public function menuItems(): HasManyThrough
    {
        return $this->hasManyThrough(MenuItem::class, MenuCategory::class, 'restaurant_id', 'category_id');
    }

    public function follows(): HasMany
    {
        return $this->hasMany(RestaurantFollow::class);
    }

    public function followers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'restaurant_follows')->withTimestamps();
    }

    private function promoteOwnerToRestaurantOwnerRole(): void
    {
        if (!$this->owner_user_id) {
            return;
        }

        User::query()
            ->whereKey($this->owner_user_id)
            ->where('role', '!=', UserRole::RestaurantOwner->value)
            ->update([
                'role' => UserRole::RestaurantOwner->value,
            ]);
    }
}
