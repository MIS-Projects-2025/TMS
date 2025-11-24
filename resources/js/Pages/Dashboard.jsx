import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, usePage } from "@inertiajs/react";
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
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-base-100 p-3 rounded shadow-lg border text-sm">
                <p className="font-semibold mb-1">{label}</p>
                {payload.map((entry, i) => (
                    <p key={i} style={{ color: entry.color || "#000" }}>
                        {entry.name}: {parseFloat(entry.value).toFixed(2)}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

export default function Dashboard() {
    const { dashboard, userRole } = usePage().props;

    /* ----------------------------- DATA CLEANING ----------------------------- */
    const responseTimeData = dashboard.responseTime.map((i) => ({
        name: i.emp_name,
        avg: Number(i.avg_response_minutes),
        min: Number(i.min_response_minutes),
        max: Number(i.max_response_minutes),
    }));

    const dailyData = dashboard.ticketsPerDay.map((i) => ({
        day: i.day,
        total: Number(i.total),
    }));

    const handledData = dashboard.ticketsHandled.map((i) => ({
        name: i.emp_name,
        total: Number(i.total),
    }));

    const issueResponseData = dashboard.avgResponseTimePerIssue.map((i) => ({
        issue: i.TYPE_OF_REQUEST || i.issue_type,
        avg: Number(i.avg_minutes),
        count: Number(i.count),
    }));

    const paretoData = dashboard.paretoByType.map((i) => ({
        type: i.TYPE_OF_REQUEST || i.request_type,
        count: Number(i.count),
        cumulative: Number(i.cumulative_percentage),
    }));

    const ratingData = dashboard.avgRatingPerEmployee.map((i) => ({
        name: i.emp_name,
        rating: Number(i.avg_rating),
        total: Number(i.total_ratings),
    }));

    /* ----------------------------- UI LAYOUT ----------------------------- */
    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />

            <div className="p-6">
                <h1 className="text-3xl font-bold mb-6">
                    Dashboard{" "}
                    {userRole === "support" && (
                        <span className="text-sm text-base-content/60">
                            (Your Performance)
                        </span>
                    )}
                </h1>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
                    {[
                        {
                            label: "Total Tickets",
                            value: dashboard.closureRate.total_tickets,
                            color: "text-blue-600",
                        },
                        {
                            label: "Resolved",
                            value: dashboard.closureRate.resolved_tickets,
                            color: "text-green-600",
                        },
                        {
                            label: "Unhandled",
                            value: dashboard.closureRate.unhandled_tickets,
                            color: "text-red-600",
                        },
                        {
                            label: "Closure Rate",
                            value: dashboard.closureRate.closure_rate + "%",
                            color: "text-purple-600",
                        },
                    ].map((card, i) => (
                        <div
                            key={i}
                            className="p-4 rounded-lg shadow bg-base-100"
                        >
                            <h3 className="text-sm font-semibold text-gray-500">
                                {card.label}
                            </h3>
                            <p className={`text-3xl font-bold ${card.color}`}>
                                {card.value}
                            </p>
                        </div>
                    ))}
                </div>

                {/* ================= Two charts per row ================= */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Response Time */}
                    <ChartCard title="Response Time (Minutes)">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={responseTimeData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Bar
                                    dataKey="avg"
                                    fill="#4A90E2"
                                    name="Average"
                                />
                                <Bar
                                    dataKey="min"
                                    fill="#7ED321"
                                    name="Minimum"
                                />
                                <Bar
                                    dataKey="max"
                                    fill="#F5A623"
                                    name="Maximum"
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    {/* Tickets Per Day */}
                    <ChartCard title="Tickets Per Day">
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={dailyData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="day" />
                                <YAxis />
                                <Tooltip content={<CustomTooltip />} />
                                <Line
                                    type="monotone"
                                    dataKey="total"
                                    stroke="#4A90E2"
                                    strokeWidth={2}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    {/* Tickets Handled */}
                    <ChartCard title="Tickets Handled">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={handledData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="total" fill="#7ED321" />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    {/* Avg Response Time Per Issue */}
                    <ChartCard title="Average Response Time Per Issue Type">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={issueResponseData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="issue" />
                                <YAxis />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="avg" fill="#FF6F61" />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    {/* Pareto Chart */}
                    <ChartCard title="Pareto Chart - Request Types">
                        <ResponsiveContainer width="100%" height={300}>
                            <ComposedChart data={paretoData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="type" />
                                <YAxis yAxisId="left" />
                                <YAxis yAxisId="right" orientation="right" />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Bar
                                    yAxisId="left"
                                    dataKey="count"
                                    fill="#4A90E2"
                                    name="Count"
                                />
                                <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="cumulative"
                                    stroke="#FF6F61"
                                    strokeWidth={3}
                                    name="Cumulative %"
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    {/* Ratings */}
                    <ChartCard title="Average Rating Per Employee">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={ratingData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis domain={[0, 5]} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="rating" fill="#F5A623" />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function ChartCard({ title, children }) {
    return (
        <div className="p-4 bg-base-100 shadow rounded-xl">
            <h2 className="font-semibold text-lg mb-4">{title}</h2>
            {children}
        </div>
    );
}
