<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $this->repairBrokenTable('reviews', fn () => $this->createReviewsTable());
        $this->repairBrokenTable('loyalty_rewards', fn () => $this->createLoyaltyRewardsTable());
        $this->repairBrokenTable('loyalty_members', fn () => $this->createLoyaltyMembersTable());
        $this->repairBrokenTable('loyalty_redemptions', fn () => $this->createLoyaltyRedemptionsTable());
    }

    public function down(): void
    {
        // Intentionally no-op. This migration repairs broken local tables only
        // when MySQL reports that the table exists without a storage engine.
    }

    private function repairBrokenTable(string $table, callable $create): void
    {
        if (!$this->needsRepair($table)) {
            return;
        }

        $this->discardTablespace($table);
        DB::statement("DROP TABLE IF EXISTS `{$table}`");
        $this->removeOrphanTablespaceFile($table);
        $create();
    }

    private function discardTablespace(string $table): void
    {
        try {
            DB::statement("ALTER TABLE `{$table}` DISCARD TABLESPACE");
        } catch (Throwable) {
            // Some broken tables are too damaged for ALTER TABLE, and some
            // environments already removed the table shell. The following DROP
            // and CREATE are still safe to attempt.
        }
    }

    private function needsRepair(string $table): bool
    {
        $driver = DB::connection()->getDriverName();
        if ($driver !== 'mysql') {
            return !Schema::hasTable($table);
        }

        $status = DB::selectOne('SHOW TABLE STATUS WHERE Name = ?', [$table]);
        if ($status === null) {
            return true;
        }

        return empty($status->Engine);
    }

    private function removeOrphanTablespaceFile(string $table): void
    {
        try {
            $dataDir = DB::selectOne('SELECT @@datadir AS data_dir')?->data_dir;
            $database = DB::selectOne('SELECT DATABASE() AS database_name')?->database_name;
            if (!is_string($dataDir) || !is_string($database) || $dataDir === '' || $database === '') {
                return;
            }

            $databaseDir = rtrim($dataDir, "\\/") . DIRECTORY_SEPARATOR . $database;
            $file = $databaseDir . DIRECTORY_SEPARATOR . "{$table}.ibd";
            $realDatabaseDir = realpath($databaseDir);
            if ($realDatabaseDir === false || !is_file($file)) {
                return;
            }

            $realFile = realpath($file);
            if ($realFile === false || !str_starts_with($realFile, $realDatabaseDir . DIRECTORY_SEPARATOR)) {
                return;
            }

            @unlink($realFile);
        } catch (Throwable) {
            // If the database service prevents file cleanup, the following
            // CREATE will fail clearly and the operator can remove the orphan.
        }
    }

    private function createReviewsTable(): void
    {
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('restaurant_id');
            $table->unsignedBigInteger('customer_id');
            $table->unsignedBigInteger('order_id')->nullable();
            $table->unsignedTinyInteger('rating');
            $table->text('comment')->nullable();
            $table->text('reply')->nullable();
            $table->unsignedBigInteger('replied_by')->nullable();
            $table->timestamp('replied_at')->nullable();
            $table->timestamps();

            $table->index(['restaurant_id', 'rating', 'created_at']);
            $table->index('customer_id');
            $table->index('order_id');
            $table->index('replied_by');
        });
    }

    private function createLoyaltyRewardsTable(): void
    {
        Schema::create('loyalty_rewards', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('restaurant_id');
            $table->string('name');
            $table->text('description')->nullable();
            $table->unsignedInteger('points_required')->default(0);
            $table->enum('reward_type', ['discount', 'free_item', 'free_delivery', 'cashback', 'custom'])->default('custom');
            $table->enum('status', ['active', 'draft', 'archived'])->default('draft');
            $table->unsignedInteger('usage_count')->default(0);
            $table->timestamps();

            $table->index(['restaurant_id', 'status', 'created_at']);
        });
    }

    private function createLoyaltyMembersTable(): void
    {
        Schema::create('loyalty_members', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('restaurant_id');
            $table->unsignedBigInteger('customer_id');
            $table->unsignedInteger('points')->default(0);
            $table->unsignedInteger('orders_count')->default(0);
            $table->string('tier')->default('bronze');
            $table->timestamp('last_activity_at')->nullable();
            $table->timestamps();

            $table->unique(['restaurant_id', 'customer_id']);
            $table->index(['restaurant_id', 'points']);
        });
    }

    private function createLoyaltyRedemptionsTable(): void
    {
        Schema::create('loyalty_redemptions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('restaurant_id');
            $table->unsignedBigInteger('loyalty_member_id');
            $table->unsignedBigInteger('loyalty_reward_id')->nullable();
            $table->unsignedInteger('points_spent')->default(0);
            $table->timestamps();

            $table->index(['restaurant_id', 'created_at']);
            $table->index('loyalty_member_id');
            $table->index('loyalty_reward_id');
        });
    }
};
