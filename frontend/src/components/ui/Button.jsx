export default function Button({
    children,
    variant = "primary",
    size = "md",
    className = "",
    ...props
}) {
    const variants = {
        primary:
            "bg-blue-600 text-white hover:bg-blue-700",

        secondary:
            "bg-white text-slate-800 border border-slate-300 hover:bg-slate-100",

        outline:
            "border border-blue-600 text-blue-600 hover:bg-blue-50",
    };

    const sizes = {
        sm: "px-4 py-2 text-sm",
        md: "px-6 py-3 text-base",
        lg: "px-8 py-4 text-lg",
    };

    return (
        <button
            className={`
                inline-flex
                items-center
                justify-center
                rounded-xl
                font-semibold
                transition-all
                duration-300
                ${variants[variant]}
                ${sizes[size]}
                ${className}
            `}
            {...props}
        >
            {children}
        </button>
    );
}