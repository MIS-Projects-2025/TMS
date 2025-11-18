<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TicketRequestTypesSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('ticket_request_types')->truncate(); // optional: clear table first

        $types = [
            ['category' => 'Network', 'name' => 'Telephone', 'has_data' => false],
            ['category' => 'Network', 'name' => 'CCTV', 'has_data' => false],
            ['category' => 'Network', 'name' => 'Biometrics', 'has_data' => false],
            ['category' => 'Network', 'name' => 'Access Door', 'has_data' => false],
            ['category' => 'Network', 'name' => 'Sound System', 'has_data' => false],
            ['category' => 'Network', 'name' => 'Internet/Wi-Fi Connection', 'has_data' => false],

            ['category' => 'Mail', 'name' => 'Password Reset', 'has_data' => false],
            ['category' => 'Mail', 'name' => 'New Account', 'has_data' => false],

            ['category' => 'Hardware', 'name' => 'Desktop', 'has_data' => true],
            ['category' => 'Hardware', 'name' => 'Laptop', 'has_data' => true],
            ['category' => 'Hardware', 'name' => 'Server', 'has_data' => true],
            ['category' => 'Hardware', 'name' => 'E-Learn Thin Client', 'has_data' => true],

            ['category' => 'Software', 'name' => 'Portals/Apps', 'has_data' => false],
            ['category' => 'Software', 'name' => 'MS Office', 'has_data' => false],
            ['category' => 'Software', 'name' => 'SharePoint', 'has_data' => false],
            ['category' => 'Software', 'name' => 'Zoom Meeting/MS Teams', 'has_data' => false],
            ['category' => 'Software', 'name' => 'WhatsApp, Viber', 'has_data' => false],

            ['category' => 'Printer', 'name' => 'Consigned Printer', 'has_data' => true],
            ['category' => 'Printer', 'name' => 'Honeywell Printer', 'has_data' => true],
            ['category' => 'Printer', 'name' => 'Zebra Printer', 'has_data' => true],

            ['category' => 'Promis', 'name' => 'Account (Password Reset, Error)', 'has_data' => false],
            ['category' => 'Promis', 'name' => 'Promis Terminal', 'has_data' => true],

            ['category' => 'Other Services', 'name' => 'Assist Vendor or Supplier', 'has_data' => false],
            ['category' => 'Other Services', 'name' => 'Virus Scanning and Transfer', 'has_data' => false],
            ['category' => 'Other Services', 'name' => 'Others', 'has_data' => false],
        ];

        DB::table('ticket_request_types')->insert($types);
    }
}
