import React from "react";
import { Link, usePage } from "@inertiajs/react";

const SidebarLink = ({
    href,
    label,
    icon,
    notifications = 0,
    isSidebarOpen,
}) => {
    const { url } = usePage();
    const isActive = url === new URL(href, window.location.origin).pathname;

    // Determine theme
    const theme = localStorage.getItem("theme") === "dark" ? "dark" : "light";

    // Force dark mode classes
    const baseText = "text-white"; // always readable
    const hoverBg = "hover:bg-gray-700";
    const activeBg = "bg-gray-700";
    const activeText = "text-white"; // for active link

    return (
        <Link
            href={href}
            className={`relative flex items-center px-4 py-2 transition-colors duration-150 rounded-md
    ${isActive ? `${activeBg} ${activeText}` : `${hoverBg} ${baseText}`}`}
            title={!isSidebarOpen ? label : ""} // tooltip on hover if collapsed
        >
            {/* Icon always visible */}
            <span className="w-6 h-6">{icon}</span>

            {/* Label (only if sidebar is expanded) */}
            {isSidebarOpen && <p className="ml-2">{label}</p>}

            {/* Notifications */}
            {notifications > 0 && (
                <span
                    className={`ml-auto text-xs px-2 py-1 rounded-md text-white bg-red-600 ${
                        !isSidebarOpen ? "absolute right-2" : ""
                    }`}
                >
                    {notifications > 99 ? "99+" : notifications}
                </span>
            )}
        </Link>
    );
};

export default SidebarLink;
