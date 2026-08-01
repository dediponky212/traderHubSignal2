import { Link, NavLink } from "react-router-dom";
import { TrendingUp } from "lucide-react";

export default function Navbar() {
    return (
        <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-lg">
            <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-6">

                {/* Logo */}
                <Link
                    to="/"
                    className="flex items-center gap-3"
                >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md">
                        <TrendingUp size={20} />
                    </div>

                    <div>
                        <h1 className="text-lg font-bold tracking-tight text-slate-800">
                            Forex Hub
                        </h1>

                        <p className="text-xs text-slate-500">
                            AI Trading Ecosystem
                        </p>
                    </div>
                </Link>

                {/* Menu */}
                <nav className="hidden items-center gap-8 lg:flex">

                    <NavLink
                        to="/"
                        className="text-sm font-medium text-slate-600 transition hover:text-blue-600"
                    >
                        Home
                    </NavLink>

                    <NavLink
                        to="/about"
                        className="text-sm font-medium text-slate-600 transition hover:text-blue-600"
                    >
                        About
                    </NavLink>

                    <NavLink
                        to="/features"
                        className="text-sm font-medium text-slate-600 transition hover:text-blue-600"
                    >
                        Features
                    </NavLink>

                </nav>

                {/* Right */}
                <div className="flex items-center gap-3">

                    <Link
                        to="/login"
                        className="rounded-xl px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                    >
                        Login
                    </Link>

                    <Link
                        to="/register"
                        className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                        Get Started
                    </Link>

                </div>

            </div>
        </header>
    );
}