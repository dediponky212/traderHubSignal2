import { X } from "lucide-react";

export default function Modal({
    open,
    title,
    children,
    onClose,
    size = "md",
}) {
    if (!open) return null;

    const sizes = {
        sm: "max-w-md",
        md: "max-w-xl",
        lg: "max-w-3xl",
        xl: "max-w-5xl",
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">

            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
            />

            {/* Modal */}
            <div
                className={`
                    relative
                    z-10
                    w-full
                    ${sizes[size]}
                    rounded-3xl
                    bg-white
                    shadow-2xl
                    mx-4
                `}
            >
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

                    <h2 className="text-xl font-semibold">
                        {title}
                    </h2>

                    <button
                        onClick={onClose}
                        className="cursor-pointer rounded-lg p-2 hover:bg-slate-100"
                    >
                        <X size={20} />
                    </button>

                </div>

                <div className="p-6">
                    {children}
                </div>

            </div>

        </div>
    );
}