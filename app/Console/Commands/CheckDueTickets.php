<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\TicketService;
use Illuminate\Support\Facades\Log;

class CheckDueTickets extends Command
{
    protected $signature = 'tickets:check-due';
    protected $description = 'Check for overdue tickets and update status to On Hold';

    protected $ticketService;

    public function __construct(TicketService $ticketService)
    {
        parent::__construct();
        $this->ticketService = $ticketService;
    }

   public function handle()
{
    $this->info('Checking for overdue tickets...');

    try {
        $result = $this->ticketService->processAutoCloseTickets();

        if ($result['processed'] === 0) {
            $this->info('No overdue tickets found.');
        } else {
            $this->info("Updated {$result['processed']} overdue tickets and their associated projects to On Hold status.");
        }
        
        Log::info("Overdue ticket checker completed: {$result['processed']} tickets processed. Failed: {$result['failed']}.");
        if (!empty($result['failed_tickets'])) {
            Log::warning('Failed to process tickets: ' . implode(', ', $result['failed_tickets']));
        }
    } catch (\Exception $e) {
        $this->error('Error processing overdue tickets: ' . $e->getMessage());
        Log::error('Overdue ticket checker error: ' . $e->getMessage());
        
        return Command::FAILURE;
    }

    return Command::SUCCESS;
}

}