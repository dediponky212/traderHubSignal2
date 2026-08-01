import { forwardRef } from "react";

const Checkbox = forwardRef(
    (
        {
            label,
            className = "",
            ...props
        },
        ref
    ) => {
        return (
            <label className="flex items-center gap-3 cursor-pointer">

                <input
                    ref={ref}
                    type="checkbox"
                    className={`
                        h-5
                        w-5
                        rounded
                        border-slate-300
                        text-blue-600
                        focus:ring-blue-500
                        ${className}
                    `}
                    {...props}
                />

                <span className="text-sm text-slate-700">
                    {label}
                </span>

            </label>
        );
    }
);

Checkbox.displayName = "Checkbox";

export default Checkbox;