import React, { useState, useEffect, useRef } from "react";
import { Timeline, Tag, Spin } from "antd";
import {
    FileTextOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    StopOutlined,
    RollbackOutlined,
    HistoryOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const TicketLogs = ({ history = [], loading = false }) => {
    const [displayedItems, setDisplayedItems] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const scrollContainerRef = useRef(null);
    const ITEMS_PER_PAGE = 5;

    // Initialize with first 5 items
    useEffect(() => {
        if (history.length > 0) {
            const initialItems = history.slice(0, ITEMS_PER_PAGE);
            setDisplayedItems(initialItems);
            setCurrentPage(1);
            setHasMore(history.length > ITEMS_PER_PAGE);
        } else {
            setDisplayedItems([]);
            setCurrentPage(1);
            setHasMore(false);
        }
    }, [history]);

    // Load more items
    const loadMore = () => {
        if (isLoadingMore || !hasMore) return;

        setIsLoadingMore(true);

        // Simulate a small delay for better UX
        setTimeout(() => {
            const nextPage = currentPage + 1;
            const startIndex = currentPage * ITEMS_PER_PAGE;
            const endIndex = startIndex + ITEMS_PER_PAGE;
            const newItems = history.slice(startIndex, endIndex);

            if (newItems.length > 0) {
                setDisplayedItems((prev) => [...prev, ...newItems]);
                setCurrentPage(nextPage);
                setHasMore(endIndex < history.length);
            } else {
                setHasMore(false);
            }

            setIsLoadingMore(false);
        }, 300);
    };

    // Handle scroll event
    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

        // Load more when user scrolls to 80% of the container
        if (scrollPercentage > 0.8 && hasMore && !isLoadingMore) {
            loadMore();
        }
    };

    const getActionColor = (actionType) => {
        const colors = {
            CREATED: "blue",
            ONGOING: "orange",
            RESOLVE: "green",
            CLOSE: "purple",
            CANCEL: "red",
            RETURN: "yellow",
        };
        return colors[actionType] || "default";
    };

    const getActionIcon = (actionType) => {
        const icons = {
            CREATED: <FileTextOutlined />,
            ONGOING: <ClockCircleOutlined />,
            RESOLVE: <CheckCircleOutlined />,
            CLOSE: <CheckCircleOutlined />,
            CANCEL: <StopOutlined />,
            RETURN: <RollbackOutlined />,
        };
        return icons[actionType] || <HistoryOutlined />;
    };

    if (loading) {
        return (
            <div className="py-20 text-center text-gray-500">
                <Spin size="large" />
                <div className="mt-4">Loading history...</div>
            </div>
        );
    }

    if (!history.length) {
        return (
            <div className="py-4 text-center text-gray-500">
                No history available.
            </div>
        );
    }

    return (
        <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            style={{
                maxHeight: "500px",
                overflowY: "auto",
                paddingRight: "8px",
            }}
            className="custom-scrollbar"
        >
            <Timeline
                className="ml-4"
                items={displayedItems.map((item, index) => {
                    // Determine the color for the dot: if action, use new status color
                    const dotColor = item.NEW_STATUS_COLOR || "gray";

                    return {
                        color: dotColor,
                        dot:
                            item.type === "action" ? (
                                getActionIcon(item.ACTION_TYPE)
                            ) : (
                                <FileTextOutlined />
                            ),
                        children: (
                            <div className="pb-4" key={index}>
                                <div className="flex items-center gap-2 mt-4">
                                    {/* Action Tag */}
                                    <Tag color={dotColor}>
                                        {item.ACTION_TYPE || "Remark"}
                                    </Tag>

                                    {/* Timestamp */}
                                    <span className="text-xs text-base-500">
                                        {dayjs(
                                            item.ACTION_AT || item.timestamp
                                        ).format("MMM DD, YYYY - hh:mm A")}
                                    </span>
                                </div>

                                {/* Status transition */}
                                {item.OLD_STATUS_LABEL &&
                                    item.NEW_STATUS_LABEL && (
                                        <div className="mt-2 flex items-center gap-2 text-sm">
                                            <Tag
                                                color={
                                                    item.OLD_STATUS_COLOR ||
                                                    "gray"
                                                }
                                            >
                                                {item.OLD_STATUS_LABEL}
                                            </Tag>
                                            <span>→</span>
                                            <Tag
                                                color={
                                                    item.NEW_STATUS_COLOR ||
                                                    "gray"
                                                }
                                            >
                                                {item.NEW_STATUS_LABEL}
                                            </Tag>
                                        </div>
                                    )}

                                {/* Remarks */}
                                {item.REMARKS && (
                                    <div className="mt-2 text-sm text-gray-600">
                                        {item.REMARKS}
                                    </div>
                                )}
                                {item.ACTION_BY && (
                                    <div className="text-xs text-base-500 mt-1">
                                        By: {item.ACTION_BY}
                                    </div>
                                )}
                            </div>
                        ),
                    };
                })}
            />

            {/* Loading More Indicator */}
            {isLoadingMore && (
                <div className="text-center py-4">
                    <Spin size="small" />
                    <span className="ml-2 text-sm text-gray-500">
                        Loading more...
                    </span>
                </div>
            )}

            {/* End of List Indicator */}
            {!hasMore && displayedItems.length > 0 && (
                <div className="text-center py-4 text-xs text-gray-400 border-t border-gray-200">
                    No more history to load
                </div>
            )}

            {/* Showing count */}
            <div className="text-center py-2 text-xs text-gray-400">
                Showing {displayedItems.length} of {history.length} items
            </div>
        </div>
    );
};

export default TicketLogs;
