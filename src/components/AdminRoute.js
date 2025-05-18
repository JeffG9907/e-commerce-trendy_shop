// Add this if you need styling (create the file first):
import './AdminRoute.css';

import { Navigate } from 'react-router-dom';
import { auth } from '../firebase/config';
import { useEffect, useState } from 'react';

const AdminRoute = ({ children }) => {
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAdminStatus = async () => {
            try {
                const user = auth.currentUser;
                if (!user) {
                    return;
                }
                
                const token = await user.getIdTokenResult();
                setIsAdmin(!!token.claims.admin);
            } catch (error) {
                console.error("Error verificando admin:", error);
            } finally {
                setLoading(false);
            }
        };

        checkAdminStatus();
    }, []);

    if (loading) return <div>Cargando...</div>;
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
                <p style={{ fontSize: '18px', marginBottom: '20px' }}>
                    NO TIENE PERMISOS DE ADMINISTRADOR
                </p>
                <button 
                    onClick={() => window.location.href = "/"}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
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