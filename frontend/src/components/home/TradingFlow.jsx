
import Section from "../ui/Section";
import SectionTitle from "../ui/SectionTitle";import {
    CandlestickChart,
    BrainCircuit,
    Radio,
    Send,
    Users,
    BarChart3,
} from "lucide-react";

const steps = [
    {
        icon: CandlestickChart,
        title: "Market Data",
        color: "bg-slate-800",
    },
    {
        icon: BrainCircuit,
        title: "AI Analysis",
        color: "bg-blue-600",
    },
    {
        icon: Radio,
        title: "Trading Signal",
        color: "bg-emerald-500",
    },
    {
        icon: Send,
        title: "Telegram",
        color: "bg-sky-500",
    },
    {
        icon: Users,
        title: "Copy Trading",
        color: "bg-orange-500",
    },
    {
        icon: BarChart3,
        title: "Portfolio",
        color: "bg-violet-500",
    },
];

export default function TradingFlow() {
    return (
        <Section className="bg-slate-900 text-white">
            <SectionTitle
                title="AI Trading Flow"
                subtitle="Semua proses berjalan otomatis, mulai dari membaca market
                        hingga mendistribusikan sinyal ke berbagai layanan."
            />
                <div className="flex flex-col items-center gap-8 lg:flex-row lg:justify-between">
                    {steps.map((step, index) => {
                        const Icon = step.icon;
                        return (
                            <div
                                key={step.title}
                                className="flex flex-col items-center"
                            >
                                <div className={`flex h-20 w-20 items-center justify-center rounded-3xl ${step.color}`}>
                                    <Icon size={34} />
                                </div>

                                <h3 className="mt-4 font-semibold">
                                    {step.title}
                                </h3>

                                {index < steps.length - 1 && (
                                    <div className="my-4 h-8 w-1 bg-slate-600 lg:hidden"></div>
                                )}
                            </div>
                        );
                    })}
                </div>
        </Section>
    );
}