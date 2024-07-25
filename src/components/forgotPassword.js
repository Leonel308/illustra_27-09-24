import React, { useState, useEffect } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import '../Styles/forgotPassword.css';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        document.body.classList.add('forgot-password-page');
        return () => {
            document.body.classList.remove('forgot-password-page');
        };
    }, []);

    const handlePasswordReset = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            setError('Por favor ingresa un correo electrónico válido.');
            return;
        }

        try {
            const emailLower = email.toLowerCase();
            const q = query(collection(db, "users"), where("email_lower", "==", emailLower));
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) {
                setError('El correo no existe en la base de datos.');
                return;
            }

            await sendPasswordResetEmail(auth, emailLower);
            setMessage('Se ha enviado un enlace para restablecer la contraseña a tu correo.');
        } catch (error) {
            console.error('Password reset error:', error.message);
            setError('Error al enviar el correo de restablecimiento.');
        }
    };

    const handleEmailChange = (e) => {
        const value = e.target.value;
        if (!/\s/.test(value)) {
            setEmail(value);
        }
    };

    return (
        <div className="forgot-password-container">
            <h2>Olvidé mi contraseña</h2>
            <p>Ingresa tu correo electrónico para recibir un enlace de restablecimiento de contraseña.</p>
            {message && <p className="success-message">{message}</p>}
            {error && <p className="login-error">{error}</p>}
            <form onSubmit={handlePasswordReset}>
                <input
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    placeholder="Correo electrónico"
                    required
                    pattern="[^\s@]+@[^\s@]+\.[^\s@]+" // Asegura que el correo sea válido
                />
                <button type="submit">Enviar enlace</button>
            </form>
        </div>
    );
};

export default ForgotPassword;
