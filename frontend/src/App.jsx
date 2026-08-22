
import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";
import DashboardPage from "./pages/dashboard/DashboardPage";
import AiRobot from "./components/users/aiRobots/AiRobot";
import Profile from "./components/users/profile/Profile";
import RemoteEA from "./components/users/remoteEa/RemoteEA";
import General from "./components/users/General";
import Portfolio from "./components/users/portofolio/Portofolio";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* PUBLIC ROUTES */}
                <Route element={<MainLayout />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                </Route>

                {/* PROTECTED ROUTES */}
                <Route 
                    element={
                        <ProtectedRoute>
                            <DashboardLayout />
                        </ProtectedRoute>
                    }>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/settings/remote-ea" element={<RemoteEA />} />
                    <Route path="/portfolio" element={<Portfolio />} />
                    <Route path="/settings/general" element={<General />} />
                    <Route path="/robots" element={<AiRobot/>} />
                    <Route path="/profile" element={<Profile/>} />
                </Route>

            </Routes>
        </BrowserRouter>
    );
}

export default App;