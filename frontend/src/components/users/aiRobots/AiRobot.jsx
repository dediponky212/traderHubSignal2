import PageHeader from "../../ui/PageHeader";
import MarketTicker from "../../dashboard/MarketTicker";
import DashboardFooter from "../../dashboard/DashboardFooter";
import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";

export default function AiRobot() {
    const [aiRobot, setAiRobot] = useState("");
    const {user} = useAuth();
 return(
    <div>
      <MarketTicker/>
        <h1>Page AiRobot User: {user?.email}</h1>

        <DashboardFooter />
    </div>
  ) ; 
}