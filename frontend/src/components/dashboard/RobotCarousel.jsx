import { robots } from "../../data/robots";
import RobotCard from "../dashboard/RobotCard";

export default function RobotCarousel() {
    return (
        <section className="space-y-4">

            <div className="flex items-center justify-between">

                <div>

                    <h2 className="text-2xl font-bold">
                        🔥 Top AI Robots
                    </h2>

                    <p className="text-slate-500">
                        Best AI Trading Robots this month
                    </p>

                </div>

                <button className="font-semibold text-blue-600 hover:underline">
                    View All
                </button>

            </div>

            <div
                className="
                    flex
                    gap-5
                    overflow-x-auto
                    pb-2
                "
                style={{
                    scrollbarWidth: "none",
                }}
            >

                {robots.map((robot) => (

                    <RobotCard
                        key={robot.id}
                        robot={robot}
                    />

                ))}

            </div>

        </section>
    );
}