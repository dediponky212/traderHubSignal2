export default function Card({ children, className = "",
}) {
    return (
        <div className={`
                rounded-3xl
                border
                border-slate-200
                bg-white
                p-8
                transition-all
                duration-300
                hover:-translate-y-1
                hover:shadow-xl
                ${className}`}>
            {children}
        </div>
    );
}