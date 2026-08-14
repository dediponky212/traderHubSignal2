import { Link, useNavigate, Navigate } from "react-router-dom";
import { useState } from "react";

import Input from "../components/form/Input";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {

    const { login, user } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
        if (user) {
            return <Navigate to="/dashboard" replace />;
        }
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            await login(email, password);
            navigate("/dashboard", { replace: true });
        } catch (err) {
            setError(
                err.response?.data?.message || "Login failed"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-10 shadow-xl">

                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-slate-900">Welcome Back</h1>
                    <p className="mt-3 text-slate-500">Login ke akun Forex Hub Anda.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                    <Input label="Email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)}/>

                    <Input label="Password" type="password" placeholder="********" value={password} onChange={(e) => setPassword(e.target.value)}/>
                    {error && (<p className="text-sm text-red-600">{error}</p>)}

                    <button type="submit" disabled={loading} className="
                            w-full
                            rounded-xl
                            bg-blue-600
                            py-3
                            font-semibold
                            text-white
                            transition
                            hover:bg-blue-700
                            disabled:opacity-50
                        ">
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>

                <p className="mt-8 text-center text-sm text-slate-500">
                    Belum punya akun?{" "}
                    <Link to="/register" className="font-semibold text-blue-600">Register</Link>
                </p>

            </div>
        </div>
    );
}