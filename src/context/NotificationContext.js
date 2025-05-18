import { createContext, useState } from 'react';
import { Snackbar, Alert } from '@mui/material';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [notification, setNotification] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    const showNotification = (message, severity = 'success') => {
        setNotification({ open: true, message, severity });
    };

    const closeNotification = () => {
        setNotification(prev => ({ ...prev, open: false }));
    };

    return (
        <NotificationContext.Provider value={{ showNotification, closeNotification }}>
            {children}
            <Snackbar
                open={notification.open}
                autoHideDuration={2000}
                onClose={closeNotification}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={closeNotification} severity={notification.severity}>
                    {notification.message}
                </Alert>
            </Snackbar>
        </NotificationContext.Provider>
    );
};