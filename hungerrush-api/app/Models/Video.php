<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Video extends Model
{
    use HasFactory;

    protected $fillable = [
        'restaurant_id',
        'menu_item_id',
        'title',
        'description',
        'media_url',
        'thumbnail_url',
        'cloudflare_stream_uid',
        'duration_seconds',
        'stream_status',
        'stream_ready',
        'stream_hls_url',
        'stream_dash_url',
        'stream_preview_url',
        'status',
        'published_at',
        'moderation_status',
        'moderation_reason',
        'moderation_confidence',
        'moderation_checked_at',
    ];

    protected function casts(): array
    {
        return [
            'published_at' => 'datetime',
            'stream_ready' => 'boolean',
            'moderation_confidence' => 'float',
            'moderation_checked_at' => 'datetime',
        ];
    }

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function menuItem(): BelongsTo
    {
        return $this->belongsTo(MenuItem::class);
    }

    public function engagements(): HasMany
    {
        return $this->hasMany(VideoEngagement::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(VideoComment::class);
    }
}
