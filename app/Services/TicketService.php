<?php

namespace App\Services;

use App\Repositories\TicketRepository;
use App\Repositories\TicketRequestTypeRepository;

class TicketService
{
    protected TicketRepository $ticketRepository;
    protected TicketRequestTypeRepository $requestTypeRepository;

    public function __construct(
        TicketRepository $ticketRepository,
        TicketRequestTypeRepository $requestTypeRepository
    ) {
        $this->ticketRepository = $ticketRepository;
        $this->requestTypeRepository = $requestTypeRepository;
    }

    /**
     * Get form data for ticket creation
     *
     * @return array
     */
    public function getTicketFormData(): array
    {
        return [
            'request_types' => $this->requestTypeRepository->getRequestTypesForForm(),
            'hardware_options' => [
                'Desktop' => $this->ticketRepository->getDesktopNames(),
                'Laptop' => $this->ticketRepository->getLaptopNames(),
                'Server' => $this->ticketRepository->getServerNames(),
                'E-Learn Thin Client' => $this->ticketRepository->getELearnThinClientNames(),
            ],
            'printer_options' => [
                'Consigned Printer' => $this->ticketRepository->getConsignedPrinterNames(),
                'Honeywell Printer' => $this->ticketRepository->getHoneywellPrinterNames(),
                'Zebra Printer' => $this->ticketRepository->getZebraPrinterNames(),
            ],
            'promis_options' => [
                'Promis Terminal' => $this->ticketRepository->getPromisTerminalNames(),
            ]
        ];
    }
}
