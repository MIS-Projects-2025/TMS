import { usePage } from "@inertiajs/react";
import { LayoutDashboard, Tickets, TicketPlus, Settings } from "lucide-react"; // added Settings icon
import { FileTextOutlined, UserAddOutlined } from "@ant-design/icons"; // optional AntD icon
import SidebarLink from "@/Components/sidebar/SidebarLink";
import Dropdown from "@/Components/sidebar/Dropdown";

export default function NavLinks({ isSidebarOpen }) {
    const { emp_data } = usePage().props;
    const roles = emp_data.emp_system_roles || [];

    // Check if user has dashboard access
    const canAccessDashboard = roles.some((role) =>
        ["support", "supervisor", "Senior Approver"].includes(role)
    );

    const adminLinks = [
        {
            href: route("request.type"),
            label: "Request Types",
            icon: <FileTextOutlined className="text-base" />,
        },
        {
            href: route("approvers"),
            label: "Approvers",
            icon: <UserAddOutlined className="text-base" />,
        },
        // other admin links here
    ];

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

            {canAccessDashboard && (
                <Dropdown
                    label="Admin"
                    icon={<Settings className="w-5 h-5" />}
                    links={adminLinks}
                    isSidebarOpen={isSidebarOpen}
                />
            )}
        </nav>
    );
}
