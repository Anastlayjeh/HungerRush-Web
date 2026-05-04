<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('videos', function (Blueprint $table) {
            $table->string('cloudflare_stream_uid', 32)->nullable()->after('thumbnail_url');
            $table->unsignedInteger('duration_seconds')->nullable()->after('cloudflare_stream_uid');
            $table->string('stream_status', 32)->nullable()->after('duration_seconds');
            $table->boolean('stream_ready')->default(false)->after('stream_status');
            $table->string('stream_hls_url')->nullable()->after('stream_ready');
            $table->string('stream_dash_url')->nullable()->after('stream_hls_url');
            $table->string('stream_preview_url')->nullable()->after('stream_dash_url');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('videos', function (Blueprint $table) {
            $table->dropColumn([
                'cloudflare_stream_uid',
                'duration_seconds',
                'stream_status',
                'stream_ready',
                'stream_hls_url',
                'stream_dash_url',
                'stream_preview_url',
            ]);
        });
    }
};
