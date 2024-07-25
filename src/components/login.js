import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from '../firebaseConfig';
import { doc, getDoc } from "firebase/firestore";
import '../Styles/login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        document.body.classList.add('login-page');
        return () => {
            document.body.classList.remove('login-page');
        };
    }, []);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            if (user) {
                console.log('User already logged in:', user);
                navigate('/home', { replace: true });
            }
        });

        return () => unsubscribe();
    }, [navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');  // Limpiar cualquier error anterior
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            console.log('User logged in with Firebase Auth:', user);

            // Verificar si el usuario existe en Firestore
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (!userDoc.exists()) {
                console.log('User not found in Firestore:', user.uid);
                // Si el usuario no existe en Firestore, cerrar sesión y mostrar error
                await auth.signOut();
                setError('No se encontró un usuario con esos datos.');
            } else {
                console.log('User found in Firestore:', userDoc.data());
                navigate('/home', { replace: true });
            }
        } catch (error) {
            console.error('Login error:', error.message);
            setError('Los datos de inicio de sesión no coinciden con ninguno en la base de datos.');
        }
    };

    return (
        <div className="login-container">
            <h2>Login</h2>
            {error && <p className="login-error">{error}</p>}
            <form onSubmit={handleLogin}>
                <input
                    type="email"
                    className="login-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email..."
                    required
                />
                <input
                    type="password"
                    className="login-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password..."
                    required
                />
                <button className="login-button" type="submit">Login</button>
            </form>
            <div className="login-links">
                <p>¿No tienes una cuenta? <a href="/register">Regístrate</a></p>
                <p><a href="/forgot-password">Olvidé mi contraseña</a></p>
            </div>
        </div>
    );
};

export default Login;
