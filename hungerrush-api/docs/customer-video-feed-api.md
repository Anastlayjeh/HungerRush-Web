# Customer Video Feed API

These endpoints support a mobile feed that streams approved videos from Cloudflare through the Laravel API.

## Feed

```http
GET /api/v1/customer/videos/feed
Authorization: Bearer <token>
```

Query params:

- `page` optional
- `per_page` optional, max `30`
- `q` optional search text
- `debug` optional, returns recommendation reasons

Response shape:

```json
{
  "data": [
    {
      "id": 12,
      "title": "Smash Burger close up",
      "description": "Fresh off the grill",
      "media_url": "https://customer-.../manifest/video.m3u8",
      "thumbnail_url": "https://customer-.../thumbnail.jpg",
      "stream_uid": "cf-stream-uid",
      "duration_seconds": 34,
      "stream_status": "ready",
      "stream_ready": true,
      "stream_hls_url": "https://customer-.../manifest/video.m3u8",
      "stream_dash_url": "https://customer-.../manifest/video.mpd",
      "stream_preview_url": "https://customer-.../watch",
      "restaurant": {
        "id": 4,
        "name": "Burger House",
        "description": "House specials"
      },
      "menu_item": {
        "id": 9,
        "name": "Smash Burger",
        "price": 22
      },
      "stats": {
        "views_count": 120,
        "likes_count": 24,
        "shares_count": 3,
        "saves_count": 10,
        "comments_count": 5
      },
      "viewer_state": {
        "is_liked": false,
        "is_saved": true,
        "is_following_restaurant": true,
        "has_commented": false,
        "view_count": 1
      },
      "published_at": "2026-05-03T10:00:00.000000Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 15,
    "total": 87
  }
}
```

## Search Tracking

```http
POST /api/v1/customer/videos/searches
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "query": "sushi",
  "context": "video_feed"
}
```

Call this when the user submits a meaningful search, not on every keystroke.

## Video Engagements

Track a feed interaction:

```http
POST /api/v1/customer/videos/{video}/engagements
```

```json
{
  "type": "view"
}
```

Allowed types:

- `view`
- `like`
- `share`
- `save`

Remove a `like` or `save`:

```http
DELETE /api/v1/customer/videos/{video}/engagements/like
DELETE /api/v1/customer/videos/{video}/engagements/save
```

## Comments

List:

```http
GET /api/v1/customer/videos/{video}/comments
```

Create:

```http
POST /api/v1/customer/videos/{video}/comments
```

```json
{
  "body": "This looks amazing."
}
```

## Restaurant Follows

Follow:

```http
POST /api/v1/customer/restaurants/{restaurant}/follow
```

Unfollow:

```http
DELETE /api/v1/customer/restaurants/{restaurant}/follow
```

List followed restaurants:

```http
GET /api/v1/customer/restaurants/following
```

## Recommendation Signals

The feed ranking currently considers:

- recent order restaurants
- recent ordered menu items
- recent search terms
- followed restaurants
- previous likes, saves, and shares
- previous comments
- recent video views as a repeat penalty
- overall popularity
- freshness
- diversity across restaurants

## Flutter Notes

- Use `stream_hls_url` as the primary playback URL in the feed.
- Use `thumbnail_url` for the preview tile or poster frame.
- Send a `view` engagement when the video is meaningfully shown, not on every rebuild.
- Send `like`, `save`, `share`, `comment`, and `follow` actions immediately so the next feed request learns from them.
