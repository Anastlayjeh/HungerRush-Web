<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('carts')) {
            return;
        }

        $this->dropUniqueIndex('carts_customer_id_unique');
        $this->createUniqueIndex(['customer_id', 'restaurant_id'], 'carts_customer_restaurant_unique');
    }

    public function down(): void
    {
        if (!Schema::hasTable('carts')) {
            return;
        }

        $this->dropUniqueIndex('carts_customer_restaurant_unique');
        $this->createUniqueIndex(['customer_id'], 'carts_customer_id_unique');
    }

    /**
     * Schema::dropUnique handles fresh Laravel migrations; raw fallbacks cover
     * older environments where the previous migration tried the wrong SQL.
     */
    private function dropUniqueIndex(string $indexName): void
    {
        try {
            Schema::table('carts', function (Blueprint $table) use ($indexName) {
                $table->dropUnique($indexName);
            });
            return;
        } catch (\Throwable) {
            // Continue with driver-specific fallbacks.
        }

        try {
            match (DB::getDriverName()) {
                'mysql', 'mariadb' => DB::statement("ALTER TABLE carts DROP INDEX {$indexName}"),
                'pgsql' => DB::statement("DROP INDEX IF EXISTS {$indexName}"),
                default => DB::statement("DROP INDEX IF EXISTS {$indexName}"),
            };
        } catch (\Throwable) {
            // Index is already absent or the driver does not support this form.
        }
    }

    private function createUniqueIndex(array $columns, string $indexName): void
    {
        try {
            Schema::table('carts', function (Blueprint $table) use ($columns, $indexName) {
                $table->unique($columns, $indexName);
            });
        } catch (\Throwable) {
            // Index already exists.
        }
    }
};
