

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
        Schema::create('ticketing_support_workflow', function (Blueprint $table) {
            $table->id('ID');
            $table->string('TICKET_ID', 50);
            $table->string('ACTION_TYPE', 50);
            $table->string('ACTION_BY', 50);
            $table->timestamp('ACTION_AT')->useCurrent();
            $table->text('REMARKS')->nullable();
            $table->json('METADATA')->nullable();

            // Indexes
            $table->index('TICKET_ID');
            $table->index('ACTION_TYPE');
            $table->index('ACTION_AT');

            // Foreign key constraint
            $table->foreign('TICKET_ID')
                ->references('TICKET_ID')
                ->on('ticketing_support')
                ->onDelete('cascade')
                ->onUpdate('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('tms')->dropIfExists('ticketing_support_workflow');
    }
};
