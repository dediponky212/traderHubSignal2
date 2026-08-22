import { economicEvents } from "../../data/economicEvents";

export default function EconomicCalendar() {
    const impactColor = (impact) => {
        switch (impact) {
            case "high":
                return "🔴";
            case "medium":
                return "🟠";
            default:
                return "🟢";
        }

    };

    return (
        <section className="mt-10">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold">
                        🗓 Economic Calendar
                    </h2>
                    <p className="text-sm pl-8 text-slate-500">
                        Today's economic events
                    </p>
                </div>
            </div>

            <div
                className="
                    no-scrollbar
                    overflow-auto
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white
                "
            >
                <div
                    className="
                        grid
                        grid-cols-[50px_60px_50px_1fr_60px]
                        gap-2
                        border-b
                        bg-slate-50
                        px-6
                        py-4
                        text-sm
                        font-semibold
                        text-slate-500
                        min-w-[450px]
                    "
                >
                    <span>Time</span>
                    <span>Impact</span>
                    <span>Cur</span>
                    <span>Event</span>
                    <span>Forecast</span>
                </div>

                {economicEvents.map((item) => (
                    <div
                        key={item.id}
                        className="
                            group
                            grid
                            cursor-pointer
                            grid-cols-[50px_60px_50px_1fr_60px]
                            gap-2
                            border-b
                            border-slate-100
                            px-3
                            py-2
                            transition
                            hover:bg-slate-50
                            text-sm
                            min-w-[450px]
                        "
                    >
                        <span className="font-semibold text-center">{item.time}</span>
                        <span className="text-lg text-center">{impactColor(item.impact)}</span>
                        <span className="text-center">{item.currency}</span>
                        <span> {item.event}</span>
                        <span className="font-medium text-blue-600">{item.forecast}</span>
                    </div>
                ))}

            </div>
        </section>
    );
}