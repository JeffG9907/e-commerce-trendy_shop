// Add this if you need styling (create the file first):
import './AdminRoute.css';

import { Navigate } from 'react-router-dom';
import { auth } from '../firebase/config';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';

const AdminRoute = ({ children }) => {
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAdminStatus = async () => {
            try {
                const user = auth.currentUser;
                if (!user) {
                    setLoading(false);
                    return;
                }

                // Check admin status in Firestore
                const db = getFirestore();
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                
                if (userDoc.exists()) {
                    setIsAdmin(userDoc.data().role === 'admin');
                }
                setLoading(false);
            } catch (error) {
                console.error("Error checking admin status:", error);
                setLoading(false);
            }
        };

        checkAdminStatus();
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!isAdmin) {
        return (
            <div style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                zIndex: 1000,
                textAlign: 'center'
            }}>
                <p style={{ 
                    fontSize: '18px', 
                    marginBottom: '20px',
                    fontWeight: 'bold',
                    color: '#d32f2f'
                }}>
                    NO TIENE PERMISOS DE ADMINISTRADOR
                </p>
                <button 
                    onClick={() => window.location.href = "/"}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#1976d2',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '16px'
                    }}
                >
                    Volver al inicio
                </button>
            </div>
        );
    }

    return children;
};

export default AdminRoute;