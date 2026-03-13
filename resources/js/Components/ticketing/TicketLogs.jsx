import React, { useState, useEffect, useRef } from "react";
import { Timeline, Tag, Spin, Space } from "antd";
import {
    FileTextOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    StopOutlined,
    RollbackOutlined,
    HistoryOutlined,
    SwapOutlined,
    CalendarOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const TicketLogs = ({ history = [], loading = false }) => {
    const [displayedItems, setDisplayedItems] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const scrollContainerRef = useRef(null);
    const ITEMS_PER_PAGE = 5;

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

    const loadMore = () => {
        if (isLoadingMore || !hasMore) return;
        setIsLoadingMore(true);

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

    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        if (
            (scrollTop + clientHeight) / scrollHeight > 0.8 &&
            hasMore &&
            !isLoadingMore
        ) {
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
            RETURN: "gold",
            ASSIGN: "cyan",
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
            ASSIGN: <HistoryOutlined />,
        };
        return icons[actionType] || <FileTextOutlined />;
    };

    if (loading) {
        return (
            <div style={{ padding: "5rem 0", textAlign: "center" }}>
                <Spin size="large" />
                <div style={{ marginTop: 16 }}>Loading history...</div>
            </div>
        );
    }

    if (!history.length) {
        return (
            <div style={{ padding: "1rem 0", textAlign: "center" }}>
                No history available.
            </div>
        );
    }

    return (
        <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            style={{
                maxHeight: 500,
                overflowY: "auto",
                paddingRight: 8,
                paddingTop: 8,
            }}
            className="custom-scrollbar"
        >
            <Timeline
                className="ml-2 md:ml-4"
                items={displayedItems.map((item, index) => {
                    const dotColor =
                        item.NEW_STATUS_COLOR ||
                        getActionColor(item.ACTION_TYPE);

                    const changes = [];
                    if (item.OLD_VALUES && item.NEW_VALUES) {
                        Object.keys(item.NEW_VALUES).forEach((key) => {
                            if (key === "status") return;
                            let oldVal = item.OLD_VALUES[key] ?? "";
                            let newVal = item.NEW_VALUES[key] ?? "—";

                            const isDateField =
                                key.toLowerCase().endsWith("_at") ||
                                key.toLowerCase().includes("date");

                            if (isDateField) {
                                const oldDate = dayjs(oldVal);
                                const newDate = dayjs(newVal);
                                if (oldDate.isValid())
                                    oldVal = oldDate.format(
                                        "MMM DD, YYYY - hh:mm A",
                                    );
                                if (newDate.isValid())
                                    newVal = newDate.format(
                                        "MMM DD, YYYY - hh:mm A",
                                    );
                            }

                            if (oldVal !== newVal)
                                changes.push({ key, oldVal, newVal });
                        });
                    }

                    return {
                        color: dotColor,
                        dot: getActionIcon(item.ACTION_TYPE),
                        children: (
                            <div key={index} style={{ paddingBottom: 16 }}>
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 12, // space between tag and date
                                        marginBottom: 12,
                                    }}
                                >
                                    <Tag color="blue" style={{ fontSize: 12 }}>
                                        {item.ACTION_TYPE || "Remark"}
                                    </Tag>
                                    <Space size={4} align="center">
                                        <CalendarOutlined
                                            style={{
                                                fontSize: 12,
                                                color: "#555",
                                            }}
                                        />
                                        <span
                                            style={{
                                                fontSize: 12,
                                                color: "#555",
                                            }}
                                        >
                                            {item.ACTION_AT
                                                ? dayjs(item.ACTION_AT).format(
                                                      "MMM DD, YYYY - hh:mm A",
                                                  )
                                                : "—"}
                                        </span>
                                    </Space>
                                </div>
                                {/* Status Change */}
                                {item.OLD_STATUS_LABEL &&
                                    item.NEW_STATUS_LABEL && (
                                        <div
                                            style={{
                                                marginBottom: 12,
                                                padding: 12,
                                                borderRadius: 4,
                                                border: "1px solid #d9d9d9",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 8,
                                                    fontSize: 12,
                                                    marginBottom: 8,
                                                }}
                                            >
                                                <SwapOutlined />
                                                <span
                                                    style={{ fontWeight: 500 }}
                                                >
                                                    Status Change
                                                </span>
                                            </div>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    gap: 8,
                                                    flexWrap: "wrap",
                                                }}
                                            >
                                                <Tag
                                                    color={
                                                        item.OLD_STATUS_COLOR
                                                    }
                                                >
                                                    {item.OLD_STATUS_LABEL}
                                                </Tag>
                                                <span>→</span>
                                                <Tag
                                                    color={
                                                        item.NEW_STATUS_COLOR
                                                    }
                                                >
                                                    {item.NEW_STATUS_LABEL}
                                                </Tag>
                                            </div>
                                        </div>
                                    )}
                                {/* Dynamic Field Changes */}
                                {changes.length > 0 && (
                                    <div style={{ marginTop: 12 }}>
                                        <div
                                            style={{
                                                fontSize: 12,
                                                fontWeight: 500,
                                                marginBottom: 8,
                                            }}
                                        >
                                            Field Changes:
                                        </div>

                                        <div className="hidden md:block">
                                            <div
                                                style={{
                                                    display: "grid",
                                                    gridTemplateColumns:
                                                        "1fr 1fr 1fr",
                                                    gap: 12,
                                                    paddingBottom: 8,
                                                    borderBottom:
                                                        "1px solid #d9d9d9",
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        fontSize: 12,
                                                        fontWeight: 500,
                                                    }}
                                                >
                                                    Field
                                                </span>
                                                <span
                                                    style={{
                                                        fontSize: 12,
                                                        fontWeight: 500,
                                                    }}
                                                >
                                                    Old Value
                                                </span>
                                                <span
                                                    style={{
                                                        fontSize: 12,
                                                        fontWeight: 500,
                                                    }}
                                                >
                                                    New Value
                                                </span>
                                            </div>
                                            {changes.map((c, i) => (
                                                <div
                                                    key={i}
                                                    style={{
                                                        display: "grid",
                                                        gridTemplateColumns:
                                                            "1fr 1fr 1fr",
                                                        gap: 12,
                                                        padding: "8px 0",
                                                        borderBottom:
                                                            "1px solid #f0f0f0",
                                                    }}
                                                >
                                                    <Tag
                                                        color="blue"
                                                        style={{ fontSize: 12 }}
                                                    >
                                                        {c.key
                                                            .replace(/_/g, " ")
                                                            .toUpperCase()}
                                                    </Tag>
                                                    <span
                                                        style={{ fontSize: 12 }}
                                                    >
                                                        {c.oldVal || "—"}
                                                    </span>
                                                    <span
                                                        style={{
                                                            fontSize: 12,
                                                            fontWeight: 500,
                                                        }}
                                                    >
                                                        {c.newVal || "—"}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        <div
                                            className="md:hidden"
                                            style={{ marginTop: 12 }}
                                        >
                                            {changes.map((c, i) => (
                                                <div
                                                    key={i}
                                                    style={{
                                                        padding: 12,
                                                        borderRadius: 4,
                                                        border: "1px solid #d9d9d9",
                                                    }}
                                                >
                                                    <Tag
                                                        color="blue"
                                                        style={{
                                                            marginBottom: 8,
                                                            fontSize: 12,
                                                        }}
                                                    >
                                                        {c.key
                                                            .replace(/_/g, " ")
                                                            .toUpperCase()}
                                                    </Tag>
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            flexDirection:
                                                                "column",
                                                            gap: 4,
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                gap: 8,
                                                            }}
                                                        >
                                                            <span
                                                                style={{
                                                                    minWidth: 60,
                                                                    fontSize: 12,
                                                                }}
                                                            >
                                                                Old:
                                                            </span>
                                                            <span
                                                                style={{
                                                                    fontSize: 12,
                                                                }}
                                                            >
                                                                {c.oldVal ||
                                                                    "—"}
                                                            </span>
                                                        </div>
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                gap: 8,
                                                            }}
                                                        >
                                                            <span
                                                                style={{
                                                                    minWidth: 60,
                                                                    fontSize: 12,
                                                                }}
                                                            >
                                                                New:
                                                            </span>
                                                            <span
                                                                style={{
                                                                    fontSize: 12,
                                                                    fontWeight: 500,
                                                                }}
                                                            >
                                                                {c.newVal ||
                                                                    "—"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {item.REMARKS && (
                                    <div
                                        style={{
                                            marginBottom: 12,
                                            padding: 12,
                                            borderRadius: 4,
                                            border: "1px solid #d9d9d9",
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: 12,
                                                fontWeight: 500,
                                                marginBottom: 4,
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 6,
                                            }}
                                        >
                                            <FileTextOutlined />
                                            <span>Remarks:</span>
                                        </div>
                                        <div style={{ fontSize: 14 }}>
                                            {item.REMARKS}
                                        </div>
                                    </div>
                                )}
                                {/* Action By */}
                                {item.ACTION_BY && (
                                    <div
                                        style={{
                                            fontSize: 12,
                                            marginTop: 8,
                                            display: "flex",
                                            gap: 4,
                                        }}
                                    >
                                        <span style={{ fontWeight: 500 }}>
                                            By:
                                        </span>
                                        <span>{item.ACTION_BY}</span>
                                    </div>
                                )}
                            </div>
                        ),
                    };
                })}
            />

            {isLoadingMore && (
                <div style={{ textAlign: "center", padding: 16 }}>
                    <Spin size="small" />
                    <span style={{ marginLeft: 8, fontSize: 12 }}>
                        Loading more...
                    </span>
                </div>
            )}

            {!hasMore && displayedItems.length > 0 && (
                <div
                    style={{
                        textAlign: "center",
                        padding: 16,
                        fontSize: 12,
                        borderTop: "1px solid #f0f0f0",
                    }}
                >
                    No more history to load
                </div>
            )}

            <div
                style={{ textAlign: "center", padding: "8px 0", fontSize: 12 }}
            >
                Showing {displayedItems.length} of {history.length} items
            </div>
        </div>
    );
};

export default TicketLogs;
