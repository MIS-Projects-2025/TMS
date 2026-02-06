import { useState, useEffect, useMemo } from "react";
import { usePage, Link } from "@inertiajs/react";

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

    // Check if any child is active
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
                className={`relative flex items-center justify-between w-full px-4 py-2 transition-all duration-150 rounded-md ${
                    parentActive
                        ? "bg-gray-100 dark:bg-gray-800 font-semibold"
                        : "hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
                style={{
                    borderLeft: parentActive
                        ? `4px solid ${activeColor}`
                        : "4px solid transparent",
                }}
            >
                <div className="flex items-center space-x-2">
                    {icon && (
                        <span className="w-6 h-6 text-gray-700 dark:text-gray-200 flex items-center justify-center">
                            {icon}
                        </span>
                    )}
                    {isSidebarOpen && (
                        <span className="ml-2 text-gray-700 dark:text-gray-200">
                            {label}
                        </span>
                    )}
                </div>

                {/* Arrow & notification */}
                {isSidebarOpen && (
                    <div className="flex items-center space-x-2">
                        {notification && typeof notification === "number" && (
                            <span className="bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                                {notification > 99 ? "99+" : notification}
                            </span>
                        )}
                        <span className="flex items-center justify-center text-gray-700 dark:text-gray-200">
                            {open ? (
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth="1.5"
                                    stroke="currentColor"
                                    className="w-6 h-6"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="m4.5 15.75 7.5-7.5 7.5 7.5"
                                    />
                                </svg>
                            ) : (
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth="1.5"
                                    stroke="currentColor"
                                    className="w-6 h-6"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="m19.5 8.25-7.5 7.5-7.5-7.5"
                                    />
                                </svg>
                            )}
                        </span>
                    </div>
                )}
            </button>

            {/* Child links */}
            {isSidebarOpen && open && (
                <div className="space-y-1 mt-1">
                    {links.map((link, idx) => {
                        const active = isActiveLink(link.href);
                        return (
                            <Link
                                key={idx}
                                href={link.href}
                                className={`flex items-center justify-between w-full pl-8 pr-3 py-2 rounded transition-all ${
                                    active
                                        ? "bg-gray-100 dark:bg-gray-800 font-semibold"
                                        : "hover:bg-gray-200 dark:hover:bg-gray-700"
                                }`}
                                style={{
                                    borderLeft: active
                                        ? `4px solid ${activeColor}`
                                        : "4px solid transparent",
                                }}
                            >
                                <div className="flex items-center space-x-2">
                                    {link.icon ? (
                                        <span className="w-5 h-5 text-gray-700 dark:text-gray-200 flex items-center justify-center">
                                            {link.icon}
                                        </span>
                                    ) : (
                                        <span className="w-4 h-4"></span>
                                    )}
                                    <span className="text-gray-700 dark:text-gray-200">
                                        {link.label}
                                    </span>
                                </div>
                                {link.notification &&
                                    typeof link.notification === "number" && (
                                        <span className="bg-red-600 text-white text-xs px-1.5 py-0.5 rounded-md">
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
