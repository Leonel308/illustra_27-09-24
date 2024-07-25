import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebaseConfig';
import { doc, setDoc } from "firebase/firestore";
import '../Styles/VerifyEmail.css';

const VerifyEmail = () => {
    const navigate = useNavigate();
    const [verified, setVerified] = useState(false);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const interval = setInterval(async () => {
            const user = auth.currentUser;
            if (user) {
                await user.reload();
                if (user.emailVerified) {
                    const userRef = doc(db, "users", user.uid);
                    await setDoc(userRef, { verified: true }, { merge: true });
                    setVerified(true);
                    setChecking(false);
                    clearInterval(interval);
                }
            }
        }, 1000); // Verifica cada segundo

        return () => clearInterval(interval); // Limpia el intervalo al desmontar
    }, []);

    const handleVerified = () => {
        if (verified) {
            navigate('/login');
        } else {
            alert('Por favor, verifica tu correo electrónico primero.');
        }
    };

    return (
        <div className="verify-email-container">
            {checking ? (
                <>
                    <h2>Esperando Verificación de Correo</h2>
                    <p>Por favor, revisa tu correo electrónico y sigue las instrucciones para verificar tu cuenta.</p>
                    <div className="loading-logo"></div>
                </>
            ) : (
                <>
                    <h2>Correo Electrónico Verificado</h2>
                    <p>Gracias por verificar tu correo electrónico. Ahora puedes iniciar sesión.</p>
                    <button onClick={handleVerified}>He Verificado Mi Correo</button>
                </>
            )}
        </div>
    );
};

export default VerifyEmail;
