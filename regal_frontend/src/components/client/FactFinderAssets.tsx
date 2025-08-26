import React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import './FactFinder.css';

// --- Interface Definitions ---
interface SubField {
    id: number;
    field_label: string;
    field_type: 'Textbox' | '$ Number' | 'Select';
}

interface QuestionGroup {
    id: number;
    field_label: string; // This is the Category Name, e.g., "Bank Account"
    sub_fields: SubField[];
}

interface FormStructure {
    id: number;
    field_label: string; // The main question, e.g., "What Types of Financial Accounts..."
    sub_fields: QuestionGroup[]; // These are the selectable categories
}

interface SavedAsset {
    asset_type: string;
    description: string; // This will be a JSON string of sub-field answers
    owner: string;
    balance: string;
}

// Type for the state that holds all user-entered data
type AnswersState = {
    [groupId: number]: {
        id: string; // A unique ID for React's key prop
        owner: string;
        balance: string;
        [subFieldLabel: string]: string; // For dynamic sub-fields
    }[];
};


const TrashIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg> );

const FactFinderAssets: React.FC = () => {
    const { token } = useAuth();    
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    
    const [formStructure, setFormStructure] = useState<FormStructure | null>(null);
    const [answers, setAnswers] = useState<AnswersState>({});
    const [selectedGroupIds, setSelectedGroupIds] = useState<Set<number>>(new Set());

    useEffect(() => {
        const fetchAssetData = async () => {
            if (!token) return;
            setIsLoading(true);
            try {
                const [formRes, dataRes] = await Promise.all([
                    fetch('http://localhost:5000/api/client/forms/assets', { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch('http://localhost:5000/api/client/profile/assets', { headers: { 'Authorization': `Bearer ${token}` } })
                ]);

                if (!formRes.ok) throw new Error('Failed to fetch asset form structure.');
                const structureData: FormStructure[] = await formRes.json();
                const mainForm = structureData[0]; // Assuming one main category selector for "Assets"
                setFormStructure(mainForm);

                if (dataRes.ok) {
                    const savedAssets: SavedAsset[] = await dataRes.json();
                    if (savedAssets.length > 0) {
                        const initialSelections = new Set<number>();
                        const initialAnswers: AnswersState = {};

                        savedAssets.forEach(asset => {
                            const group = mainForm.sub_fields.find(g => g.field_label === asset.asset_type);
                            if (group) {
                                initialSelections.add(group.id);
                                if (!initialAnswers[group.id]) {
                                    initialAnswers[group.id] = [];
                                }
                                try {
                                    const descriptionData = JSON.parse(asset.description);
                                    initialAnswers[group.id].push({
                                        id: `saved-${Math.random()}`,
                                        owner: asset.owner,
                                        balance: asset.balance,
                                        ...descriptionData
                                    });
                                } catch (e) { console.error("Could not parse asset description", e); }
                            }
                        });
                        setAnswers(initialAnswers);
                        setSelectedGroupIds(initialSelections);
                    }
                }
            } catch (err: any) {
                setError("Could not load asset information.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchAssetData();
    }, [token]);

    const handleGroupSelectionChange = (groupId: number) => {
        const newSelections = new Set(selectedGroupIds);
        if (newSelections.has(groupId)) {
            newSelections.delete(groupId);
        } else {
            newSelections.add(groupId);
            // If adding a group for the first time and it has no rows, add one
            if (!answers[groupId] || answers[groupId].length === 0) {
                handleAddRow(groupId);
            }
        }
        setSelectedGroupIds(newSelections);
    };

    const handleAddRow = (groupId: number) => {
        const newRow = { id: `new-${Date.now()}`, owner: 'Client', balance: '' };
        setAnswers(prev => ({
            ...prev,
            [groupId]: [...(prev[groupId] || []), newRow]
        }));
    };

    const handleRemoveRow = (groupId: number, rowId: string) => {
        setAnswers(prev => ({
            ...prev,
            [groupId]: prev[groupId].filter(row => row.id !== rowId)
        }));
    };
    
    const handleAnswerChange = (groupId: number, rowId: string, fieldLabel: string, value: string) => {
        setAnswers(prev => {
            const groupAnswers = prev[groupId].map(row => 
                row.id === rowId ? { ...row, [fieldLabel]: value } : row
            );
            return { ...prev, [groupId]: groupAnswers };
        });
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        
        const assetsPayload: SavedAsset[] = [];
        
        selectedGroupIds.forEach(groupId => {
            const groupInfo = formStructure?.sub_fields.find(g => g.id === groupId);
            const groupAnswers = answers[groupId] || [];

            groupAnswers.forEach(row => {
                if (Number(row.balance) > 0) {
                    const { id, owner, balance, ...descriptionData } = row;
                    assetsPayload.push({
                        asset_type: groupInfo?.field_label || 'Unknown',
                        description: JSON.stringify(descriptionData),
                        owner: owner,
                        balance: balance
                    });
                }
            });
        });
        
        try {
            await fetch('http://localhost:5000/api/client/profile/assets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ assets: assetsPayload })
            });
            navigate('/fact-finder/liabilities');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const totalAssets = useMemo(() => {
        let total = 0;
        Object.values(answers).forEach(group => {
            group.forEach(row => {
                total += Number(row.balance) || 0;
            });
        });
        return total;
    }, [answers]);

    if (isLoading) return <div className="fact-finder-page"><h2>Loading...</h2></div>;

    return (
        <div className="fact-finder-page">
            <div className="wizard-header">
                <h2>Let's wrap up with your monthly totals and assets.</h2>
                <p>You've made it to the last step! Finish strong and unlock your personalized recommendations.</p>
            </div>
            <form onSubmit={handleSubmit} noValidate className="wizard-form">
                {formStructure && (
                    <div className="form-section">
                        <h4>{formStructure.field_label}*</h4>
                        <div className="asset-types-grid">
                            {formStructure.sub_fields.map(group => (
                                <label key={group.id} className="custom-checkbox-label">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedGroupIds.has(group.id)} 
                                        onChange={() => handleGroupSelectionChange(group.id)} 
                                    />
                                    <span>{group.field_label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}
                
                {formStructure?.sub_fields.filter(g => selectedGroupIds.has(g.id)).map(group => (
                    <div key={group.id} className="form-section asset-details-section">
                        <div className="section-header">
                            <h4>{group.field_label}</h4>
                            <button type="button" className="add-button" onClick={() => handleAddRow(group.id)}>+ Add</button>
                        </div>
                        {(answers[group.id] || []).map((row) => (
                             <div key={row.id} className="dynamic-row labeled asset-row">
                                {group.sub_fields.map(subField => (
                                    <div key={subField.id} className="form-group">
                                        <label>{subField.field_label}*</label>
                                        <input 
                                            type={subField.field_type === '$ Number' ? 'number' : 'text'}
                                            name={subField.field_label}
                                            value={row[subField.field_label] || ''}
                                            onChange={e => handleAnswerChange(group.id, row.id, subField.field_label, e.target.value)}
                                            placeholder={subField.field_type === '$ Number' ? '$' : ''}
                                            required
                                        />
                                    </div>
                                ))}
                                <div className="form-group">
                                    <label>Owner*</label>
                                    <select name="owner" value={row.owner} onChange={e => handleAnswerChange(group.id, row.id, 'owner', e.target.value)}>
                                        <option value="Client">Client</option>
                                        <option value="Spouse">Spouse</option>
                                        <option value="Joint">Joint</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Balance*</label>
                                    <input type="number" name="balance" value={row.balance} onChange={e => handleAnswerChange(group.id, row.id, 'balance', e.target.value)} placeholder="$" required/>
                                </div>
                                <button type="button" className="remove-button icon" onClick={() => handleRemoveRow(group.id, row.id)}><TrashIcon /></button>
                            </div>
                        ))}
                    </div>
                ))}

                <div className="totals-section">
                    <div className="form-group">
                        <label>Total Assets</label>
                        <input type="text" value={`$${totalAssets.toLocaleString()}`} readOnly className="total-input" />
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" className="secondary-button" onClick={() => navigate('/fact-finder/income')}>Back</button>
                    <button type="submit" className="continue-button" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Continue'}</button>
                </div>
                {error && <p className="form-message error">{error}</p>}
            </form>
        </div>
    );
};

export default FactFinderAssets;