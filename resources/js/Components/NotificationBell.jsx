import { Bell, Check, Volume2, VolumeX } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useNotifications } from "@/Context/NotificationContext";

export default function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [previousUnreadCount, setPreviousUnreadCount] = useState(0);
    const dropdownRef = useRef(null);
    const audioRef = useRef(null);

    const { notifications, unreadCount, markAsRead, markAllAsRead } =
        useNotifications();

    // Initialize audio with your downloaded sound
    useEffect(() => {
        console.log(
            "🔊 Loading notification sound from:",
            "/sounds/notification_sound.mp3"
        );

        // Use the correct path to your sound file
        audioRef.current = new Audio("/sounds/notification_sound.mp3");
        audioRef.current.preload = "auto";

        // Success handler
        audioRef.current.addEventListener("canplaythrough", () => {
            console.log("✅ Notification sound loaded successfully");
        });

        // Error handler
        audioRef.current.addEventListener("error", (e) => {
            console.error("❌ Error loading notification sound:", e);
            console.log("Please check: public/sounds/notification_sound.mp3");
        });
    }, []);

    // Play sound when new notifications arrive
    useEffect(() => {
        // Only play sound if:
        // 1. Not muted
        // 2. There are new notifications (unread count increased)
        // 3. User is not currently viewing notifications
        // 4. There are actual notifications to show
        if (
            !isMuted &&
            unreadCount > previousUnreadCount &&
            !isOpen &&
            notifications.length > 0
        ) {
            playNotificationSound();
        }

        // Update previous count
        setPreviousUnreadCount(unreadCount);
    }, [unreadCount, isMuted, isOpen, notifications.length]);

    const playNotificationSound = async () => {
        if (!audioRef.current || isMuted) return;

        try {
            // Reset and play the sound
            audioRef.current.currentTime = 0;
            await audioRef.current.play();
            console.log("🔊 Notification sound played");
        } catch (error) {
            console.log("Could not play notification sound:", error);
            // Fallback to browser beep
            fallbackBeep();
        }
    };

    const fallbackBeep = () => {
        try {
            const audioContext = new (window.AudioContext ||
                window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = "sine";
            gainNode.gain.value = 0.1;

            oscillator.start();
            setTimeout(() => {
                oscillator.stop();
            }, 100);
        } catch (error) {
            console.log("Fallback beep also failed:", error);
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    // Handle notification click
    const handleNotificationClick = async (notif) => {
        const notifData =
            typeof notif.data === "string"
                ? JSON.parse(notif.data)
                : notif.data || {};

        if (!notif.read_at) {
            await markAsRead(notif.id);
        }

        setIsOpen(false);

        if (notif.ticket_id || notifData.ticket_id) {
            window.location.href = route("tickets.datatable");
        }
    };

    // Get notification badge color based on type
    const getNotificationStyle = (type) => {
        const styles = {
            TICKET_CREATED: "bg-blue-500/10 border-l-blue-500",
            TICKET_ONGOING: "bg-purple-500/10 border-l-purple-500",
            TICKET_RESOLVED: "bg-emerald-500/10 border-l-emerald-500",
            TICKET_CLOSED: "bg-gray-500/10 border-l-gray-500",
            TICKET_RETURNED: "bg-orange-500/10 border-l-orange-500",
            TICKET_CANCELLED: "bg-red-500/10 border-l-red-500",
        };

        return styles[type] || "bg-info/10 border-l-info";
    };

    // Get notification icon/emoji based on type
    const getNotificationIcon = (type) => {
        const icons = {
            TICKET_CREATED: "🎫",
            TICKET_ONGOING: "🔧",
            TICKET_RESOLVED: "✅",
            TICKET_CLOSED: "🔒",
            TICKET_RETURNED: "↩️",
            TICKET_CANCELLED: "❌",
        };

        return icons[type] || "📢";
    };

    // Get action required label
    const getActionLabel = (actionRequired) => {
        const labels = {
            REVIEW: "👁 Review",
            RESOLVE: "🔧 Resolve",
            CLOSE: "✓ Close",
            VIEW: "👁 View",
        };
        return labels[actionRequired] || "👁 View";
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="btn btn-ghost btn-circle indicator hover:bg-base-200 transition-colors group relative"
            >
                {unreadCount > 0 && (
                    <span className="indicator-item badge badge-xs badge-error animate-bounce">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
                <Bell size={24} />
            </button>

            {isOpen && (
                <div className="absolute left-0 md:right-0 md:left-auto bottom-full md:bottom-auto md:top-full mb-2 md:mb-0 md:mt-2 card card-compact w-[calc(100vw-2rem)] md:w-96 max-w-96 shadow-xl bg-base-100 border border-base-300 p-0 rounded-lg z-50">
                    <div className="p-4 border-b border-base-300 flex justify-between items-center bg-base-200 rounded-t-lg">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <Bell size={20} />
                            Notifications
                            {isMuted && (
                                <VolumeX
                                    size={16}
                                    className="text-warning"
                                    title="Sound muted"
                                />
                            )}
                        </h3>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        markAllAsRead();
                                    }}
                                    className="text-xs btn btn-link btn-xs text-primary no-underline hover:underline"
                                >
                                    Mark all as read
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="overflow-y-auto flex-1 max-h-28 md:max-h-96">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-base-content/50">
                                <Bell
                                    size={48}
                                    className="mx-auto mb-3 opacity-30"
                                />
                                <p className="text-sm font-medium">
                                    No notifications yet
                                </p>
                                <p className="text-xs mt-1">
                                    You'll see ticket updates here
                                </p>
                            </div>
                        ) : (
                            notifications.map((notif, index) => {
                                const notifData =
                                    typeof notif.data === "string"
                                        ? JSON.parse(notif.data)
                                        : notif.data || {};

                                const type = notifData.type || notif.type;
                                const message =
                                    notifData.message || notif.message;
                                const ticketId =
                                    notifData.ticket_id || notif.ticket_id;
                                const requestType = notifData.request_type;
                                const details = notifData.details;
                                const actionRequired =
                                    notif.action_required ||
                                    notifData.action_required;

                                return (
                                    <div
                                        key={notif.id}
                                        onClick={() =>
                                            handleNotificationClick({
                                                ...notif,
                                                ticket_id: ticketId,
                                                data: notifData,
                                            })
                                        }
                                        className={`p-4 border-b border-base-300 hover:bg-base-200 transition-all cursor-pointer group relative ${
                                            !notif.read_at
                                                ? `${getNotificationStyle(
                                                      type
                                                  )} border-l-4`
                                                : "hover:border-l-4 hover:border-l-base-300"
                                        } ${
                                            index === notifications.length - 1
                                                ? "border-b-0"
                                                : ""
                                        }`}
                                    >
                                        <div className="flex justify-between items-start gap-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-lg">
                                                        {getNotificationIcon(
                                                            type
                                                        )}
                                                    </span>
                                                    <p className="font-bold text-sm text-primary">
                                                        {ticketId}
                                                    </p>
                                                    {!notif.read_at && (
                                                        <span className="badge badge-xs badge-primary">
                                                            NEW
                                                        </span>
                                                    )}
                                                </div>

                                                <p className="text-sm text-base-content/80 mt-1 line-clamp-2">
                                                    {message}
                                                </p>

                                                {details && (
                                                    <p className="text-xs text-base-content/60 mt-1 line-clamp-1 italic">
                                                        "{details}"
                                                    </p>
                                                )}

                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {requestType && (
                                                        <span className="badge badge-sm badge-ghost">
                                                            {requestType}
                                                        </span>
                                                    )}
                                                    {actionRequired &&
                                                        actionRequired !==
                                                            "VIEW" && (
                                                            <span className="badge badge-sm badge-warning">
                                                                {getActionLabel(
                                                                    actionRequired
                                                                )}
                                                            </span>
                                                        )}
                                                </div>

                                                <p className="text-xs text-base-content/50 mt-2 flex items-center gap-1">
                                                    🕐{" "}
                                                    {formatDate(
                                                        notif.created_at
                                                    )}
                                                </p>
                                            </div>

                                            <div className="flex flex-col gap-1">
                                                {!notif.read_at && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            markAsRead(
                                                                notif.id
                                                            );
                                                        }}
                                                        className="btn btn-ghost btn-xs btn-circle hover:bg-success hover:text-success-content transition-all tooltip tooltip-left"
                                                        data-tip="Mark as read"
                                                    >
                                                        <Check size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <div className="p-3 border-t border-base-300 bg-base-200 rounded-b-lg text-center">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsOpen(false);
                                }}
                                className="text-xs text-base-content/60 hover:text-primary transition-colors"
                            >
                                Close notifications
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
