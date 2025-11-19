<?php

namespace App\Repositories;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection;
use App\Models\Ticket;
use App\Models\TicketLogs;

class TicketRepository
{

    public function getComputerNamesByType(string $type): Collection
    {
        return DB::connection('inventory')
            ->table('mis_table')
            ->select('id', 'hostname as name')
            ->whereRaw('LOWER(category) = ?', [strtolower($type)])
            ->orderBy('hostname')
            ->get();
    }

    public function getDesktopNames(): Collection
    {
        return $this->getComputerNamesByType('Desktop');
    }

    public function getLaptopNames(): Collection
    {
        return $this->getComputerNamesByType('Laptop');
    }

    public function getServerNames(): Collection
    {
        return $this->getComputerNamesByType('Server');
    }
    public function getELearnThinClientNames(): Collection
    {
        return $this->getComputerNamesByType('e learn thin client');
    }



    public function getPrinterNamesByType(string $type): Collection
    {
        return DB::connection('inventory')
            ->table('printer_table')
            ->select('id', 'printer_name as name')
            ->whereRaw('LOWER(category) = ?', [strtolower($type)])
            ->whereRaw('LOWER(status) = ?', [strtolower('active')])
            ->whereRaw('LOWER(printer_name) != ?', [strtolower('n/a')])
            ->orderBy('printer_name')
            ->get();
    }

    public function getConsignedPrinterNames(): Collection
    {
        return $this->getPrinterNamesByType('Consigned Printer');
    }
    public function getHoneywellPrinterNames(): Collection
    {
        return $this->getPrinterNamesByType('Honeywell Printer');
    }
    public function getZebraPrinterNames(): Collection
    {
        return $this->getPrinterNamesByType('Zebra Printer');
    }




    public function getTerminalNames(string $type): Collection
    {
        return DB::connection('inventory')
            ->table('terminal_table')
            ->select('id', 'hostname as name')
            ->whereRaw('LOWER(status) = ?', ['active'])
            ->whereRaw('LOWER(category) = ?', [strtolower($type)])
            ->orderBy('hostname')
            ->get();
    }
    public function getPromisTerminalNames(): Collection
    {
        return $this->getTerminalNames('Promis Terminal');
    }



    public function generateTicketNumber(): string
    {
        $year = date('Y');
        $prefix = "TKTSPRT-{$year}-";

        $lastTicket = Ticket::where('ticket_id', 'like', "{$prefix}%")
            ->orderBy('ticket_id', 'desc')
            ->first();

        $newNumber = $lastTicket
            ? ((int) substr($lastTicket->ticket_id, -3)) + 1
            : 1;

        return $prefix . str_pad($newNumber, 3, '0', STR_PAD_LEFT);
    }
    public function createTicket(array $ticketData, array $employeeData): array
    {
        return DB::transaction(function () use ($ticketData, $employeeData) {
            // Generate ticket ID
            $ticketId = $this->generateTicketNumber();

            // Prepare main ticket data
            $mainTicketData = [
                'ticket_id' => $ticketId,
                'employid' => $employeeData['emp_id'],
                'empname' => $employeeData['emp_name'],
                'department' => $employeeData['emp_dept'],
                'prodline' => $employeeData['emp_prodline'],
                'station' => $employeeData['emp_station'],
                'type_of_request' => $ticketData['request_type'],
                'request_option' => $ticketData['request_option'],
                'details' => $ticketData['request_option'],
                'item_name' => $ticketData['item_name'],
                'details' => $ticketData['details'],
                'status' => 1,
                'created_at' => now(),
            ];

            // Save to main tickets table
            $ticket = Ticket::create($mainTicketData);

            // Create log entry
            $this->createTicketLog($ticket->id, $ticketId, [
                'action_type' => 'CREATED',
                'action_by' => $employeeData['emp_id'],
                'remarks' => 'Ticket created by user',
                'metadata' => [
                    'form_data' => $ticketData,
                    'employee_data' => $employeeData
                ]
            ]);

            return [
                'ticket' => $ticket,
                'ticket_id' => $ticketId
            ];
        });
    }
    public function createTicketLog(int $ticketPrimaryId, string $ticketId, array $logData): void
    {
        TicketLogs::create([
            'ticket_id' => $ticketId,
            'action_type' => $logData['action_type'],
            'action_by' => $logData['action_by'],
            'action_at' => now(),
            'remarks' => $logData['remarks'],
            'metadata' => $logData['metadata'] ?? null,
        ]);
    }
}
