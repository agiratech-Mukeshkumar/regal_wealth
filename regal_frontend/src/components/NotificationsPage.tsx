import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import './NotificationsPage.css'; // We'll update this file

interface Notification {
    id: number;
    message: string;
    link_url: string;
    created_at: string;
}

const NotificationsPage: React.FC = () => {
    const { token } = useAuth();
    const [unreadNotifications, setUnreadNotifications] = useState<Notification[]>([]);
    const [readNotifications, setReadNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchNotifications = async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const response = await fetch('http://localhost:5000/api/notifications', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                setUnreadNotifications(data.unread || []);
                setReadNotifications(data.read || []);
            }
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, [token]);

    const handleMarkAsRead = async (notificationToMark: Notification) => {
        // Optimistically move the notification from 'unread' to 'read'
        setUnreadNotifications(prev => prev.filter(n => n.id !== notificationToMark.id));
        setReadNotifications(prev => [notificationToMark, ...prev]);

        try {
            await fetch(`http://localhost:5000/api/notifications/${notificationToMark.id}/read`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (error) {
            console.error("Failed to mark notification as read:", error);
            // On failure, revert the change by re-fetching everything
            fetchNotifications();
        }
    };

    return (
        <div className="admin-page">
            <header className="page-header">
                <h2>Notifications</h2>
            </header>
            <div className="notifications-list-container">
                {isLoading ? (
                    <p>Loading notifications...</p>
                ) : (
                    <>
                        {/* --- Unread Section --- */}
                        <div className="notification-section">
                            <h3>Unread</h3>
                            {unreadNotifications.length > 0 ? (
                                unreadNotifications.map(notif => (
                                    <div key={notif.id} className="notification-page-item unread">
                                        <div className="notification-content">
                                            <p>{notif.message}</p>
                                            <small>{new Date(notif.created_at).toLocaleString()}</small>
                                        </div>
                                        <div className="notification-actions">
                                            <Link to={notif.link_url} className="action-button view" onClick={() => handleMarkAsRead(notif)}>View</Link>
                                            <button className="action-button dismiss" onClick={() => handleMarkAsRead(notif)}>Dismiss</button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="no-notifications-message">No unread notifications.</p>
                            )}
                        </div>

                        {/* --- Read Section --- */}
                        <div className="notification-section">
                            <h3>Read</h3>
                            {readNotifications.length > 0 ? (
                                readNotifications.map(notif => (
                                     <div key={notif.id} className="notification-page-item read">
                                        <div className="notification-content">
                                            <p>{notif.message}</p>
                                            <small>{new Date(notif.created_at).toLocaleString()}</small>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="no-notifications-message">No recently read notifications.</p>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default NotificationsPage;
