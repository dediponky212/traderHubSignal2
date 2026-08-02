import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.jsx";

import { SidebarProvider } from "./context/SidebarContext";
import { AuthProvider } from "./context/AuthContext";

import "./index.css";
import "./styles/theme.css";
import "./styles/carousel.css";

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <AuthProvider>
            <SidebarProvider>
                <App />
            </SidebarProvider>
        </AuthProvider>
    </StrictMode>
);