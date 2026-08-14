import Section from "../ui/Section";
import Container from "../ui/Container";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import { ArrowRight, Play, Brain, TrendingUp, Users } from "lucide-react";

export default function Hero() {
    return (
        <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-blue-50 to-slate-100">

            {/* Background Blur */}
            <div className="absolute left-0 top-0 h-96 w-96 rounded-full bg-blue-300 blur-3xl opacity-40"></div>
            <div className="absolute right-0 top-20 h-96 w-96 rounded-full bg-cyan-200 blur-3xl opacity-40"></div>

            <Container className="relative py-24">
                <div className="flex flex-col items-center gap-16 lg:flex-row">

                {/* Left */}
                <div className="flex-1">

                    <div className="mb-6">
                        <Badge>
                            🚀 Next Generation AI Trading Platform
                        </Badge>
                    </div>

                    <h1 className="text-5xl font-extrabold leading-tight text-slate-900 lg:text-6xl">
                        Trade Smarter.
                        <br />
                        Grow Faster.
                    </h1>

                    <p className="mt-8 max-w-xl text-lg leading-8 text-slate-600">
                        Forex Hub membantu trader menganalisa market menggunakan AI,
                        membangun robot trading, melakukan copy trading,
                        mengelola portfolio,
                        dan mengirim signal secara otomatis
                        dalam satu platform modern.
                    </p>

                    <div className="mt-10 flex flex-wrap gap-4">
                        <Button size="lg">
                            Start Free
                        </Button>
                        <Button variant="secondary" size="lg">
                            Watch Demo
                        </Button>
                    </div>

                    <div className="mt-10 flex flex-wrap gap-8"><div>

                        <h2 className="text-3xl font-bold text-slate-900"> 50K+</h2>
                            <p className="text-slate-500">
                                Signals Delivered
                            </p>
                    </div>

                        <div>
                            <h2 className="text-3xl font-bold text-slate-900">
                                1200+
                            </h2>
                            <p className="text-slate-500">
                                Active Traders
                            </p>
                        </div>

                        <div>
                            <h2 className="text-3xl font-bold text-slate-900">
                                99.9%
                            </h2>
                            <p className="text-slate-500">
                                Uptime
                            </p>
                        </div>

                    </div>
                </div>

                {/* Right */}

                <div className="flex flex-1 justify-center">
                    <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl">

                        <div className="mb-8 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">
                                    AI Portfolio
                                </h3>
                                <p className="text-sm text-slate-500">
                                    Real Time Dashboard
                                </p>
                            </div>

                            <div className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                                +12.8%
                            </div>
                        </div>

                        <div className="space-y-5">
                            <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                                <div className="flex items-center gap-3">
                                    <Brain className="text-blue-600" />
                                    <span className="font-medium">
                                        AI Score
                                    </span>
                                </div>
                                <span className="font-bold">
                                    97/100
                                </span>
                            </div>

                            <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                                <div className="flex items-center gap-3">
                                    <TrendingUp className="text-green-600" />
                                    <span className="font-medium">
                                        Win Rate
                                    </span>
                                </div>
                                <span className="font-bold">
                                    84%
                                </span>
                            </div>

                            <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                                <div className="flex items-center gap-3">
                                    <Users className="text-orange-500" />
                                    <span className="font-medium">
                                        Followers
                                    </span>
                                </div>
                                <span className="font-bold">
                                    1,284
                                </span>
                            </div>
                        </div>

                        <div className="mt-8 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-400 p-6 text-white">

                            <h3 className="text-sm">
                                Today's Profit
                            </h3>
                            <p className="mt-2 text-4xl font-bold">
                                +$1,248
                            </p>
                            <p className="mt-2 text-blue-100">
                                AI Recommendation :<br></br>
                                Continue Current Strategy
                            </p>
                        </div>

                    </div>
                </div>
                
            </div>
         </Container>
        </section>
    );
}