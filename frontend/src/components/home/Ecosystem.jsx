import Section from "../ui/Section";
import SectionTitle from "../ui/SectionTitle";
import {Brain,Bot,BarChart3,Send,Users,Database,ArrowRightLeft,
} from "lucide-react";

const nodes = [
    { icon: Bot, title: "MetaTrader", color: "bg-blue-500" },
    { icon: Brain, title: "AI Engine", color: "bg-violet-500" },
    { icon: Database, title: "Portfolio", color: "bg-emerald-500" },
    { icon: Send, title: "Signal Hub", color: "bg-cyan-500" },
    { icon: Users, title: "Copy Trading", color: "bg-orange-500" },
    { icon: BarChart3, title: "Analytics", color: "bg-pink-500" },
];

export default function Ecosystem() {
    return (
        <Section className="bg-white">
                <SectionTitle
                    title="One Ecosystem Endless Possibilities."
                     subtitle="Semua layanan TraderHub saling terhubung untuk
                        menciptakan pengalaman trading yang lebih cerdas,
                        cepat, dan otomatis."
                />
                <div className="grid md:grid-cols-3 gap-8">
                    {nodes.map((node) => {
                        const Icon = node.icon;
                        return (
                            <div
                                key={node.title}
                                className="group rounded-3xl border border-slate-200 bg-slate-50 p-8 hover:shadow-xl transition-all hover:-translate-y-2"
                            >
                                <div className={`w-16 h-16 rounded-2xl ${node.color} flex items-center justify-center text-white`}>
                                    <Icon size={30} />
                                </div>
                                <h3 className="mt-6 text-xl font-bold">
                                    {node.title}
                                </h3>
                                <p className="mt-4 text-slate-500 leading-7">
                                    Terintegrasi langsung dengan seluruh
                                    layanan TraderHub untuk memberikan
                                    pengalaman trading modern.
                                </p>
                            </div>
                        );

                    })}
                </div>

                <div className="mt-12 flex justify-center">
                    <ArrowRightLeft
                        className="text-blue-600"
                        size={42}
                    />
                </div>
        </Section>
    );
}