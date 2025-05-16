import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, collection, addDoc } from 'firebase/firestore';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import '../styles/Contact.css';


const Contact = () => {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    reason: '',
    message: ''
  });

  const [status, setStatus] = useState('');

  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setForm({
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            email: user.email || '',
            phone: userData.phoneNumber || '',
            reason: '',
            message: ''
          });
        }
      } else {
        console.log("No user is signed in.");
      }
    };

    onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchUserData();
      } else {
        console.log("User is signed out.");
      }
    });
  }, [auth, db]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'support'), {
        ...form,
        timestamp: new Date(),
      });
      setStatus('Soporte enviado correctamente');
    } catch (error) {
      console.error('Error al enviar el formulario:', error);
      setStatus('Error al enviar el soporte');
    }
  };

  return (
    <div className="contact-container">
      <h1>Soporte</h1>
      <p>Para obtener soporte, por favor completa el siguiente formulario o contacta a un asesor:</p>
      <form className="contact-form" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="firstName">Nombres:</label>
          <input 
            type="text" 
            id="firstName" 
            name="firstName" 
            value={form.firstName} 
            onChange={handleChange} 
            required 
            disabled
          />
        </div>
        <div>
          <label htmlFor="lastName">Apellidos:</label>
          <input 
            type="text" 
            id="lastName" 
            name="lastName" 
            value={form.lastName} 
            onChange={handleChange} 
            required 
            disabled
          />
        </div>
        <div>
          <label htmlFor="email">Email:</label>
          <input 
            type="email" 
            id="email" 
            name="email" 
            value={form.email} 
            onChange={handleChange} 
            required 
            disabled
          />
        </div>
        <div>
          <label htmlFor="phone">No. celular:</label>
          <input 
            type="text" 
            id="phone" 
            name="phone" 
            value={form.phone} 
            onChange={handleChange} 
            required 
            disabled
          />
        </div>
        <div>
          <label htmlFor="reason">Motivo:</label>
          <select 
            id="reason" 
            name="reason" 
            value={form.reason} 
            onChange={handleChange} 
            required
          >
            <option value="">Selecciona un motivo</option>
            <option value="technical">Soporte técnico</option>
            <option value="general">Consulta general</option>
            <option value="billing">Problemas con una órden</option>
            <option value="account">Problemas con la cuenta</option>
            <option value="feedback">Enviar comentarios</option>
            <option value="other">Otro</option>
          </select>
        </div>
        <div>
          <label htmlFor="message">Mensaje:</label>
          <textarea 
            id="message" 
            name="message" 
            value={form.message} 
            onChange={handleChange} 
            required 
          />
        </div>
        <div className="button-container">
          <button type="submit">Enviar</button>
        </div>
      </form>
      {status && <p>{status}</p>}
      <div className="contact-advisor">
        <h2>Contacta a un asesor</h2>
        <p>¿Necesitas ayuda inmediata? Habla con uno de nuestros asesores de soporte.</p>
        <a 
          href="https://wa.link/qe2tcd" 
          className="contact-advisor-button" 
          target="_blank" 
          rel="noopener noreferrer"
        >
          <WhatsAppIcon style={{ marginRight: '8px' }} /> Contactar por WhatsApp
        </a>
      </div>
    </div>
  );
};

export default Contact;