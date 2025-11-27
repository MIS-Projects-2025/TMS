import { useEffect, useState } from "react";
import axios from "axios";

import SidebarLink from "@/Components/sidebar/SidebarLink";
import { usePage } from "@inertiajs/react";
import { LayoutDashboard, Tickets, TicketPlus } from "lucide-react";
import { Table } from "antd";

export default function NavLinks({ isSidebarOpen }) {
    const { emp_data } = usePage().props;
    console.log(emp_data.emp_system_role);

    return (
        <nav
            className="flex flex-col flex-grow space-y-1 overflow-y-auto"
            style={{ scrollbarWidth: "none" }}
        >
            {(emp_data.emp_system_role === "support" ||
                emp_data.emp_system_role === "supervisor") && (
                <SidebarLink
                    href={route("dashboard")}
                    label="Dashboard"
                    icon={<LayoutDashboard className="w-5 h-5" />}
                    isSidebarOpen={isSidebarOpen}
                />
            )}

            <SidebarLink
                href={route("tickets")}
                label="Generate Ticket"
                icon={<TicketPlus className="w-5 h-5" />}
                isSidebarOpen={isSidebarOpen}
            />
            <SidebarLink
                href={route("tickets.datatable")}
                label="Tickets Table"
                icon={<Tickets className="w-5 h-5" />}
                isSidebarOpen={isSidebarOpen}
            />
        </nav>
    );
}
