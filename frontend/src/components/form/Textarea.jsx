import { forwardRef } from "react";

const Textarea = forwardRef(
    (
        {
            label,
            error,
            rows = 4,
            className = "",
            required = false,
            ...props
        },
        ref
    ) => {
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

                <textarea
                    ref={ref}
                    rows={rows}
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
                        resize-none
                        focus:border-blue-600
                        focus:ring-4
                        focus:ring-blue-100
                        disabled:bg-slate-100
                        disabled:cursor-not-allowed
                        ${error ? "border-red-500" : ""}
                        ${className}
                    `}
                    {...props}
                />

                {error && (
                    <p className="text-sm text-red-500">
                        {error}
                    </p>
                )}
            </div>
        );
    }
);

Textarea.displayName = "Textarea";

export default Textarea;