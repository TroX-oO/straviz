import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import LoginPage from './pages/LoginPage';
import CallbackPage from './pages/CallbackPage';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';
// Import other pages once they are created
// import ActivitiesPage from './pages/ActivitiesPage';
// import AnalyticsPage from './pages/AnalyticsPage';
// import GearPage from './pages/GearPage';
// import SettingsPage from './pages/SettingsPage';

const AppRoutes = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/callback" element={<CallbackPage />} />
                
                <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    {/* <Route path="/activities" element={<ActivitiesPage />} /> */}
                    {/* <Route path="/analytics" element={<AnalyticsPage />} /> */}
                    {/* <Route path="/gear" element={<GearPage />} /> */}
                    {/* <Route path="/settings" element={<SettingsPage />} /> */}
                </Route>
            </Routes>
        </BrowserRouter>
    );
};

export default AppRoutes;
