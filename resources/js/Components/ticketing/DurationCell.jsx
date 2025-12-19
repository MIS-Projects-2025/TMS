import { useState, useEffect } from "react";
import { Tooltip } from "antd";

const DurationCell = ({ record }) => {
    const [secondsOpen, setSecondsOpen] = useState(() => {
        const createdAt = new Date(record.created_at.replace(" ", "T"));
        return isNaN(createdAt)
            ? 0
            : Math.floor((new Date() - createdAt) / 1000);
    });

    useEffect(() => {
        if (Number(record.STATUS) !== 1) return;

        const interval = setInterval(() => {
            const createdAt = new Date(record.created_at.replace(" ", "T"));
            const secs = isNaN(createdAt)
                ? 0
                : Math.floor((new Date() - createdAt) / 1000);
            setSecondsOpen(secs);
        }, 1000); // update every second

        return () => clearInterval(interval);
    }, [record.created_at, record.STATUS]);
    if (Number(record.STATUS) !== 1) return "-";
    const hours = Math.floor(secondsOpen / 3600);
    const minutes = Math.floor((secondsOpen % 3600) / 60);
    const seconds = secondsOpen % 60;

    const displayText =
        hours > 0
            ? `${hours}h ${minutes}m ${seconds}s`
            : minutes > 0
            ? `${minutes}m ${seconds}s`
            : `${seconds}s`;

    return (
        <Tooltip title={`Open for ${hours}h ${minutes}m ${seconds}s`}>
            <span
                style={{
                    color: secondsOpen > 1800 ? "red" : "inherit", // 1800s = 30min
                    fontWeight: secondsOpen > 1800 ? "bold" : "normal",
                }}
            >
                {displayText}
            </span>
        </Tooltip>
    );
};

export default DurationCell;
