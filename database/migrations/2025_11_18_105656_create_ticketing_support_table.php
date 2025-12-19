

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
        Schema::create('ticketing_support', function (Blueprint $table) {
            $table->id('ID');
            $table->string('TICKET_ID', 50)->unique();
            $table->string('EMPLOYID', 50);
            $table->string('EMPNAME', 255);
            $table->string('DEPARTMENT', 100)->nullable();
            $table->string('PRODLINE', 100)->nullable();
            $table->string('STATION', 100)->nullable();
            $table->string('TYPE_OF_REQUEST', 100)->nullable();
            $table->text('DETAILS')->nullable();
            $table->string('STATUS', 50)->default('OPEN');
            $table->tinyInteger('RATING')->nullable()->unsigned();
            $table->timestamp('created_at')->useCurrent();
            $table->string('HANDLED_BY', 50)->nullable();
            $table->timestamp('HANDLED_AT')->nullable();
            $table->string('CLOSED_BY', 50)->nullable();
            $table->timestamp('CLOSED_AT')->nullable();
            $table->timestamp('DELETED_AT')->nullable();
            $table->string('DELETED_BY', 50)->nullable();

            // Indexes
            $table->index('TICKET_ID');
            $table->index('EMPLOYID');
            $table->index('STATUS');
            $table->index('created_at');
            $table->index('DELETED_AT');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('tms')->dropIfExists('ticketing_support');
    }
};
