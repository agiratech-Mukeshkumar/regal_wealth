import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './AdminContentGovernance.css';
import { useAuth } from '../../auth/AuthContext';
// Import your newly named components
import AdminLiabilitiesBuilder from './AdminLiabilitiesBuilder';
import AdminInvestorBuilder from './AdminInvestorBuilder';

type ContentTab = 'cepa' | 'cookies' | 'privacy-policy' | 'investor-profile' | 'assets' | 'liabilities';

// --- Text Editor Component (No Changes Needed) ---
const TextEditor: React.FC<{ pageSlug: string }> = ({ pageSlug }) => {
    const { token } = useAuth();
    const [content, setContent] = useState('');
    // ... (rest of the component is the same)
    return (
        <div className="editor-container">
            <ReactQuill theme="snow" value={content} onChange={setContent} />
            <div className="editor-actions">
                <button className="update-button">Update</button>
            </div>
        </div>
    );
};


// --- Main Governance Page Component ---
const AdminContentGovernance: React.FC = () => {
    const [activeTab, setActiveTab] = useState<ContentTab>('cepa');

    const renderContent = () => {
        switch (activeTab) {
            case 'cepa':
            case 'cookies':
            case 'privacy-policy':
                return <TextEditor pageSlug={activeTab} />;
            
            // Use your AdminInvestorBuilder for the Investor Profile tab
            case 'investor-profile':
                return <AdminInvestorBuilder formName="investor_profile" />;

            // Use your AdminLiabilitiesBuilder for the Liabilities and Assets tabs
            case 'assets':
                // Assuming Assets uses the same simple builder as Liabilities
                return <AdminLiabilitiesBuilder formName="assets" />;
            case 'liabilities':
                return <AdminLiabilitiesBuilder formName="liabilities" />;
                
            default:
                return null;
        }
    };

    return (
        <div className="admin-page">
            <header className="page-header"></header>
            <div className="content-gov-container">
                <div className="content-tabs">
                    <button onClick={() => setActiveTab('cepa')} className={activeTab === 'cepa' ? 'active' : ''}>CEPA</button>
                    <button onClick={() => setActiveTab('cookies')} className={activeTab === 'cookies' ? 'active' : ''}>Cookies</button>
                    <button onClick={() => setActiveTab('privacy-policy')} className={activeTab === 'privacy-policy' ? 'active' : ''}>Privacy Policy</button>
                    <button onClick={() => setActiveTab('assets')} className={activeTab === 'assets' ? 'active' : ''}>Assets</button>
                    <button onClick={() => setActiveTab('liabilities')} className={activeTab === 'liabilities' ? 'active' : ''}>Liabilities</button>
                    <button onClick={() => setActiveTab('investor-profile')} className={activeTab === 'investor-profile' ? 'active' : ''}>Investor Profile</button>
                </div>
                {renderContent()}
            </div>
        </div>
    );
};

export default AdminContentGovernance;