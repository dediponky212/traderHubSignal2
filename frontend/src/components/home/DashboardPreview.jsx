import Section from "../ui/Section";
import SectionTitle from "../ui/SectionTitle";
import Card from "../ui/Card";
import StatCard from "../ui/StartCard";
import {Brain,TrendingUp,Users,Activity,ArrowUpRight,
} from "lucide-react";

export default function DashboardPreview() {
    return (
        <Section className="py-24 bg-white">
            <div className="text-center max-w-3xl mx-auto">
                <SectionTitle
                     title="Everything in One Dashboard"
                     subtitle="Pantau AI, portfolio, followers, dan performa trading
                        Anda secara real-time melalui dashboard modern yang
                        dirancang khusus untuk trader profesional."
                    />
            </div>

                <div className="mt-16 rounded-[32px] border border-slate-200 bg-slate-50 p-8 shadow-xl">
                    {/* Top */}
                    <div className="flex items-center justify-between border-b border-slate-200 pb-6">
                        <div>
                            <h3 className="text-xl font-bold">
                                AI Portfolio Dashboard
                            </h3>
                            <p className="text-slate-500">
                                Live Trading Statistics
                            </p>
                        </div>
                        <button className="rounded-xl bg-blue-600 px-5 py-2 text-white">
                            Live
                        </button>
                    </div>

                    {/* Cards */}

                    <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                        <StatCard
                            icon={<Brain />}
                            title="AI Score"
                            value="97/100"
                            color="text-blue-600"
                        />
                        <StatCard
                            icon={<TrendingUp />}
                            title="Today's Profit"
                            value="+$1,248"
                            color="text-green-600"
                        />
                        <StatCard
                            icon={<Users />}
                            title="Followers"
                            value="1,284"
                            color="text-orange-500"
                        />
                        <StatCard
                            icon={<Activity />}
                            title="Win Rate"
                            value="84%"
                            color="text-purple-600"
                        />
                    </div>

                    {/* Fake Chart */}

                    <div className="mt-10 rounded-3xl bg-white p-8 border border-slate-200">
                        <div className="flex justify-between">
                            <div>
                                <h4 className="font-semibold">Portfolio Growth</h4>
                                <p className="text-sm text-slate-500">Last 30 Days</p>

                            </div>
                            <ArrowUpRight className="text-green-600" />
                        </div>

                        <div className="mt-8 h-56 rounded-2xl bg-gradient-to-r from-blue-100 via-cyan-50 to-green-100 flex items-center justify-center">
                            <span className="text-slate-400">
                                Chart Preview
                            </span>
                        </div>
                    </div>
                </div>

        </Section>
    );
}