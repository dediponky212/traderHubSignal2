

import Hero from "../components/home/Hero";
import Trusted from "../components/home/Trusted";
import Features from "../components/home/Features";
import DashboardPreview from "../components/home/DashboardPreview";
import HowItWorks from "../components/home/HowItWorks";
import Ecosystem from "../components/home/Ecosystem";
import TradingFlow from "../components/home/TradingFlow";

export default function HomePage() {
    return (
        <>
            <Hero/>
            <Trusted/>
            <Features/>
            <DashboardPreview/>
            <HowItWorks/>
            <Ecosystem/>
            <TradingFlow/>
        </>
    );
}