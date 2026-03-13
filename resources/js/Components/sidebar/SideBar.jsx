import { Link, usePage, router } from "@inertiajs/react";
import { useState, useContext, useEffect } from "react";
import Navigation from "@/Components/sidebar/Navigation";
import ThemeToggler from "@/Components/sidebar/ThemeToggler";
import { ThemeContext } from "../ThemeContext";
// import NotificationBell from "@/Components/NotificationBell";
import {
    Menu,
    X,
    PanelLeftClose,
    PanelLeftOpen,
    LogOut,
    User,
} from "lucide-react";

export default function Sidebar() {
    const { display_name, emp_data } = usePage().props;
    const { theme, toggleTheme } = useContext(ThemeContext);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true); // desktop toggle
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false); // mobile toggle
    const [mounted, setMounted] = useState(false);

    // Handle mounted state for theme
    useEffect(() => setMounted(true), []);

    // Logout function
    const logout = () => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = route("logout"); // Laravel handles SSO redirect
    };

    const formattedAppName = display_name
        ?.split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

    if (!mounted) return null;

    return (
        <div className="flex">
            {/* Mobile Hamburger */}
            <button
                className="fixed z-[60] p-2 rounded top-4 left-4 md:hidden bg-gray-800 text-white hover:bg-gray-700 transition-colors"
                onClick={() => setIsMobileSidebarOpen(true)}
            >
                <Menu className="w-5 h-5" />
            </button>

            {/* Overlay (mobile only) */}
            {isMobileSidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
                    onClick={() => setIsMobileSidebarOpen(false)}
                />
            )}

            {/* Sidebar - Fixed dark colors */}
            <aside
                className={`
                    fixed md:relative top-0 left-0 z-50 transition-all duration-300
                    ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:!translate-x-0"}
                    flex flex-col min-h-screen
                    ${isSidebarOpen ? "w-72" : "w-20"}
                    bg-gray-900 text-white
                    shadow-2xl md:shadow-none
                `}
            >
                {/* Desktop Toggle Button */}
                <button
                    className="
                        hidden md:flex
                        absolute -right-3 top-1/2 -translate-y-1/2
                        w-8 h-8
                        items-center justify-center
                        rounded-full
                        bg-gray-800
                        text-white
                        shadow-lg
                        border border-gray-700
                        hover:bg-gray-700 hover:scale-105
                        transition-all duration-200
                        z-10
                    "
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                >
                    {isSidebarOpen ? (
                        <PanelLeftClose className="w-4 h-4" />
                    ) : (
                        <PanelLeftOpen className="w-4 h-4" />
                    )}
                </button>

                {/* Mobile Close Button */}
                <button
                    className="absolute top-4 right-4 md:hidden text-gray-300 hover:text-white"
                    onClick={() => setIsMobileSidebarOpen(false)}
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Logo Section */}
                <div
                    className={`flex items-center h-16 ${isSidebarOpen ? "px-6" : "px-4"} border-b border-gray-800`}
                >
                    <Link
                        href={route("dashboard")}
                        className={`flex items-center gap-2 font-bold text-xl ${
                            !isSidebarOpen && "justify-center w-full"
                        }`}
                    >
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="1.5"
                                stroke="currentColor"
                                className="w-5 h-5 text-white"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M9 3H7.5A2.25 2.25 0 0 0 5.25 5.25V7A2.25 2.25 0 0 1 3 9.25v1.5A2.25 2.25 0 0 1 5.25 13V14.75A2.25 2.25 0 0 0 7.5 17h1.5M15 3h1.5A2.25 2.25 0 0 1 18.75 5.25V7A2.25 2.25 0 0 0 21 9.25v1.5A2.25 2.25 0 0 0 18.75 13V14.75A2.25 2.25 0 0 1 16.5 17H15"
                                />
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M9 3h6v18H9z"
                                />
                            </svg>
                        </div>
                        {isSidebarOpen && (
                            <span className="text-white">
                                {formattedAppName}
                            </span>
                        )}
                    </Link>
                </div>

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto py-4">
                    <Navigation isSidebarOpen={isSidebarOpen} />
                </div>

                {/* Mobile Profile Section */}
                {/* {isMobileSidebarOpen && (
                    <div className="border-t border-gray-800 p-4 md:hidden">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-white font-semibold">
                                {emp_data?.emp_firstname?.charAt(0)}
                                {emp_data?.emp_lastname?.charAt(0)}
                            </div>
                            <div>
                                <p className="font-medium text-white">
                                    {emp_data?.emp_firstname}{" "}
                                    {emp_data?.emp_lastname}
                                </p>
                                <p className="text-xs text-gray-400">Online</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <Link
                                href={route("profile.index")}
                                className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                <User className="w-4 h-4" />
                                <span>Profile</span>
                            </Link>
                            <button
                                onClick={logout}
                                className="flex items-center gap-2 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-gray-800 rounded-lg transition-colors text-left"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>Logout</span>
                            </button>
                        </div>
                    </div>
                )} */}

                {/* Theme Toggler */}
                <div
                    className={`border-t border-gray-800 p-4 ${!isSidebarOpen && "px-2"}`}
                >
                    <ThemeToggler
                        toggleTheme={toggleTheme}
                        theme={theme}
                        isCollapsed={!isSidebarOpen}
                    />
                </div>
            </aside>
        </div>
    );
}
