<?php

namespace App\Services;

use App\Models\Video;

class VideoStreamStatusSyncService
{
    public function __construct(
        private readonly CloudflareStreamService $cloudflareStreamService,
    ) {}

    public function syncVideo(Video $video, bool $autoPublishReadyDrafts = true): Video
    {
        if (! $video->cloudflare_stream_uid) {
            return $video;
        }

        if ($this->isRemoteModerationPending($video)) {
            return $video;
        }

        if (! $video->stream_ready) {
            $stream = $this->cloudflareStreamService->get($video->cloudflare_stream_uid);

            $video->forceFill([
                'media_url' => $stream['playback_hls_url'] ?: $video->media_url,
                'thumbnail_url' => $stream['thumbnail_url'] ?: $video->thumbnail_url,
                'stream_status' => $stream['status'] ?: $video->stream_status,
                'stream_ready' => $stream['ready_to_stream'],
                'stream_hls_url' => $stream['playback_hls_url'] ?: $video->stream_hls_url,
                'stream_dash_url' => $stream['playback_dash_url'] ?: $video->stream_dash_url,
                'stream_preview_url' => $stream['preview_url'] ?: $video->stream_preview_url,
            ]);
        }

        if ($autoPublishReadyDrafts && $this->shouldAutoPublish($video)) {
            $video->forceFill([
                'status' => 'published',
                'published_at' => $video->published_at ?: now(),
            ]);
        }

        if ($video->isDirty()) {
            $video->save();
        }

        return $video->refresh();
    }

    public function syncPendingVideos(int $limit = 25): int
    {
        $synced = 0;

        Video::query()
            ->whereNotNull('cloudflare_stream_uid')
            ->where(function ($query) {
                $query
                    ->where('stream_ready', false)
                    ->orWhere(function ($draftQuery) {
                        $draftQuery
                            ->where('status', 'draft')
                            ->where('stream_ready', true)
                            ->whereNotNull('stream_hls_url')
                            ->where('stream_hls_url', '<>', '');
                    });
            })
            ->latest()
            ->limit($limit)
            ->get()
            ->each(function (Video $video) use (&$synced) {
                try {
                    $this->syncVideo($video);
                    $synced++;
                } catch (\Throwable) {
                    // A failed Cloudflare lookup should not block feed delivery.
                }
            });

        return $synced;
    }

    private function shouldAutoPublish(Video $video): bool
    {
        return $video->status === 'draft'
            && (bool) $video->stream_ready
            && filled($video->stream_hls_url);
    }

    private function isRemoteModerationPending(Video $video): bool
    {
        return (
            strtolower(trim((string) config('services.video_processing.stream_provider', 'cloudflare'))) === 'local'
            || ! (bool) config('services.video_processing.local_probing_enabled', true)
        )
            && $video->status === 'draft'
            && ! $video->stream_ready;
    }
}
