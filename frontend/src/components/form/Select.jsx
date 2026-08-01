import { forwardRef } from "react";

const Select = forwardRef(
    (
        {
            label,
            error,
            options = [],
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

                <select
                    ref={ref}
                    className={`
                        w-full
                        rounded-xl
                        border
                        border-slate-300
                        bg-white
                        px-4
                        py-3
                        outline-none
                        transition-all
                        duration-200
                        focus:border-blue-600
                        focus:ring-4
                        focus:ring-blue-100
                        ${error ? "border-red-500" : ""}
                        ${className}
                    `}
                    {...props}
                >
                    {options.map((option) => (
                        <option
                            key={option.value}
                            value={option.value}
                        >
                            {option.label}
                        </option>
                    ))}
                </select>

                {error && (
                    <p className="text-sm text-red-500">
                        {error}
                    </p>
                )}
            </div>
        );
    }
);

Select.displayName = "Select";

export default Select;