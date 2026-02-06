import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, usePage } from "@inertiajs/react";
import { useState } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    LineChart,
    Line,
    ComposedChart,
    Legend,
    ResponsiveContainer,
    Cell,
} from "recharts";

const COLORS = {
    primary: "#3b82f6",
    secondary: "#10b981",
    tertiary: "#f59e0b",
    quaternary: "#8b5cf6",
    danger: "#ef4444",
    info: "#06b6d4",
};

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-base-100 p-4 border-2 border-base-300 rounded-lg shadow-xl">
                <p className="font-bold text-base-content mb-2 text-sm">
                    {label}
                </p>
                {payload.map((entry, i) => (
                    <p
                        key={i}
                        className="text-sm font-medium"
                        style={{ color: entry.color }}
                    >
                        {entry.name}:{" "}
                        <span className="font-bold">
                            {typeof entry.value === "number"
                                ? entry.value.toFixed(2)
                                : entry.value}
                        </span>
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const CustomLegend = ({ payload }) => {
    return (
        <div className="flex flex-wrap justify-center gap-4 mt-4">
            {payload.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                    <div
                        className="w-3 h-3 rounded-sm"
                        style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-sm text-base-content/70 font-medium">
                        {entry.value}
                    </span>
                </div>
            ))}
        </div>
    );
};

// Helper to truncate long text
const truncateText = (text, maxLength = 15) => {
    if (!text) return "Unknown";
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
};

export default function Dashboard() {
    const { dashboard, userRole } = usePage().props;
    const [selectedChart, setSelectedChart] = useState("all");

    // Determine if user has manager-level access
    const isManagerView = Array.isArray(userRole)
        ? userRole.some((role) =>
              ["MIS_SUPERVISOR", "manager", "admin"].includes(role),
          )
        : ["MIS_SUPERVISOR", "manager", "admin"].includes(userRole);

    // Detect if dark mode (you can use your theme context here)
    const isDark =
        typeof window !== "undefined" &&
        document.documentElement.getAttribute("data-theme") === "dark";

    // Dynamic colors for charts based on theme
    const gridColor = isDark ? "#374151" : "#e5e7eb";
    const textColor = isDark ? "#d1d5db" : "#6b7280";
    const axisColor = isDark ? "#9ca3af" : "#6b7280";

    /* ----------------------------- DATA CLEANING ----------------------------- */
    const responseTimeData = dashboard.responseTime.map((i) => ({
        name: truncateText(i.emp_name, 12),
        fullName: i.emp_name,
        avg: Number(i.avg_response_minutes),
        min: Number(i.min_response_minutes),
        max: Number(i.max_response_minutes),
    }));

    const dailyData = dashboard.ticketsPerDay.map((i) => ({
        day: i.day,
        total: Number(i.total),
    }));

    const handledData = dashboard.ticketsHandled.map((i) => ({
        name: truncateText(i.emp_name, 12),
        fullName: i.emp_name,
        total: Number(i.total),
    }));

    const issueResponseData = dashboard.avgResponseTimePerIssue
        .map((i) => ({
            issue: truncateText(i.type_of_request || "Unknown", 20),
            fullIssue: i.type_of_request || "Unknown",
            avg: Number(i.avg_minutes),
            count: Number(i.count),
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // Top 10 issues

    const optionResponseData = dashboard.optionsPerRequest
        .map((i) => ({
            option: truncateText(i.request_option || "Unknown", 20),
            fullOption: i.request_option || "Unknown",
            avg: Number(i.avg_minutes),
            count: Number(i.count),
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // Top 10 options

    const paretoData = dashboard.paretoByType.map((i) => ({
        type: truncateText(i.type_of_request || "Unknown", 15),
        fullType: i.type_of_request || "Unknown",
        count: Number(i.count),
        cumulative: Number(i.cumulative_percentage),
    }));

    const ratingData = dashboard.avgRatingPerEmployee.map((i) => ({
        name: truncateText(i.emp_name, 12),
        fullName: i.emp_name,
        rating: Number(i.avg_rating),
        total: Number(i.total_ratings),
    }));

    /* ----------------------------- CHART OPTIONS ----------------------------- */
    const chartOptions = [
        { value: "all", label: "All Charts (Grid View)" },
        {
            value: "responseTime",
            label: isManagerView
                ? "Response Time by Employee"
                : "Your Response Time",
        },
        {
            value: "dailyTickets",
            label: isManagerView
                ? "Team Tickets Per Day"
                : "Your Tickets Per Day",
        },
        {
            value: "ticketsHandled",
            label: isManagerView
                ? "Tickets Resolved by Employee"
                : "Your Resolved Tickets",
        },
        { value: "issueResponse", label: "Response Time Per Issue Type" },
        { value: "optionResponse", label: "Response Time Per Request Option" },
        { value: "pareto", label: "Pareto Analysis" },
        {
            value: "ratings",
            label: isManagerView
                ? "Average Rating by Employee"
                : "Your Average Rating",
        },
    ];

    /* ----------------------------- HELPER FUNCTION ----------------------------- */
    const getRoleLabel = () => {
        if (userRole === "admin") return "Admin Overview";
        if (userRole === "manager") return "Manager Overview";
        if (userRole === "supervisor") return "Team Overview";
        return "Your Performance";
    };

    /* ----------------------------- CHART COMPONENTS ----------------------------- */
    const ResponseTimeChart = () => (
        <ChartCard
            title={
                isManagerView
                    ? "Average Response Time by Employee"
                    : "Your Response Time"
            }
            description="Average, minimum, and maximum response times in minutes"
        >
            <ResponsiveContainer
                width="100%"
                height={selectedChart === "all" ? 350 : 500}
            >
                <BarChart
                    data={responseTimeData}
                    margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 80,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        tick={{ fontSize: 12, fill: textColor }}
                        stroke={axisColor}
                    />
                    <YAxis
                        label={{
                            value: "Minutes",
                            angle: -90,
                            position: "insideLeft",
                            style: { fontSize: 14, fill: textColor },
                        }}
                        tick={{ fontSize: 12, fill: textColor }}
                        stroke={axisColor}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend content={<CustomLegend />} />
                    <Bar
                        dataKey="avg"
                        fill={COLORS.primary}
                        name="Average"
                        radius={[8, 8, 0, 0]}
                    />
                    <Bar
                        dataKey="min"
                        fill={COLORS.secondary}
                        name="Minimum"
                        radius={[8, 8, 0, 0]}
                    />
                    <Bar
                        dataKey="max"
                        fill={COLORS.tertiary}
                        name="Maximum"
                        radius={[8, 8, 0, 0]}
                    />
                </BarChart>
            </ResponsiveContainer>
        </ChartCard>
    );

    const DailyTicketsChart = () => (
        <ChartCard
            title={
                isManagerView ? "Team Tickets Per Day" : "Your Tickets Per Day"
            }
            description="Daily ticket volume trend"
        >
            <ResponsiveContainer
                width="100%"
                height={selectedChart === "all" ? 350 : 500}
            >
                <LineChart
                    data={dailyData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis
                        dataKey="day"
                        tick={{ fontSize: 12, fill: textColor }}
                        stroke={axisColor}
                    />
                    <YAxis
                        tick={{ fontSize: 12, fill: textColor }}
                        stroke={axisColor}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend content={<CustomLegend />} />
                    <Line
                        type="monotone"
                        dataKey="total"
                        stroke={COLORS.primary}
                        strokeWidth={3}
                        name="Total Tickets"
                        dot={{
                            r: 5,
                            fill: COLORS.primary,
                            strokeWidth: 2,
                            stroke: isDark ? "#1f2937" : "#fff",
                        }}
                        activeDot={{ r: 7, fill: COLORS.primary }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </ChartCard>
    );

    const TicketsHandledChart = () => (
        <ChartCard
            title={
                isManagerView
                    ? "Tickets Resolved by Employee"
                    : "Your Resolved Tickets"
            }
            description="Total number of tickets resolved"
        >
            <ResponsiveContainer
                width="100%"
                height={selectedChart === "all" ? 350 : 500}
            >
                <BarChart
                    data={handledData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        tick={{ fontSize: 12, fill: textColor }}
                        stroke={axisColor}
                    />
                    <YAxis
                        tick={{ fontSize: 12, fill: textColor }}
                        stroke={axisColor}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend content={<CustomLegend />} />
                    <Bar
                        dataKey="total"
                        fill={COLORS.secondary}
                        name="Total Resolved"
                        radius={[8, 8, 0, 0]}
                    >
                        {handledData.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={
                                    index % 2 === 0
                                        ? COLORS.secondary
                                        : COLORS.info
                                }
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </ChartCard>
    );

    const IssueResponseChart = () => (
        <ChartCard
            title="Response Time Per Issue Type"
            description="Top 10 issue types by volume"
        >
            <ResponsiveContainer
                width="100%"
                height={selectedChart === "all" ? 350 : 500}
            >
                <ComposedChart
                    data={issueResponseData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis
                        dataKey="issue"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        interval={0}
                        tick={{ fontSize: 11, fill: textColor }}
                        stroke={axisColor}
                    />
                    <YAxis
                        yAxisId="left"
                        orientation="left"
                        stroke={COLORS.primary}
                        tick={{ fontSize: 12, fill: textColor }}
                        label={{
                            value: "Avg Minutes",
                            angle: -90,
                            position: "insideLeft",
                            style: { fontSize: 12, fill: textColor },
                        }}
                    />
                    <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke={COLORS.secondary}
                        tick={{ fontSize: 12, fill: textColor }}
                        label={{
                            value: "Count",
                            angle: 90,
                            position: "insideRight",
                            style: { fontSize: 12, fill: textColor },
                        }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend content={<CustomLegend />} />
                    <Bar
                        yAxisId="left"
                        dataKey="avg"
                        fill={COLORS.primary}
                        name="Avg Minutes"
                        radius={[8, 8, 0, 0]}
                    />
                    <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="count"
                        stroke={COLORS.secondary}
                        strokeWidth={3}
                        name="Count"
                        dot={{ r: 4, fill: COLORS.secondary }}
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </ChartCard>
    );

    const OptionResponseChart = () => (
        <ChartCard
            title="Response Time Per Request Option"
            description="Top 10 request options by volume"
        >
            <ResponsiveContainer
                width="100%"
                height={selectedChart === "all" ? 350 : 500}
            >
                <ComposedChart
                    data={optionResponseData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis
                        dataKey="option"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        interval={0}
                        tick={{ fontSize: 11, fill: textColor }}
                        stroke={axisColor}
                    />
                    <YAxis
                        yAxisId="left"
                        orientation="left"
                        stroke={COLORS.quaternary}
                        tick={{ fontSize: 12, fill: textColor }}
                        label={{
                            value: "Avg Minutes",
                            angle: -90,
                            position: "insideLeft",
                            style: { fontSize: 12, fill: textColor },
                        }}
                    />
                    <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke={COLORS.tertiary}
                        tick={{ fontSize: 12, fill: textColor }}
                        label={{
                            value: "Count",
                            angle: 90,
                            position: "insideRight",
                            style: { fontSize: 12, fill: textColor },
                        }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend content={<CustomLegend />} />
                    <Bar
                        yAxisId="left"
                        dataKey="avg"
                        fill={COLORS.quaternary}
                        name="Avg Minutes"
                        radius={[8, 8, 0, 0]}
                    />
                    <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="count"
                        stroke={COLORS.tertiary}
                        strokeWidth={3}
                        name="Count"
                        dot={{ r: 4, fill: COLORS.tertiary }}
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </ChartCard>
    );

    const ParetoChart = () => (
        <ChartCard
            title="Pareto Analysis"
            description="Request type distribution and cumulative percentage"
        >
            <ResponsiveContainer
                width="100%"
                height={selectedChart === "all" ? 350 : 500}
            >
                <ComposedChart
                    data={paretoData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis
                        dataKey="type"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        interval={0}
                        tick={{ fontSize: 11, fill: textColor }}
                        stroke={axisColor}
                    />
                    <YAxis
                        yAxisId="left"
                        orientation="left"
                        stroke={COLORS.primary}
                        tick={{ fontSize: 12, fill: textColor }}
                        label={{
                            value: "Count",
                            angle: -90,
                            position: "insideLeft",
                            style: { fontSize: 12, fill: textColor },
                        }}
                    />
                    <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke={COLORS.danger}
                        tick={{ fontSize: 12, fill: textColor }}
                        label={{
                            value: "Cumulative %",
                            angle: 90,
                            position: "insideRight",
                            style: { fontSize: 12, fill: textColor },
                        }}
                        domain={[0, 100]}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend content={<CustomLegend />} />
                    <Bar
                        yAxisId="left"
                        dataKey="count"
                        fill={COLORS.primary}
                        name="Count"
                        radius={[8, 8, 0, 0]}
                    />
                    <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="cumulative"
                        stroke={COLORS.danger}
                        strokeWidth={3}
                        name="Cumulative %"
                        dot={{
                            r: 5,
                            fill: COLORS.danger,
                            strokeWidth: 2,
                            stroke: isDark ? "#1f2937" : "#fff",
                        }}
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </ChartCard>
    );

    const RatingsChart = () => (
        <ChartCard
            title={
                isManagerView
                    ? "Average Rating by Employee"
                    : "Your Average Rating"
            }
            description="Employee performance ratings (out of 5)"
        >
            <ResponsiveContainer
                width="100%"
                height={selectedChart === "all" ? 350 : 500}
            >
                <BarChart
                    data={ratingData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        tick={{ fontSize: 12, fill: textColor }}
                        stroke={axisColor}
                    />
                    <YAxis
                        domain={[0, 5]}
                        tick={{ fontSize: 12, fill: textColor }}
                        stroke={axisColor}
                        label={{
                            value: "Rating",
                            angle: -90,
                            position: "insideLeft",
                            style: { fontSize: 14, fill: textColor },
                        }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend content={<CustomLegend />} />
                    <Bar
                        dataKey="rating"
                        fill={COLORS.tertiary}
                        name="Avg Rating"
                        radius={[8, 8, 0, 0]}
                    >
                        {ratingData.map((entry, index) => {
                            const rating = entry.rating;
                            let color = COLORS.danger;
                            if (rating >= 4.5) color = "#10b981";
                            else if (rating >= 4) color = "#84cc16";
                            else if (rating >= 3.5) color = COLORS.tertiary;
                            else if (rating >= 3) color = "#f97316";

                            return <Cell key={`cell-${index}`} fill={color} />;
                        })}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </ChartCard>
    );

    /* ----------------------------- RENDER SELECTED CHART ----------------------------- */
    const renderChart = () => {
        switch (selectedChart) {
            case "responseTime":
                return <ResponseTimeChart />;
            case "dailyTickets":
                return <DailyTicketsChart />;
            case "ticketsHandled":
                return <TicketsHandledChart />;
            case "issueResponse":
                return <IssueResponseChart />;
            case "optionResponse":
                return <OptionResponseChart />;
            case "pareto":
                return <ParetoChart />;
            case "ratings":
                return <RatingsChart />;
            default:
                return (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        <ResponseTimeChart />
                        <DailyTicketsChart />
                        <TicketsHandledChart />
                        <IssueResponseChart />
                        <OptionResponseChart />
                        <ParetoChart />
                        <RatingsChart />
                    </div>
                );
        }
    };

    /* ----------------------------- UI LAYOUT ----------------------------- */
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight">
                    Dashboard{" "}
                    <span className="text-sm opacity-60">
                        ({getRoleLabel()})
                    </span>
                </h2>
            }
        >
            <Head title="Dashboard" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                        {[
                            {
                                label: "Total Tickets",
                                value: dashboard.closureRate.total_tickets,
                                textColor: "text-blue-600 dark:text-blue-400",
                                icon: "📊",
                                bgIcon: "bg-blue-100 dark:bg-blue-900/30",
                            },
                            {
                                label: "Resolved",
                                value: dashboard.closureRate.resolved_tickets,
                                textColor: "text-green-600 dark:text-green-400",
                                icon: "✅",
                                bgIcon: "bg-green-100 dark:bg-green-900/30",
                            },
                            {
                                label: "Unhandled",
                                value: dashboard.closureRate.unhandled_tickets,
                                textColor: "text-red-600 dark:text-red-400",
                                icon: "⏳",
                                bgIcon: "bg-red-100 dark:bg-red-900/30",
                            },
                            {
                                label: "Closure Rate",
                                value: dashboard.closureRate.closure_rate + "%",
                                textColor:
                                    "text-purple-600 dark:text-purple-400",
                                icon: "📈",
                                bgIcon: "bg-purple-100 dark:bg-purple-900/30",
                            },
                        ].map((card, i) => (
                            <div
                                key={i}
                                className="bg-base-100 overflow-hidden shadow-md sm:rounded-xl p-6 hover:shadow-lg transition-all duration-300 border border-base-300"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="text-sm font-medium text-base-content/60">
                                        {card.label}
                                    </div>
                                    <div
                                        className={`${card.bgIcon} w-12 h-12 rounded-lg flex items-center justify-center`}
                                    >
                                        <span className="text-2xl">
                                            {card.icon}
                                        </span>
                                    </div>
                                </div>
                                <div
                                    className={`text-3xl font-bold ${card.textColor} mb-1`}
                                >
                                    {card.value}
                                </div>
                                {isManagerView &&
                                    card.label !== "Closure Rate" && (
                                        <div className="text-xs text-base-content/50 mt-2 font-medium">
                                            Team Total
                                        </div>
                                    )}
                            </div>
                        ))}
                    </div>

                    {/* Chart Selector */}
                    <div className="mb-6 flex items-center justify-between bg-base-100 p-4 rounded-xl shadow-md border border-base-300">
                        <label
                            htmlFor="chart-selector"
                            className="text-sm font-medium text-base-content/70"
                        >
                            Select Chart View:
                        </label>
                        <select
                            id="chart-selector"
                            value={selectedChart}
                            onChange={(e) => setSelectedChart(e.target.value)}
                            className="select select-neutral"
                        >
                            {chartOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Charts Display */}
                    {selectedChart === "all" ? (
                        renderChart()
                    ) : (
                        <div className="w-full">{renderChart()}</div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function ChartCard({ title, description, children }) {
    return (
        <div className="bg-base-100 overflow-hidden shadow-md sm:rounded-xl p-6 border border-base-300 hover:shadow-lg transition-shadow duration-300">
            <div className="mb-6">
                <h3 className="text-lg font-bold text-base-content mb-1">
                    {title}
                </h3>
                {description && (
                    <p className="text-sm text-base-content/60">
                        {description}
                    </p>
                )}
            </div>
            {children}
        </div>
    );
}
