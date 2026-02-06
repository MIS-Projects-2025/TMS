import React from "react";
import { Link, usePage } from "@inertiajs/react";
import { Badge } from "antd";

const SidebarLink = ({
    href,
    label,
    icon,
    notifications = 0,
    isSidebarOpen,
    activeColor = "#1890ff", // Ant Design primary color by default
}) => {
    const { url } = usePage();
    const isActive = url === new URL(href, window.location.origin).pathname;

    return (
        <Link
            href={href}
            className={`relative flex items-center px-4 py-2 rounded-md transition-all duration-150
                ${isActive ? "bg-gray-100 dark:bg-gray-800 font-semibold" : "hover:bg-gray-200 dark:hover:bg-gray-700"}
            `}
            title={!isSidebarOpen ? label : ""}
            style={{
                borderLeft: isActive
                    ? `4px solid ${activeColor}`
                    : "4px solid transparent",
            }}
        >
            {/* Icon */}
            <span className="w-6 h-6 text-gray-700 dark:text-gray-200">
                {icon}
            </span>

            {/* Label */}
            {isSidebarOpen && (
                <p className="ml-3 text-gray-700 dark:text-gray-200">{label}</p>
            )}

            {/* Notifications using Ant Design Badge */}
            {notifications > 0 && (
                <Badge
                    count={notifications > 99 ? "99+" : notifications}
                    className={`ml-auto ${!isSidebarOpen ? "absolute right-2 top-1/2 -translate-y-1/2" : ""}`}
                    size="small"
                    style={{ backgroundColor: "#ff4d4f" }} // red color
                />
            )}
        </Link>
    );
};

export default SidebarLink;
