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
        Schema::create('ticket_remarks_history', function (Blueprint $table) {
            $table->id(); // Auto-incrementing primary key (will be 'id' in database)
            $table->unsignedBigInteger('TICKET_ID'); // TICKET_ID
            $table->string('REMARK_TYPE'); // REMARK_TYPE
            $table->text('REMARK_TEXT'); // REMARK_TEXT
            $table->string('OLD_STATUS')->nullable(); // OLD_STATUS
            $table->string('NEW_STATUS')->nullable(); // NEW_STATUS
            $table->timestamps(); // CREATED_AT and UPDATED_AT

            // Index for better performance - use consistent column names
            $table->index('TICKET_ID');
            $table->index('REMARK_TYPE'); // Changed from 'remark_type' to 'REMARK_TYPE'
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('tms')->dropIfExists('ticket_remarks_history');
    }
};
