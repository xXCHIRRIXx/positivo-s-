const { Router } = require('express');
const { auth, db } = require('../auth/firebase.config');
const router = Router();

// ==========================================
// ENDPOINT DE REGISTRO
// ==========================================
router.post('/register', async (req, res) => {
  try {
    const { email, password, nombre, cargo, rol } = req.body;

    // 1. Crear usuario en Firebase Auth (exige mínimo 6 caracteres automáticamente)
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: nombre
    });

    // 2. Definir valores por defecto si no se reciben
    const cargoFinal = cargo || 'Asociado';
    const rolFinal = rol || 'empleado';

    // 3. Guardar datos completos en Firestore
    await db.collection('usuarios').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      nombre,
      cargo: cargoFinal,
      rol: rolFinal,
      creadoEn: new Date().toISOString()
    });

    res.status(201).json({ 
      exito: true, 
      mensaje: 'Usuario registrado correctamente',
      uid: userRecord.uid,
      usuario: {
        uid: userRecord.uid,
        email,
        nombre,
        cargo: cargoFinal,
        rol: rolFinal
      }
    });
  } catch (error) {
    res.status(400).json({ exito: false, error: error.message });
  }
});

// ==========================================
// ENDPOINT DE LOGIN SEGURO
// ==========================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ exito: false, error: 'Correo y contraseña requeridos' });
    }

    // Validación segura de credenciales mediante la API REST de Firebase Auth
    const apiKey = process.env.FIREBASE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ exito: false, error: 'Falta configurar FIREBASE_API_KEY en el servidor' });
    }

    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Credenciales inválidas');
    }

    const uid = data.localId;

    // Consultar datos adicionales desde Firestore
    const userDoc = await db.collection('usuarios').doc(uid).get();
    const userData = userDoc.exists ? userDoc.data() : {};

    const nombreFinal = userData.nombre || 'Usuario';
    const cargoFinal = userData.cargo || 'Asociado';
    const rolFinal = userData.rol || 'empleado';

    res.json({
      exito: true,
      mensaje: '¡Inicio de sesión exitoso!',
      uid: uid,
      email: email,
      nombre: nombreFinal,
      cargo: cargoFinal,
      rol: rolFinal
    });
  } catch (error) {
    res.status(401).json({ exito: false, error: 'Correo o contraseña incorrectos' });
  }
});

module.exports = router;