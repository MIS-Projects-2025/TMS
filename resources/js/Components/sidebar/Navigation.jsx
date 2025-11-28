import { usePage } from "@inertiajs/react";
import { LayoutDashboard, Tickets, TicketPlus } from "lucide-react";
import SidebarLink from "@/Components/sidebar/SidebarLink";

export default function NavLinks({ isSidebarOpen }) {
    const { emp_data } = usePage().props;
    const roles = emp_data.emp_system_roles || [];

    // Check if user has dashboard access
    const canAccessDashboard = roles.some(role =>
        ["support", "supervisor", "Senior Approver"].includes(role)
    );

    return (
        <nav
            className="flex flex-col flex-grow space-y-1 overflow-y-auto"
            style={{ scrollbarWidth: "none" }}
        >
            {canAccessDashboard && (
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
