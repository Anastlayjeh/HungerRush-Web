<?php

namespace App\Models;

use App\Enums\UserRole;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable(['name', 'email', 'phone', 'password', 'role', 'status', 'last_login_at'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'role' => UserRole::class,
            'last_login_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function ownedRestaurants(): HasMany
    {
        return $this->hasMany(Restaurant::class, 'owner_user_id');
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'customer_id');
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class, 'customer_id');
    }

    public function reviewReplies(): HasMany
    {
        return $this->hasMany(Review::class, 'replied_by');
    }

    public function videoEngagements(): HasMany
    {
        return $this->hasMany(VideoEngagement::class);
    }

    public function loyaltyMemberships(): HasMany
    {
        return $this->hasMany(LoyaltyMember::class, 'customer_id');
    }
}
