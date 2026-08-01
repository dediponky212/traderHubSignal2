import { Link } from "react-router-dom";
import Input from "../components/form/Input";
import Button from "../components/ui/Button";

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-10 shadow-xl">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-slate-900">
                        Welcome Back
                    </h1>
                    <p className="mt-3 text-slate-500">
                        Login ke akun Forex Hub Anda.
                    </p>
                </div>

                <form className="space-y-5">
                    <Input
                        label="Email"
                        type="email"
                        placeholder="you@example.com"
                    />
                    <Input
                        label="Password"
                        type="password"
                        placeholder="********"
                    />
                    <button className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700"
                  >
                      Login
                  </button>

                </form>

                <p className="mt-8 text-center text-sm text-slate-500">
                    Belum punya akun?{" "}
                    <Link
                        to="/register"
                        className="font-semibold text-blue-600"
                    >
                        Register
                    </Link>
                </p>

            </div>

        </div>
    );
}