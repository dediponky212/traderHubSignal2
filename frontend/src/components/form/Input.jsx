import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const Input = forwardRef(
    (
        {
            label,
            error,
            hint,
            className = "",
            required = false,
            type = "text",
            ...props
        },
        ref
    ) => {
        // Every type="password" field using this shared component (Login,
        // Register, ...) gets a show/hide toggle for free - no per-page work.
        const isPassword = type === "password";
        const [visible, setVisible] = useState(false);

        return (
            <div className="space-y-2">
                {label && (
                    <label className="block text-sm font-medium text-slate-700">
                        {label}
                        {required && (
                            <span className="ml-1 text-red-500">*</span>
                        )}
                    </label>
                )}

                <div className="relative">
                    <input
                        ref={ref}
                        type={isPassword && visible ? "text" : type}
                        className={`
                            w-full
                            rounded-xl
                            border
                            border-slate-300
                            bg-white
                            px-4
                            py-3
                            text-slate-800
                            outline-none
                            transition-all
                            duration-200
                            focus:border-blue-600
                            focus:ring-4
                            focus:ring-blue-100
                            disabled:bg-slate-100
                            disabled:cursor-not-allowed
                            ${isPassword ? "pr-11" : ""}
                            ${error ? "border-red-500" : ""}
                            ${className}
                        `}
                        {...props}
                    />

                    {isPassword && (
                        <button
                            type="button"
                            onClick={() => setVisible((v) => !v)}
                            tabIndex={-1}
                            className="absolute inset-y-0 right-0 flex cursor-pointer items-center px-3 text-slate-400 hover:text-slate-600"
                        >
                            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    )}
                </div>

                {error ? (
                    <p className="text-sm text-red-500">
                        {error}
                    </p>
                ) : hint ? (
                    <p className="text-xs text-slate-400">
                        {hint}
                    </p>
                ) : null}
            </div>
        );
    }
);

Input.displayName = "Input";

export default Input;