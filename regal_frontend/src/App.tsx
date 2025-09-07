import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';

// --- Import all page components ---
import LoginPage from './components/login/LoginPage';
import ProtectedRoute from './routes/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';


// Advisor Pages
import ClientListPage from './components/advisor/ClientListPage';
import ClientDetailPage from './components/advisor/ClientDetailPage';

// Client Fact Finder Pages
import FactFinderPersonalInfo from './components/client/FactFinderPersonalInfo';
import FactFinderSpouseInfo from './components/client/FactFinderSpouseInfo';
import FactFinderFamilyInfo from './components/client/FactFinderFamilyInfo';
import FactFinderInvestorProfile from './components/client/FactFinderInvestorProfile';
import FactFinderDocuments from './components/client/FactFinderDocuments';
import FactFinderSummary from './components/client/FactFinderSummary';
import AdminContentGovernance from './components/admin/AdminContentGovernance';
import FactFinderIncome from './components/client/FactFinderIncome';
import FactFinderAssets from './components/client/FactFinderAssets';
import FactFinderLiabilities from './components/client/FactFinderLiabilities';
import AdvisorToolsHub from './components/advisor/AdvisorToolsHub';
import AdvisorIncomeTaxTool from './components/advisor/AdvisorIncomeTaxTool';
import ClientSettingsPage from './components/client/ClientSettingsPage';
import AdvisorSettingsPage from './components/advisor/AdvisorSettingsPage';
import AdminAdvisorManagement from './components/admin/AdminAdvisorManagement';
import AdminClientManagement from './components/admin/AdminClientManagement';
import Notifications from './components/NotificationsPage';
import AdvisorDashboard from './components/advisor/AdvisorDashboard';



const App: React.FC = () => {
    return (
        <Router>
            <Routes>
                {/* --- Public Route --- */}
                <Route path="/login" element={<LoginPage />} />

                {/* --- Protected Routes --- */}
                <Route element={<ProtectedRoute />}>

                    {/* Advisor & Admin Routes (uses the MainLayout with sidebar) */}
                    <Route element={<MainLayout />}>
                        <Route path="/dashboard" element={<AdvisorDashboard />} />
                        <Route path="/clients" element={<ClientListPage />} />
                        <Route path="/clients/:clientId" element={<ClientDetailPage />} />
                        <Route path="/tools" element={<AdvisorToolsHub />} />
                        <Route path="/tools/income-tax" element={<AdvisorIncomeTaxTool />} />
                        <Route path="/advisor/settings" element={<AdvisorSettingsPage />} />
                        <Route path="/notifications" element={<Notifications />} />
        
                      

                        <Route path="/admin/content-governance" element={<AdminContentGovernance />} />
                        <Route path="/admin/advisors" element={<AdminAdvisorManagement />} />
                        <Route path="/admin/client-management" element={<AdminClientManagement />} />
                    </Route>

                    {/* Client Routes (now uses the MainLayout) */}
                    <Route element={<MainLayout />}>
                        <Route path="/fact-finder">
                            <Route path="personal-info" element={<FactFinderPersonalInfo />} />
                            <Route path="spouse-info" element={<FactFinderSpouseInfo />} />
                            <Route path="family-info" element={<FactFinderFamilyInfo />} />
                            <Route path="investor-profile" element={<FactFinderInvestorProfile />} />
                            <Route path="income" element={<FactFinderIncome />} />
                            <Route path="assets" element={<FactFinderAssets />} />
                            <Route path="liabilities" element={<FactFinderLiabilities />} />
                            <Route path="documents" element={<FactFinderDocuments />} />
                            <Route path="summary" element={<FactFinderSummary />} />    
                            <Route index element={<Navigate to="personal-info" replace />} />
                        </Route>
                        <Route path="/settings" element={<ClientSettingsPage />} />
                    </Route>
                    
                    <Route path="/" element={<HomeRedirect />} />
                </Route>
            </Routes>
        </Router>
    );
};

// Helper component to handle the initial redirect after login
const HomeRedirect: React.FC = () => {
    const { user } = useAuth();
    if (user?.role === 'admin') return <Navigate to="/admin/advisors" />;
    if (user?.role === 'advisor') return <Navigate to="/dashboard" />;
    if (user?.role === 'client') return <Navigate to="/fact-finder" />;
    return <Navigate to="/login" />; // Fallback
};

export default App;