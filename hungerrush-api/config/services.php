<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'cloudflare_stream' => [
        'account_id' => env('CLOUDFLARE_STREAM_ACCOUNT_ID'),
        'api_token' => env('CLOUDFLARE_STREAM_API_TOKEN'),
        'customer_subdomain' => env('CLOUDFLARE_STREAM_CUSTOMER_SUBDOMAIN'),
        'timeout_seconds' => (int) env('CLOUDFLARE_STREAM_TIMEOUT_SECONDS', 180),
    ],

    'hugging_face' => [
        'base_url' => env('HUGGING_FACE_BASE_URL', 'https://router.huggingface.co/hf-inference/models'),
        'api_token' => env('HUGGING_FACE_API_TOKEN', env('HF_TOKEN')),
        'model' => env('HUGGING_FACE_MODEL', 'google/vit-base-patch16-224'),
        'food_keywords' => array_filter(array_map('trim', explode(',', (string) env('HUGGING_FACE_FOOD_KEYWORDS', 'food,pizza,burger,cheeseburger,hotdog,sandwich,taco,burrito,sushi,pasta,noodle,ramen,spaghetti,steak,salad,soup,cake,donut,ice cream,omelet,bagel,pretzel,waffle,restaurant meal')))),
        'context_keywords' => array_filter(array_map('trim', explode(',', (string) env('HUGGING_FACE_CONTEXT_KEYWORDS', 'plate,dish,meal,restaurant,kitchen,cafeteria,dining,table,tray,buffet')))),
        'top_k' => (int) env('HUGGING_FACE_TOP_K', 8),
        'strong_match_min_score' => (float) env('HUGGING_FACE_STRONG_MATCH_MIN_SCORE', 0.2),
        'context_match_min_score' => (float) env('HUGGING_FACE_CONTEXT_MATCH_MIN_SCORE', 0.15),
        'context_min_matches' => (int) env('HUGGING_FACE_CONTEXT_MIN_MATCHES', 2),
        'context_min_combined_score' => (float) env('HUGGING_FACE_CONTEXT_MIN_COMBINED_SCORE', 0.45),
        'min_food_frame_ratio' => (float) env('HUGGING_FACE_MIN_FOOD_FRAME_RATIO', 0.6),
        'timeout_seconds' => (int) env('HUGGING_FACE_TIMEOUT_SECONDS', 60),
    ],

    'video_processing' => [
        'stream_provider' => strtolower((string) env('VIDEO_STREAM_PROVIDER', 'cloudflare')),
        'local_probing_enabled' => filter_var(env('VIDEO_LOCAL_PROBING_ENABLED', true), FILTER_VALIDATE_BOOLEAN),
        'ffmpeg_binary' => env('VIDEO_FFMPEG_BINARY', 'ffmpeg'),
        'ffprobe_binary' => env('VIDEO_FFPROBE_BINARY', 'ffprobe'),
        'max_duration_seconds' => (int) env('VIDEO_MAX_DURATION_SECONDS', 180),
        'frame_interval_seconds' => (int) env('VIDEO_FRAME_INTERVAL_SECONDS', 3),
    ],

    'video_worker' => [
        'url' => env('VIDEO_WORKER_URL'),
        'token' => env('VIDEO_WORKER_TOKEN'),
        'callback_url' => env('VIDEO_WORKER_CALLBACK_URL', 'https://hungerrush.site/api/v1/internal/videos/moderation-callback'),
        'timeout_seconds' => (int) env('VIDEO_WORKER_TIMEOUT_SECONDS', 15),
    ],

];
