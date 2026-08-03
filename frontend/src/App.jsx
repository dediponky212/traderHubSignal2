// import { BrowserRouter, Routes, Route } from "react-router-dom";

// import MainLayout from "./layouts/MainLayout";
// import DashboardLayout from "./layouts/DashboardLayout";
// import DashboardPage from "./pages/dashboard/DashboardPage";
// import HomePage from "./pages/HomePage";
// import LoginPage from "./pages/LoginPage";
// import RegisterPage from "./pages/RegisterPage";
// import ProtectedRoute from "./components/auth/ProtectedRoute";

// function App() {
//     return (
//         <BrowserRouter>

//             <Routes>

//                 <Route element={<MainLayout />}>
//                     <Route path="/" element={<HomePage />} />
//                 </Route>

//                 <Route element={<MainLayout />}>
//                     <Route path="/login" element={<LoginPage />} />
//                     <Route path="/register" element={<RegisterPage />} />
//                 </Route>

//                 <Route element={<DashboardLayout />}>
//                   <Route
//                         path="/dashboard"
//                         element={
//                             <ProtectedRoute>
//                                 <DashboardPage />
//                             </ProtectedRoute>
//                         }
//                     />
//                 </Route>

//             </Routes>

//         </BrowserRouter>
//     );
// }

// export default App;

import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import DashboardPage from "./pages/dashboard/DashboardPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";

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

                {/* PROTECTED ROUTES (Dashboard dkk) */}
                <Route 
                    element={
                        <ProtectedRoute>
                            <DashboardLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route path="/dashboard" element={<DashboardPage />} />
                    {/* Nanti route lain seperti /dashboard/portfolio tinggal tambah di sini */}
                </Route>

            </Routes>
        </BrowserRouter>
    );
}

export default App;