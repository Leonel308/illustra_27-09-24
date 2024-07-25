import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc } from "firebase/firestore";
import '../Styles/WaitingVerification.css';

const WaitingVerification = () => {
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const checkVerification = async () => {
            const user = auth.currentUser;
            if (user) {
                const userRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userRef);
                if (userDoc.exists() && userDoc.data().verified) {
                    setLoading(false);
                    navigate('/login'); // Redirigir a la página de inicio de sesión después de la verificación
                }
            }
        };

        const intervalId = setInterval(checkVerification, 5000); // Revisa cada 5 segundos

        return () => clearInterval(intervalId);
    }, [navigate]);

    const handleVerified = async () => {
        setLoading(true);
        const user = auth.currentUser;
        await user.reload();
        if (user.emailVerified) {
            const userRef = doc(db, 'users', user.uid);
            await setDoc(userRef, { verified: true }, { merge: true });
            setLoading(false);
            navigate('/login');
        } else {
            setLoading(false);
            alert('Tu correo no ha sido verificado aún. Por favor, revisa nuevamente.');
        }
    };

    return (
        <div className="waiting-container">
            <h2>Esperando Verificación de Correo</h2>
            <p>Por favor, revisa tu correo electrónico y sigue las instrucciones para verificar tu cuenta.</p>
            {loading && <div className="loading-logo"></div>}
            <button onClick={handleVerified} disabled={loading}>He Verificado Mi Correo</button>
        </div>
    );
};

export default WaitingVerification;
