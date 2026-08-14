import { useState } from "react";
import { User } from "lucide-react";
import { Link, NavLink } from "react-router-dom";

import PageHeader from "../../ui/PageHeader";
import MarketTicker from "../../dashboard/MarketTicker";
import DashboardFooter from "../../dashboard/DashboardFooter";
import { useAuth } from "../../../context/AuthContext";
import Card from "../../ui/Card";
import Button from "../../ui/Button";

export default function Profile() {
    const [profile, setProfile] = useState("");
    const {user} = useAuth();
 return(
    <div>
      <MarketTicker/>
            <h1 className="text-zinc-500 font-bold pb-3">
                <span className="font-bold">Profile User: </span>
                <span className="font-normal">{user?.fullname}</span>
            </h1>
        <div className="
                    flex
                    justify-around
                    rounded-sm
                    w-full
                    bg-slate-50
                    border-b-blue-100">
            <Card>Caard</Card>
            <Button>Buttom</Button>
            <Link to="/">Link</Link>
        </div>

        <DashboardFooter />
    </div>
  ) ; 
}