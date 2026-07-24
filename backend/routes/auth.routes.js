const { Router } = require('express');
const { auth, db } = require('../auth/firebase.config');
const router = Router();

// ==========================================
// ENDPOINT DE REGISTRO
// ==========================================
router.post('/register', async (req, res) => {
  try {
    const { email, password, nombre, cargo, rol } = req.body;

    // 1. Crear usuario en Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: nombre
    });

    // 2. Definir valores por defecto si no se reciben
    const cargoFinal = cargo || 'Asociado';
    const rolFinal = rol || 'empleado';

    // 3. Guardar datos completos en Firestore (Crucial para el Chat y Directorio)
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
// ENDPOINT DE LOGIN BÁSICO
// ==========================================
router.post('/login', async (req, res) => {
  try {
    const { email } = req.body;
    
    // 1. Verificar si el usuario existe en Firebase Auth
    const user = await auth.getUserByEmail(email);
    
    // 2. Consultar sus datos adicionales desde Firestore
    const userDoc = await db.collection('usuarios').doc(user.uid).get();
    const userData = userDoc.exists ? userDoc.data() : {};

    const nombreFinal = user.displayName || userData.nombre || 'Usuario';
    const cargoFinal = userData.cargo || 'Asociado';
    const rolFinal = userData.rol || 'empleado';

    // 3. Retornar todos los atributos requeridos por el Frontend
    res.json({
      exito: true,
      mensaje: '¡Inicio de sesión exitoso!',
      uid: user.uid,
      email: user.email,
      nombre: nombreFinal,
      cargo: cargoFinal,
      rol: rolFinal
    });
  } catch (error) {
    res.status(401).json({ exito: false, error: 'Correo no registrado o credenciales inválidas' });
  }
});

module.exports = router;