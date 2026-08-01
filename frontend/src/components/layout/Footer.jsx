import { Link } from "react-router-dom";
import {
    TrendingUp,
    Mail,
    Send,
    Globe,
    Code2,
} from "lucide-react";

export default function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer className="border-t border-slate-200 bg-slate-900 text-slate-300">
            <div className="mx-auto max-w-7xl px-6 py-16">

                <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">

                    {/* Brand */}
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                                <TrendingUp size={20} />
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-white">
                                    Forex Hub
                                </h3>
                                <p className="text-sm text-slate-400">
                                    AI Trading Ecosystem
                                </p>
                            </div>
                        </div>

                        <p className="mt-5 text-sm leading-7 text-slate-400">
                            Platform modern untuk AI Trading, Portfolio Analytics,
                            Copy Trading, Signal Distribution, dan Strategy Marketplace.
                        </p>
                    </div>

                    {/* Platform */}
                    <div>
                        <h4 className="mb-4 font-semibold text-white">
                            Platform
                        </h4>

                        <ul className="space-y-3 text-sm">
                            <li><Link to="/" className="hover:text-white">Home</Link></li>
                            <li><Link to="/about" className="hover:text-white">About</Link></li>
                            <li><Link to="/features" className="hover:text-white">Features</Link></li>
                            <li><Link to="/register" className="hover:text-white">Get Started</Link></li>
                        </ul>
                    </div>

                    {/* Resources */}
                    <div>
                        <h4 className="mb-4 font-semibold text-white">
                            Resources
                        </h4>

                        <ul className="space-y-3 text-sm">
                            <li><a href="#" className="hover:text-white">Documentation</a></li>
                            <li><a href="#" className="hover:text-white">API</a></li>
                            <li><a href="#" className="hover:text-white">Support</a></li>
                            <li><a href="#" className="hover:text-white">FAQ</a></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="mb-4 font-semibold text-white">
                            Contact
                        </h4>

                        <div className="space-y-4 text-sm">

                            <div className="flex items-center gap-3">
                                <Mail size={18} />
                                <span>support@forexhub.ai</span>
                            </div>

                            <div className="flex items-center gap-3">
                                <Send size={18} />
                                <span>Telegram Community</span>
                            </div>

                            <div className="flex items-center gap-3">
                                <Code2 size={18} />
                                <span>GitHub</span>
                            </div>

                            <div className="flex items-center gap-3">
                                <Globe size={18} />
                                <span>www.forexhub.ai</span>
                            </div>

                        </div>
                    </div>

                </div>

                <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-8 text-sm md:flex-row">

                    <p className="text-slate-500">
                        © {year} Forex Hub. All rights reserved.
                    </p>

                    <div className="flex gap-6 text-slate-500">
                        <a href="#">Privacy Policy</a>
                        <a href="#">Terms of Service</a>
                        <a href="#">Cookies</a>
                    </div>

                </div>

            </div>
        </footer>
    );
}