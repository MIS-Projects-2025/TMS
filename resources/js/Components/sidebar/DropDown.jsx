import { useState, useEffect, useMemo } from "react";
import { usePage, Link } from "@inertiajs/react";
import { ChevronDown, ChevronRight, ChevronUp } from "lucide-react";

export default function Dropdown({
    label,
    icon = null,
    links = [],
    notification = null,
    isSidebarOpen = false,
    activeColor = "#1890ff", // primary color
}) {
    const { url } = usePage();

    const normalizePath = (href) => {
        try {
            return new URL(href, window.location.origin).pathname;
        } catch {
            return href;
        }
    };

    const isActiveLink = (href) => url === normalizePath(href);

    const hasActiveChild = useMemo(
        () => links.some((link) => isActiveLink(link.href)),
        [url, links],
    );

    const [open, setOpen] = useState(false);

    useEffect(() => {
        setOpen(isSidebarOpen && hasActiveChild);
    }, [isSidebarOpen, hasActiveChild]);

    const parentActive = hasActiveChild;

    return (
        <div className="relative w-full">
            {/* Parent button */}
            <button
                onClick={() => setOpen(!open)}
                className={`relative flex items-center justify-between w-full px-4 py-2 rounded-md transition-colors duration-200 ${
                    parentActive
                        ? "bg-gray-800 font-semibold"
                        : "hover:bg-gray-700"
                }`}
                style={{
                    borderLeft: parentActive
                        ? `4px solid ${activeColor}`
                        : "4px solid transparent",
                }}
            >
                <div className="flex items-center space-x-3">
                    {icon && <span className="text-gray-200">{icon}</span>}
                    {isSidebarOpen && (
                        <span className="text-sm text-gray-200">{label}</span>
                    )}
                </div>

                {isSidebarOpen && (
                    <div className="flex items-center space-x-2">
                        {notification && typeof notification === "number" && (
                            <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                {notification > 99 ? "99+" : notification}
                            </span>
                        )}
                        <span className="text-gray-200">
                            {open ? (
                                <ChevronDown className="w-4 h-4" />
                            ) : (
                                <ChevronRight className="w-4 h-4" />
                            )}
                        </span>
                    </div>
                )}
            </button>

            {/* Child links */}
            {isSidebarOpen && open && (
                <div className="relative mt-1 space-y-1 pl-4">
                    {/* vertical line */}
                    <div className="absolute left-2 top-2 bottom-2 w-[2px] bg-gray-600 rounded" />

                    {links.map((link, idx) => {
                        const active = isActiveLink(link.href);
                        return (
                            <Link
                                key={idx}
                                href={link.href}
                                className={`relative flex items-center justify-start w-full pl-6 pr-4 py-2 rounded-md transition-colors duration-200 ${
                                    active
                                        ? "bg-gray-800 font-semibold"
                                        : "hover:bg-gray-700"
                                }`}
                            >
                                {/* Dot indicator on the vertical line */}
                                <span
                                    className="absolute left-[3px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 transition-colors duration-200"
                                    style={{
                                        backgroundColor: active
                                            ? activeColor
                                            : "#4B5563",
                                        borderColor: active
                                            ? activeColor
                                            : "#6B7280",
                                    }}
                                />

                                {link.icon && (
                                    <span className="mr-2 text-gray-200">
                                        {link.icon}
                                    </span>
                                )}
                                <span className="text-xs text-gray-200">
                                    {link.label}
                                </span>
                                {link.notification &&
                                    typeof link.notification === "number" && (
                                        <span className="ml-auto bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
                                            {link.notification > 99
                                                ? "99+"
                                                : link.notification}
                                        </span>
                                    )}
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
