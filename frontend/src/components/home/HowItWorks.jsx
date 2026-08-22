import Section from "../ui/Section";
import SectionTitle from "../ui/SectionTitle";
import {
    PlugZap,
    RefreshCcw,
    Brain,
    Send,
    Users,
    BarChart3,
} from "lucide-react";

const steps = [
    {
        icon: PlugZap,
        title: "Connect Broker",
        desc: "Hubungkan akun MetaTrader Anda dengan TraderHub hanya sekali."
    },
    {
        icon: RefreshCcw,
        title: "Sync Trading",
        desc: "Semua aktivitas trading tersinkron otomatis secara real-time."
    },
    {
        icon: Brain,
        title: "AI Analysis",
        desc: "AI menganalisa market, portfolio, dan performa trading."
    },
    {
        icon: Send,
        title: "Share Signals",
        desc: "Signal dapat dikirim otomatis ke follower maupun Telegram."
    },
    {
        icon: Users,
        title: "Copy Trading",
        desc: "Biarkan trader lain mengikuti strategi trading Anda."
    },
    {
        icon: BarChart3,
        title: "Portfolio Analytics",
        desc: "Lihat statistik lengkap dan perkembangan akun trading Anda."
    },
];

export default function HowItWorks() {
    return (
        <Section className="bg-slate-50">
            <SectionTitle
                title="How TraderHub Works"
                subtitle="Dari akun trading Anda hingga AI dan komunitas,
                        semuanya berjalan otomatis dalam satu alur sederhana."
                />

                <div className="relative">
                    {/* Garis timeline desktop */}
                    <div className="absolute left-8 top-0 hidden h-full w-0.5 bg-slate-200 lg:block"></div>
                    <div className="space-y-10">

                        {steps.map((step, index) => {
                            const Icon = step.icon;
                            return (
                                <div
                                    key={index}
                                    className="relative flex flex-col gap-6 rounded-3xl bg-white p-8 shadow-sm transition hover:shadow-lg lg:flex-row lg:items-center"
                                >
                                    <div className="z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white">
                                        <Icon size={28} />
                                    </div>

                                    <div className="flex-1">
                                        <div className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-600">
                                            Step {index + 1}
                                        </div>

                                        <h3 className="text-2xl font-bold text-slate-900">
                                            {step.title}
                                        </h3>

                                        <p className="mt-2 leading-7 text-slate-500">
                                            {step.desc}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}

                    </div>
                </div>
        </Section>
    );
}