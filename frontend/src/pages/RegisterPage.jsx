import { Link, useNavigate, Navigate } from "react-router-dom";
import { useState } from "react";

import Input from "../components/form/Input";
import { register } from "../services/authService";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
    const {user} = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({
        fullname: "",
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // State baru untuk mengontrol kemunculan popup sukses
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);

    // Hooks above must always run in the same order every render - the
    // early return has to come after all of them (matches LoginPage.jsx),
    // otherwise React throws "Rendered fewer hooks than expected" the
    // moment `user` flips from null to an object (e.g. an already-logged-in
    // visitor landing on /register while AuthContext's initial /me call
    // resolves) and this page just crashes.
    if (user) {
        return <Navigate to="/dashboard" replace/>;
    }

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        
        if (form.password !== form.confirmPassword) {
            return setError("Password confirmation does not match.");
        }

        try {
            setLoading(true);
            await register({
                fullname: form.fullname,
                username: form.username,
                email: form.email,
                password: form.password,
            });
            
            // Tampilkan popup kustom alih-alih alert()
            setShowSuccessPopup(true);
            
            // Redirect otomatis setelah 3 detik
            setTimeout(() => {
                navigate("/login", { replace: true });
            }, 3000);
            
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Registration failed."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center bg-slate-50 px-6">
            
            {/* --- POPUP SUKSES KUSTOM --- */}
            {showSuccessPopup && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
                    <div className="w-full max-w-sm transform rounded-3xl bg-white p-8 text-center shadow-2xl transition-all">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                        <h3 className="mb-2 text-2xl font-bold text-slate-800">Registration Success!</h3>
                        <p className="mb-6 text-slate-500">Welcome to TraderHub, {form.fullname}. We are redirecting you to the login page...</p>
                        <div className="mx-auto h-1 w-24 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full animate-pulse bg-green-500"></div>
                        </div>
                    </div>
                </div>
            )}
            {/* --------------------------- */}

            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-10 shadow-xl">
                <div className="mb-8 flex flex-col items-center gap-4">
                    <img src="/img/logo.png" alt="TraderHub" className="h-12 w-12 rounded-xl shadow-md" />
                    <div className="text-center">
                        <h1 className="text-3xl font-bold">Create Account</h1>
                        <p className="mt-2 text-slate-500">Join TraderHub today.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* ... (Input form kamu biarkan sama seperti sebelumnya) ... */}
                    <Input label="Full Name" name="fullname" value={form.fullname} onChange={handleChange} required />
                    <Input label="Username" name="username" value={form.username} onChange={handleChange} />
                    <Input label="Email" type="email" name="email" value={form.email} onChange={handleChange} required/>
                    <Input label="Password" type="password" name="password" value={form.password} onChange={handleChange} required/>
                    <Input label="Confirm Password" type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} required/>
                    
                    {error && (
                        <p className="text-sm text-red-600">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full cursor-pointer rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
                        {loading ? "Creating..." : "Create Account"}
                    </button>
                </form>

                <p className="mt-8 text-center text-sm text-slate-500">
                    Already have an account?{" "}
                    <Link to="/login" className="font-semibold text-blue-600">
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
}