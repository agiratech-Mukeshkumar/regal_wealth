import React from 'react';
import './AdminModals.css'; // A shared CSS file for admin modals

interface DeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    itemName: string;
    itemType: string;
    // --- FIX: Made the isSubmitting prop optional ---
    isSubmitting?: boolean;
}

const DeleteConfirmationModal: React.FC<DeleteModalProps> = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    itemName, 
    itemType, 
    // --- FIX: Provided a default value for the optional prop ---
    isSubmitting = false 
}) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content confirmation-modal" onClick={(e) => e.stopPropagation()}>
                 <div className="confirmation-icon icon-red">!</div>
                <h3>Delete {itemType}</h3>
                <p>Are you sure you want to permanently delete <strong>{itemName}</strong>? This action cannot be undone.</p>
                <div className="modal-actions">
                    <button type="button" className="modal-button cancel" onClick={onClose}>Cancel</button>
                    <button 
                        type="button" 
                        className="modal-button confirm-red" 
                        onClick={onConfirm}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmationModal;

