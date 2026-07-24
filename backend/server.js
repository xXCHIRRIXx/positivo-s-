const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const verifyToken = require('./auth/auth.middleware');
const { db } = require('./auth/firebase.config');

const app = express();
const PORT = process.env.PORT || 4000;

// ==========================================
// MIDDLEWARES GLOBALES
// ==========================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// CONFIGURACIÓN DE CARPETA Y MULTER (ARCHIVOS/FOTOS)
// ==========================================
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // Límite de 10MB
});

// Hacer pública la carpeta 'uploads' para descargas y vista previa
app.use('/uploads', express.static(uploadDir));

// ==========================================
// RUTAS DE PRUEBA Y AUTENTICACIÓN
// ==========================================

app.get('/', (req, res) => {
    res.json({ mensaje: '¡API de Inventario Positivo funcionando correctamente!' });
});

app.get('/api/inventario', verifyToken, async (req, res) => {
    try {
        res.json({ 
            exito: true, 
            usuario: req.user ? req.user.email : 'Usuario Autenticado', 
            mensaje: 'Acceso autorizado al inventario' 
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al consultar la base de datos.' });
    }
});

// ==========================================
// RUTAS DE GESTIÓN DE USUARIOS
// ==========================================

app.get('/api/usuarios', async (req, res) => {
    try {
        const snapshot = await db.collection('usuarios').get();
        const usuarios = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                nombre: data.nombre || 'Usuario',
                email: data.email || data.correo || '',
                cargo: data.cargo || 'Asociado'
            };
        });
        res.status(200).json(usuarios);
    } catch (error) {
        res.status(500).json({ error: 'Error obteniendo usuarios: ' + error.message });
    }
});

// ==========================================
// RUTAS DE GESTIÓN DE EQUIPOS
// ==========================================

// 1. Registrar equipo
app.post('/api/equipos', async (req, res) => {
    try {
        const { 
            serial, 
            tipoPropiedad, 
            proveedor, 
            modelo, 
            descripcion, 
            estadoFisico, 
            disponibilidad, 
            ciudad, 
            usuarioRegistro,
            asignadoA,
            asignado_a,
            identificacionUsuario,
            identificacion_usuario
        } = req.body;

        if (!serial || !modelo) {
            return res.status(400).json({ error: 'El número de serial y el modelo son obligatorios.' });
        }

        const querySnapshot = await db.collection('equipos').where('serial', '==', serial).get();
        if (!querySnapshot.empty) {
            return res.status(400).json({ error: '¡El número de serie ya está registrado en el sistema!' });
        }

        const esAsignado = disponibilidad === 'Asignado';
        const finalAsignadoA = esAsignado ? (asignadoA || asignado_a || null) : null;
        const finalIdentificacion = esAsignado ? (identificacionUsuario || identificacion_usuario || null) : null;

        const nuevoEquipo = {
            serial,
            tipoPropiedad: tipoPropiedad || 'Propio', 
            proveedor: tipoPropiedad === 'Proveedor' ? (proveedor || 'N/A') : 'N/A',
            modelo,
            descripcion: descripcion || '',
            estadoFisico: estadoFisico || 'Bueno',
            disponibilidad: disponibilidad || 'Disponible', 
            ciudad: ciudad || 'Bogotá',
            asignadoA: finalAsignadoA,
            identificacionUsuario: finalIdentificacion,
            asignado_a: finalAsignadoA,
            identificacion_usuario: finalIdentificacion,
            usuarioRegistro: usuarioRegistro || 'Desconocido',
            fechaRegistro: new Date().toISOString()
        };

        const docRef = await db.collection('equipos').add(nuevoEquipo);
        res.status(201).json({ message: 'Equipo registrado con éxito', id: docRef.id, ...nuevoEquipo });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. Obtener / Listar todos los equipos
app.get('/api/equipos', async (req, res) => {
    try {
        const snapshot = await db.collection('equipos').get();
        const equipos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(equipos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2.1 Obtener un equipo específico por ID
app.get('/api/equipos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const equipoRef = db.collection('equipos').doc(id);
        const docSnap = await equipoRef.get();

        if (!docSnap.exists) {
            return res.status(404).json({ error: 'El equipo no existe en la base de datos.' });
        }

        res.status(200).json({ id: docSnap.id, ...docSnap.data() });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. Actualizar equipo por ID
app.put('/api/equipos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            serial, 
            tipoPropiedad, 
            proveedor, 
            modelo, 
            descripcion, 
            estadoFisico, 
            disponibilidad, 
            ciudad,
            asignadoA,
            asignado_a,
            identificacionUsuario,
            identificacion_usuario
        } = req.body;

        const equipoRef = db.collection('equipos').doc(id);
        const docSnap = await equipoRef.get();

        if (!docSnap.exists) {
            return res.status(404).json({ error: 'El equipo no existe en la base de datos.' });
        }

        if (serial && serial !== docSnap.data().serial) {
            const serialCheck = await db.collection('equipos').where('serial', '==', serial).get();
            if (!serialCheck.empty) {
                return res.status(400).json({ error: 'El nuevo número de serie ya pertenece a otro equipo.' });
            }
        }

        const nuevaDisponibilidad = disponibilidad || docSnap.data().disponibilidad;
        const esAsignado = nuevaDisponibilidad === 'Asignado';
        
        const finalAsignadoA = esAsignado ? (asignadoA || asignado_a || docSnap.data().asignadoA || null) : null;
        const finalIdentificacion = esAsignado ? (identificacionUsuario || identificacion_usuario || docSnap.data().identificacionUsuario || null) : null;

        const datosActualizados = {
            serial: serial || docSnap.data().serial,
            tipoPropiedad: tipoPropiedad || docSnap.data().tipoPropiedad,
            proveedor: tipoPropiedad === 'Proveedor' ? proveedor : (docSnap.data().proveedor || 'N/A'),
            modelo: modelo || docSnap.data().modelo,
            descripcion: descripcion !== undefined ? descripcion : docSnap.data().descripcion,
            estadoFisico: estadoFisico || docSnap.data().estadoFisico,
            disponibilidad: nuevaDisponibilidad,
            ciudad: ciudad || docSnap.data().ciudad,
            asignadoA: finalAsignadoA,
            identificacionUsuario: finalIdentificacion,
            asignado_a: finalAsignadoA,
            identificacion_usuario: finalIdentificacion,
            fechaActualizacion: new Date().toISOString()
        };

        await equipoRef.update(datosActualizados);

        res.status(200).json({ 
            message: 'Equipo actualizado correctamente', 
            id, 
            ...datosActualizados 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4. Eliminar equipo por ID
app.delete('/api/equipos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const equipoRef = db.collection('equipos').doc(id);
        const docSnap = await equipoRef.get();

        if (!docSnap.exists) {
            return res.status(404).json({ error: 'El equipo no existe.' });
        }

        await equipoRef.delete();
        res.status(200).json({ message: 'Equipo eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// RUTAS DE GESTIÓN DE ACTAS
// ==========================================

app.post('/api/actas', async (req, res) => {
    try {
        const { 
            tipoActa,           
            nombresColaborador, 
            identificacion, 
            correoCorporativo, 
            cargo, 
            centroResultados, 
            liderInmediato, 
            fechaAsignacion,    
            equipos,            
            nombreResponsable,  
            identificacionResponsable,
            usuarioRegistro,
            auditoria_responsable
        } = req.body;

        if (!equipos || !Array.isArray(equipos) || equipos.length === 0) {
            return res.status(400).json({ error: 'Debe incluir al menos un equipo en el acta.' });
        }

        // Definición unificada robusta para cubrir cualquier propiedad que mande el frontend
        const responsableFinal = nombreResponsable || usuarioRegistro || auditoria_responsable || 'Soporte Técnico Positivo';
        const finalIdentificacionResponsable = identificacionResponsable || 'N/A';

        const nuevaActa = {
            tipoActa: tipoActa || 'Asignación',
            nombresColaborador,
            identificacion,
            correoCorporativo,
            cargo,
            centroResultados,
            liderInmediato,
            fechaAsignacion,
            equipos,
            nombreResponsable: responsableFinal,
            usuarioRegistro: responsableFinal, // <-- Garantiza que se guarde el campo en Firestore para el Dashboard
            identificacionResponsable: finalIdentificacionResponsable,
            fechaCreacion: new Date().toISOString()
        };

        const docRef = await db.collection('actas').add(nuevaActa);

        res.status(201).json({ message: `Acta de ${tipoActa} generada con éxito`, id: docRef.id, ...nuevaActa });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/actas', async (req, res) => {
    try {
        const snapshot = await db.collection('actas').get();
        const actas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(actas);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/actas/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const actaRef = db.collection('actas').doc(id);
        const docSnap = await actaRef.get();

        if (!docSnap.exists) {
            return res.status(404).json({ error: 'El acta no existe en la base de datos.' });
        }

        res.status(200).json({ id: docSnap.id, ...docSnap.data() });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// RUTAS DE CHAT (PERSISTENCIA FIRESTORE)
// ==========================================

const parseFecha = (fecha) => {
    if (!fecha) return 0;
    if (typeof fecha.toDate === 'function') return fecha.toDate().getTime();
    return new Date(fecha).getTime();
};

app.get('/api/chat/:chatId/mensajes', async (req, res) => {
    try {
        const { chatId } = req.params;

        const snapshot = await db.collection('mensajes')
            .where('chatId', '==', chatId)
            .get();

        const mensajes = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => parseFecha(a.fechaHora) - parseFecha(b.fechaHora));

        res.status(200).json(mensajes);
    } catch (error) {
        res.status(500).json({ error: 'Error obteniendo mensajes: ' + error.message });
    }
});

app.post('/api/chat/enviar', upload.single('archivo'), async (req, res) => {
    try {
        const { chatId, remitenteEmail, remitenteNombre, remitenteCargo, fechaHora, texto } = req.body;
        const archivoNombre = req.file ? req.file.filename : null;

        const nuevoMensaje = {
            chatId: chatId || 'general',
            remitenteEmail: remitenteEmail || 'usuario@positivo.com',
            remitenteNombre: remitenteNombre || 'Usuario',
            remitenteCargo: remitenteCargo || 'Asociado',
            texto: texto || '',
            archivo: archivoNombre,
            fechaHora: fechaHora || new Date().toISOString()
        };

        const docRef = await db.collection('mensajes').add(nuevoMensaje);

        res.status(201).json({ 
            message: 'Mensaje guardado con éxito', 
            data: { id: docRef.id, ...nuevoMensaje } 
        });
    } catch (error) {
        res.status(500).json({ error: 'Error guardando mensaje: ' + error.message });
    }
});

// ==========================================
// RUTAS DE AUTENTICACIÓN
// ==========================================

app.use('/api/auth', require('./routes/auth.routes'));

app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});