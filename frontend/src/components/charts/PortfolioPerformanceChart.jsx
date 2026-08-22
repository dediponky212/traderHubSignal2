import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Filler,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

export default function PortfolioPerformanceChart({ data = [] }) {
    if (!data.length) {
        return <div className="flex h-64 w-full items-center justify-center rounded-2xl bg-slate-50 text-sm text-slate-400">No performance data.</div>;
    }

    const labels = data.map((item) => item.label);
    const values = data.map((item) => Number(item.value) || 0);

    const chartData = {
        labels,
        datasets: [
            {
                label: "Equity",
                data: values,
                borderColor: "rgb(37, 99, 235)",
                backgroundColor: "rgba(37, 99, 235, 0.08)",
                fill: true,
                tension: 0.35,
                pointRadius: 0,
                pointHoverRadius: 4,
                borderWidth: 2,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: "index" },
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (context) => `Equity: ${Number(context.raw).toLocaleString("en-US", { maximumFractionDigits: 2 })}`,
                },
            },
        },
        scales: {
            x: {
                display: false,
                grid: { display: false },
                border: { display: false },
            },
            y: {
                border: { display: false },
                grid: { color: "rgba(148, 163, 184, 0.15)" },
                ticks: {
                    callback: (value) => Number(value).toLocaleString("en-US", { maximumFractionDigits: 0 }),
                },
            },
        },
    };

    return (
        <div className="h-64 w-full min-w-0 max-w-full overflow-hidden">
            <Line data={chartData} options={options} />
        </div>
    );
}