import { useEffect, useRef } from "react";
import { robots } from "../../data/robots";
import RobotCard from "./RobotCard";

export default function RobotCarousel() {

    const scrollRef = useRef(null);

    useEffect(() => {

        const container = scrollRef.current;

        if (!container) return;

        let isPaused = false;
        let resumeTimeout;

        const pause = () => {
            isPaused = true;

            clearTimeout(resumeTimeout);

            resumeTimeout = setTimeout(() => {
                isPaused = false;
            }, 3000);
        };

        container.addEventListener("mouseenter", pause);
        container.addEventListener("touchstart", pause);
        container.addEventListener("wheel", pause);

        const interval = setInterval(() => {

            if (isPaused) return;

            const card = container.querySelector(".robot-card");

            if (!card) return;

            const gap = 20;
            const step = card.offsetWidth + gap;

            const maxScroll =
                container.scrollWidth - container.clientWidth;

            if (container.scrollLeft >= maxScroll - 5) {

                container.scrollTo({
                    left: 0,
                    behavior: "smooth",
                });

            } else {

                container.scrollBy({
                    left: step,
                    behavior: "smooth",
                });

            }

        }, 5000);

        return () => {

            clearInterval(interval);

            container.removeEventListener("mouseenter", pause);
            container.removeEventListener("touchstart", pause);
            container.removeEventListener("wheel", pause);

        };

    }, []);

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

                <button
                    className="cursor-pointer font-semibold text-blue-600 hover:underline"
                >
                    View All
                </button>

            </div>

            <div
                ref={scrollRef}
                className="
                    robot-carousel
                    flex
                    gap-5
                    overflow-x-auto
                    overflow-y-visible
                    snap-x
                    snap-mandatory
                    scroll-smooth
                    pb-4
                    px-4
                "
                style={{
                    scrollbarWidth: "none",
                    scrollPaddingLeft: "calc(50% - 145px)",
                    scrollPaddingRight: "calc(50% - 145px)",
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
