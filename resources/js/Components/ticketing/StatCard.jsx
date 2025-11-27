const colorMap = {
    primary: "text-blue-600 border-blue-600",
    info: "text-sky-500 border-sky-500",
    error: "text-red-600 border-red-600",
    success: "text-green-600 border-green-600",
    warning: "text-yellow-500 border-yellow-500",
    neutral: "neural-content",
    secondary: "text-orange-600 border-orange-600",
};

export default function StatCard({
    title,
    value,
    color,
    icon: Icon,
    onClick,
    isActive,
    filterType,
}) {
    const colorClass = colorMap[color]?.split(" ")[0] || "text-gray-700";
    const borderClass = colorMap[color]?.split(" ")[1] || "border-gray-300";

    return (
        <div
            className={`cursor-pointer transition-all duration-300 border shadow-md hover:shadow-lg rounded-tl-2xl rounded-br-2xl relative overflow-hidden
                ${
                    isActive
                        ? `bg-base-100 ${borderClass} border-2`
                        : "bg-base-200 border-base-300 hover:bg-base-100"
                }`}
            onClick={() => onClick(filterType)}
        >
            {" "}
            <div className="absolute top-0 -left-2 w-4 h-4 rounded-full border border-gray-300 dark:border-gray-700"></div>
            <div className="absolute bottom-0 -right-2 w-4 h-4 rounded-full border border-gray-300 dark:border-gray-700"></div>
            <div className="card-body p-4 flex flex-row items-center justify-between">
                <div>
                    <p className={`text-sm font-medium ${colorClass}`}>
                        {title}
                    </p>
                    <p className={`text-2xl font-bold ${colorClass}`}>
                        {value}
                    </p>
                </div>
                <Icon className={`${colorClass} text-3xl`} />
            </div>
        </div>
    );
}
