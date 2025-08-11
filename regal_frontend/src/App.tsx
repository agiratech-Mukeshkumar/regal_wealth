import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import LoginPage from './components/login/LoginPage';



const App: React.FC = () => {
    return (
        <Router>
            <Routes>
               
                <Route path="/login" element={<LoginPage />} />

                
            </Routes>
        </Router>
    );
};


const HomeRedirect: React.FC = () => {
    const { user } = useAuth();
    if (user?.role === 'admin') return <Navigate to="/admin/advisors" />;
    if (user?.role === 'advisor') return <Navigate to="/dashboard" />;
    if (user?.role === 'client') return <Navigate to="/fact-finder" />;
    return <Navigate to="/login" />; // Fallback
};

export default App;