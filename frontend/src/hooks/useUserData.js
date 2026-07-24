import { useState, useEffect } from 'react';
import { auth, db } from '../auth/firebase.config';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export function useUserData() {
  const [userData, setUserData] = useState({
    nombre: '',
    email: '',
    cedula: '',
    cargo: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docRef = doc(db, 'usuarios', user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            // Priorizamos estrictamente el nombre completo guardado en Firestore
            setUserData({
              nombre: data.nombre || data.nombres || data.fullName || user.displayName || 'Técnico de Soporte',
              email: user.email || '',
              cedula: data.cedula || data.identificacion || '',
              cargo: data.cargo || 'Técnico de Soporte'
            });
          } else {
            // Si el documento no existe en Firestore, usamos una estructura base pero limpia
            setUserData({
              nombre: user.displayName || 'Técnico de Soporte',
              email: user.email || '',
              cedula: '',
              cargo: 'Técnico de Soporte'
            });
          }
        } catch (error) {
          console.error("Error al obtener los datos de Firestore:", error);
          setUserData({
            nombre: user.displayName || 'Técnico de Soporte',
            email: user.email || '',
            cedula: '',
            cargo: 'Técnico de Soporte'
          });
        }
      } else {
        setUserData({
          nombre: 'Invitado',
          email: '',
          cedula: '',
          cargo: ''
        });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { userData, loading };
}