<?php

namespace App\Constants;

class TicketRequestTypes
{
    public const REQUEST_TYPES = [
        'Network' => [
            'Telephone',
            'CCTV',
            'Biometrics',
            'Access Door',
            'Sound System',
            'Internet/Wi-Fi Connection',
        ],
        'Mail' => [
            'Password Reset',
            'New Account',
        ],
        'Hardware' => [
            'Desktop',
            'Laptop',
            'Server',
            'E-Learn Thin Client',
        ],
        'Software' => [
            'Portals/Apps',
            'MS Office',
            'SharePoint',
            'Zoom Meeting/MS Teams',
            'WhatsApp, Viber',
        ],
        'Printer' => [
            'Consigned Printer',
            'Honeywell Printer',
            'Zebra Printer',
        ],
        'Promis' => [
            'Account (Password Reset, Error)',
            'Promis Terminal',
        ],
        'Other Services' => [
            'Assist Vendor or Supplier',
            'Virus Scanning and Transfer',
            'Others',
        ],

    ];

    public static function getRequestTypes(): array
    {
        return self::REQUEST_TYPES;
    }
}
