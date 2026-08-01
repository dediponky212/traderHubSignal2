import {
    TrendingUp,
    ShieldCheck,
    Cpu,
    Bot,
    BarChart3,
    Globe
} from "lucide-react";

const items = [
    {
        icon: TrendingUp,
        title: "MetaTrader",
    },
    {
        icon: Bot,
        title: "AI Engine",
    },
    {
        icon: ShieldCheck,
        title: "Secure API",
    },
    {
        icon: BarChart3,
        title: "Trading Analytics",
    },
    {
        icon: Globe,
        title: "Cloud Platform",
    },
    {
        icon: Cpu,
        title: "Automation",
    },
];

export default function Trusted() {
    return (
        <section className="py-20">

            <div className="max-w-7xl mx-auto px-6">

                <p className="text-center text-slate-500 font-medium tracking-widest uppercase">

                    Built With Modern Technology

                </p>

                <div className="mt-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">

                    {items.map((item, index) => {

                        const Icon = item.icon;

                        return (

                            <div
                                key={index}
                                className="rounded-2xl border border-slate-200 bg-white p-6 hover:border-blue-300 hover:shadow-lg transition-all duration-300 flex flex-col items-center"
                            >

                                <Icon
                                    size={34}
                                    className="text-blue-600"
                                />

                                <p className="mt-4 font-semibold text-slate-700">

                                    {item.title}

                                </p>

                            </div>

                        );

                    })}

                </div>

            </div>

        </section>
    );
}