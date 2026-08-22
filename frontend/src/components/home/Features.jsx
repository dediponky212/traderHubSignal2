import Section from "../ui/Section";
import SectionTitle from "../ui/SectionTitle";
import FeatureCard from "../ui/FeatureCard";
import {Brain,Bot,Users,BarChart3,Send,Store,
} from "lucide-react";


const features = [
    {
        icon: Brain,
        title: "AI Market Analysis",
        description:
            "Analisa teknikal dan fundamental secara otomatis menggunakan AI untuk membantu pengambilan keputusan trading.",
    },
    {
        icon: Bot,
        title: "AI Robot Builder",
        description:
            "Bangun robot trading AI dengan konfigurasi Anda sendiri tanpa perlu mengubah kode program.",
    },
    {
        icon: Users,
        title: "Copy Trading",
        description:
            "Ikuti trader terbaik atau bagikan strategi trading Anda kepada ribuan pengguna lainnya.",
    },
    {
        icon: BarChart3,
        title: "Portfolio Analytics",
        description:
            "Pantau performa akun trading, win rate, drawdown, dan statistik lainnya secara real-time.",
    },
    {
        icon: Send,
        title: "Signal Distribution",
        description:
            "Distribusikan sinyal otomatis ke Telegram, Discord, atau komunitas Anda hanya dengan satu klik.",
    },
    {
        icon: Store,
        title: "Strategy Marketplace",
        description:
            "Publikasikan strategi trading Anda dan bangun komunitas follower untuk mendapatkan penghasilan tambahan.",
    },
];

export default function Features() {
    return (
        <Section className="bg-slate-50">
            <div className="mb-16">
                <SectionTitle
                    title="Everything You Need to Trade Smarter"
                    subtitle="TraderHub menggabungkan AI, otomatisasi, analitik, dan copy trading ke dalam satu platform modern."
                />
            </div>
                <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">

                    {features.map((feature) => (
                        <FeatureCard
                            key={feature.title}
                            {...feature}
                        />
                    ))}

                </div>
        </Section>
    );
}