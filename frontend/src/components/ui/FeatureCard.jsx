export default function FeatureCard({
    icon: Icon,
    title,
    description,
}) {
    return (
        <div
            className="
            group
            rounded-3xl
            border
            border-slate-200
            bg-white
            p-8
            transition-all
            duration-300
            hover:-translate-y-2
            hover:border-blue-500
            hover:shadow-xl
        "
        >
            <div
                className="
                inline-flex
                rounded-2xl
                bg-blue-50
                p-4
                text-blue-600
                transition
                group-hover:bg-blue-600
                group-hover:text-white
            "
            >
                <Icon size={30} />
            </div>

            <h3 className="mt-6 text-xl font-bold text-slate-900">
                {title}
            </h3>

            <p className="mt-4 leading-7 text-slate-500">
                {description}
            </p>
        </div>
    );
}