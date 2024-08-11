import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebaseConfig';
import { createUserWithEmailAndPassword, sendEmailVerification, onAuthStateChanged } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import '../Styles/register.css';

const defaultProfilePic = "https://firebasestorage.googleapis.com/v0/b/illustra-6ca8a.appspot.com/o/non_profile_pic.png?alt=media&token=9ef84cb8-bae5-48cf-aed9-f80311cc2886";
const defaultBackgroundURL = "";  // URL por defecto para el fondo de perfil

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [adultContent, setAdultContent] = useState('SFW'); 
    const [isArtist, setIsArtist] = useState(false);
    const [gender, setGender] = useState(''); 
    const [customGender, setCustomGender] = useState(''); 
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);  // Estado de carga
    const navigate = useNavigate();

    useEffect(() => {
        document.body.classList.add('register-page');
        return () => {
            document.body.classList.remove('register-page');
        };
    }, []);

    useEffect(() => {
        const checkVerification = onAuthStateChanged(auth, (user) => {
            if (user && user.emailVerified) {
                navigate('/'); // Redirige al usuario a la página principal después de la verificación
            }
        });
        return () => checkVerification();
    }, [navigate]);

    const handleRegister = async (event) => {
        event.preventDefault();
        if (!acceptTerms) {
            setError('Debes aceptar los términos y condiciones para registrarte.');
            return;
        }
        try {
            setLoading(true);  // Inicia el estado de carga
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            await sendEmailVerification(user);
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                username,
                username_lower: username.toLowerCase(),
                email,
                profilePic: defaultProfilePic,
                backgroundURL: defaultBackgroundURL, // Añadir backgroundURL aquí
                role: "User",
                verified: false,
                adultContent,
                isArtist,
                gender: gender === 'other' ? customGender : gender,
                createdAt: new Date(),
                balance: 0, // Añadir balance aquí
                pendingBalance: 0, // Añadir pendingBalance aquí
                services: [], // Ejemplo de un campo adicional
                notifications: [], // Ejemplo de un campo adicional
            });
            console.log('Usuario registrado y correo de verificación enviado');
            navigate('/verify-email');  // Redirige a la página de verificación de correo
        } catch (error) {
            console.error('Error al registrar el usuario:', error.message);
            setError(error.message);
        } finally {
            setLoading(false);  // Finaliza el estado de carga
        }
    };

    const handleUsernameChange = (e) => {
        const value = e.target.value;
        if (!/\s/.test(value)) { 
            setUsername(value);
        }
    };

    return (
        <div className="register-container">
            <h1>Registro</h1>
            <form onSubmit={handleRegister}>
                <input type="text" value={username} onChange={handleUsernameChange} placeholder="Username" required />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required />
                <div className="artist-option">
                    <label>
                        <input
                            type="radio"
                            value={true}
                            checked={isArtist === true}
                            onChange={() => setIsArtist(true)}
                        />
                        soy ilustrador/a
                    </label>
                    <label>
                        <input
                            type="radio"
                            value={false}
                            checked={isArtist === false}
                            onChange={() => setIsArtist(false)}
                        />
                        soy usuario/a
                    </label>
                </div>
                {isArtist && (
                    <div className="content-options">
                        <h2>¿Qué contenido crearás?</h2>
                        <label>
                            <input
                                type="radio"
                                value="SFW"
                                checked={adultContent === 'SFW'}
                                onChange={(e) => setAdultContent(e.target.value)}
                            />
                            SFW
                        </label>
                        <label>
                            <input
                                type="radio"
                                value="NSFW"
                                checked={adultContent === 'NSFW'}
                                onChange={(e) => setAdultContent(e.target.value)}
                            />
                            NSFW
                        </label>
                        <label>
                            <input
                                type="radio"
                                value="NSFW-SFW"
                                checked={adultContent === 'NSFW-SFW'}
                                onChange={(e) => setAdultContent(e.target.value)}
                            />
                            NSFW-SFW
                        </label>
                    </div>
                )}
                <div className="gender-selection">
                    <h2>Sexo / Género:</h2>
                    <label>
                        <input
                            type="radio"
                            value="male"
                            checked={gender === 'male'}
                            onChange={(e) => setGender(e.target.value)}
                        />
                        Masculino
                    </label>
                    <label>
                        <input
                            type="radio"
                            value="female"
                            checked={gender === 'female'}
                            onChange={(e) => setGender(e.target.value)}
                        />
                        Femenino
                    </label>
                    <label>
                        <input
                            type="radio"
                            value="other"
                            checked={gender === 'other'}
                            onChange={(e) => setGender(e.target.value)}
                        />
                        Otro
                    </label>
                    {gender === 'other' && (
                        <input
                            type="text"
                            value={customGender}
                            onChange={(e) => setCustomGender(e.target.value)}
                            placeholder="Especifique su género"
                            maxLength={14}
                            minLength={4}
                            required
                        />
                    )}
                </div>
                <div className="terms-conditions">
                    <label>
                        <input
                            type="checkbox"
                            checked={acceptTerms}
                            onChange={(e) => setAcceptTerms(e.target.checked)}
                        />
                        Acepto los <a href="/terms-and-conditions" target="_blank">Términos y Condiciones</a>
                    </label>
                </div>
                <button type="submit" disabled={loading}>
                    {loading ? 'Registrando...' : 'Register'}
                </button>
                {error && <p className="error">{error}</p>}
            </form>
        </div>
    );
};

export default Register;
