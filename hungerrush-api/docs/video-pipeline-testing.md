# Video Pipeline Testing

This project can now run the full restaurant video pipeline locally:

1. `ffprobe` reads the video duration.
2. `ffmpeg` extracts frames every few seconds.
3. Hugging Face classifies the extracted frames with `google/vit-base-patch16-224`.
4. Laravel applies the food-decision rule.
5. Approved videos are uploaded to Cloudflare Stream.
6. A `videos` table row is created with the Stream metadata.

## Prerequisites

Set the required values in `hungerrush-api/.env`:

- `CLOUDFLARE_STREAM_ACCOUNT_ID`
- `CLOUDFLARE_STREAM_API_TOKEN`
- `CLOUDFLARE_STREAM_CUSTOMER_SUBDOMAIN`
- `HUGGING_FACE_API_TOKEN`
- `HUGGING_FACE_MODEL`
- `VIDEO_FFMPEG_BINARY`
- `VIDEO_FFPROBE_BINARY`

Run migrations:

```powershell
php artisan migrate
```

## One-command smoke test

Run the full production pipeline against a local file:

```powershell
php artisan videos:test-pipeline "C:\path\to\food-video.mp4" --title="Manual Smoke Test"
```

Useful options:

```powershell
php artisan videos:test-pipeline "C:\path\to\food-video.mp4" `
  --title="Published Test Video" `
  --description="Uploaded from the Laravel CLI smoke test" `
  --owner-email="owner@example.com" `
  --restaurant-name="My Test Restaurant" `
  --status=published
```

Delete the DB row and Cloudflare asset after the test:

```powershell
php artisan videos:test-pipeline "C:\path\to\food-video.mp4" --cleanup
```

## Moderation rule

The current rule is intentionally stricter than plain keyword matching:

- Strong food labels like `pizza`, `burger`, `cheeseburger`, `hotdog`, `sushi`, `pasta`, and similar terms pass a frame immediately.
- Weak context labels like `plate`, `dish`, `restaurant`, or `table` do not pass on their own.
- Context labels only count when multiple matching labels appear with enough combined confidence.
- The video must still satisfy the overall frame-ratio threshold and the 3-minute duration limit.

## API path

The web dashboard and any Flutter client should upload the file to:

```text
POST /api/v1/restaurant/videos
```

Multipart fields:

- `title` required
- `video` required
- `description` optional
- `menu_item_id` optional
- `status` optional

The API stores only Cloudflare Stream playback data after moderation succeeds.
