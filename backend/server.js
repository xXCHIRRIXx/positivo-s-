require('dotenv').config();

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const verifyToken = require('./auth/auth.middleware');
const { db } = require('./auth/firebase.config');
const generarActaPDF = require('./helpers/pdfGenerator');

const app = express();
const PORT = process.env.PORT || 4000;

// ==========================================
// MIDDLEWARES GLOBALES
// ==========================================
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ==========================================
// CONFIGURACIÓN DE CARPETA Y MULTER (FOTOS)
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
    limits: { fileSize: 10 * 1024 * 1024 }
});

const uploadFlexible = (fieldName) => {
    return (req, res, next) => {
        upload.single(fieldName)(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                return res.status(400).json({ error: `Error en la subida del archivo: ${err.message}` });
            } else if (err) {
                return res.status(500).json({ error: `Error interno de archivo: ${err.message}` });
            }
            next();
        });
    };
};

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
                cargo: data.cargo || 'Asociado',
                foto: data.foto || ''
            };
        });
        res.status(200).json(usuarios);
    } catch (error) {
        res.status(500).json({ error: 'Error obteniendo usuarios: ' + error.message });
    }
});

const actualizarUsuarioHandler = async (req, res) => {
    try {
        const identificador = req.body.email || req.params.email || req.params.id;
        
        if (!identificador) {
            return res.status(400).json({ error: 'Falta el correo o identificador del usuario.' });
        }

        const { nombre, cargo } = req.body;
        let fotoFinal = req.body.foto;

        // Si se subió un archivo tradicional por multipart/form-data
        if (req.file) {
            fotoFinal = `http://localhost:${PORT}/uploads/${req.file.filename}`;
        } 
        // Si se envió una cadena Base64 (ej. data:image/png;base64,...) en el JSON body
        else if (fotoFinal && typeof fotoFinal === 'string' && fotoFinal.startsWith('data:image/')) {
            try {
                const matches = fotoFinal.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
                if (matches && matches.length === 3) {
                    let ext = matches[1].toLowerCase();
                    if (ext === 'jpeg') ext = 'jpg';
                    const base64Data = matches[2];
                    const buffer = Buffer.from(base64Data, 'base64');
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                    const filename = `${uniqueSuffix}.${ext}`;
                    const filepath = path.join(uploadDir, filename);
                    fs.writeFileSync(filepath, buffer);
                    fotoFinal = `http://localhost:${PORT}/uploads/${filename}`;
                }
            } catch (err) {
                console.error("Error al procesar la imagen en Base64:", err);
            }
        }

        const usuariosRef = db.collection('usuarios');
        let snapshot = await usuariosRef.where('email', '==', identificador).get();
        
        if (snapshot.empty) {
            snapshot = await usuariosRef.where('correo', '==', identificador).get();
        }

        if (snapshot.empty) {
            const nuevoDocRef = usuariosRef.doc();
            await nuevoDocRef.set({
                email: identificador,
                nombre: nombre || 'Usuario',
                cargo: cargo || 'Asociado',
                foto: fotoFinal || ''
            });

            return res.status(200).json({ 
                message: 'Perfil creado y guardado correctamente',
                foto: fotoFinal || ''
            });
        }

        const batch = db.batch();
        snapshot.docs.forEach(doc => {
            const updateData = {};
            if (nombre !== undefined) updateData.nombre = nombre;
            if (cargo !== undefined) updateData.cargo = cargo;
            if (fotoFinal !== undefined) updateData.foto = fotoFinal;
            batch.update(doc.ref, updateData);
        });
        await batch.commit();

        res.status(200).json({ 
            message: 'Perfil actualizado correctamente en la base de datos',
            foto: fotoFinal || ''
        });
    } catch (error) {
        console.error("Error en servidor al actualizar perfil:", error);
        res.status(500).json({ error: 'Error actualizando perfil: ' + error.message });
    }
};

app.post('/api/usuarios/actualizar', uploadFlexible('foto'), actualizarUsuarioHandler);
app.post('/api/usuarios/:email', uploadFlexible('foto'), actualizarUsuarioHandler);
app.post('/api/perfil', uploadFlexible('foto'), actualizarUsuarioHandler);

// ==========================================
// RUTAS DE GESTIÓN DE EQUIPOS
// ==========================================
app.post('/api/equipos', async (req, res) => {
    try {
        const { 
            serial, tipoPropiedad, proveedor, modelo, descripcion, 
            estadoFisico, disponibilidad, ciudad, usuarioRegistro,
            asignadoA, asignado_a, identificacionUsuario, identificacion_usuario
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
            usuarioRegistro: usuarioRegistro || 'Desconocido',
            fechaRegistro: new Date().toISOString()
        };

        const docRef = await db.collection('equipos').add(nuevoEquipo);
        res.status(201).json({ message: 'Equipo registrado con éxito', id: docRef.id, ...nuevoEquipo });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/equipos', async (req, res) => {
    try {
        const snapshot = await db.collection('equipos').get();
        const equipos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(equipos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/equipos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const docSnap = await db.collection('equipos').doc(id).get();
        if (!docSnap.exists) {
            return res.status(404).json({ error: 'El equipo no existe en la base de datos.' });
        }
        res.status(200).json({ id: docSnap.id, ...docSnap.data() });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/equipos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            serial, tipoPropiedad, proveedor, modelo, descripcion, 
            estadoFisico, disponibilidad, ciudad, asignadoA, asignado_a, 
            identificacionUsuario, identificacion_usuario 
        } = req.body;

        const equipoRef = db.collection('equipos').doc(id);
        const docSnap = await equipoRef.get();

        if (!docSnap.exists) {
            return res.status(404).json({ error: 'El equipo no existe en la base de datos.' });
        }

        const nuevaDisponibilidad = disponibilidad || docSnap.data().disponibilidad;
        const esAsignado = nuevaDisponibilidad === 'Asignado';
        
        const finalAsignadoA = esAsignado ? (asignadoA || asignado_a || docSnap.data().asignadoA || null) : null;
        const finalIdentificacion = esAsignado ? (identificacionUsuario || identificacion_usuario || docSnap.data().identificacionUsuario || null) : null;

        const datosActualizados = {
            serial: serial || docSnap.data().serial,
            tipoPropiedad: tipoPropiedad || docSnap.data().tipoPropiedad,
            proveedor: tipoPropiedad === 'Proveedor' ? proveedor : 'N/A',
            modelo: modelo || docSnap.data().modelo,
            descripcion: descripcion !== undefined ? descripcion : docSnap.data().descripcion,
            estadoFisico: estadoFisico || docSnap.data().estadoFisico,
            disponibilidad: nuevaDisponibilidad,
            ciudad: ciudad || docSnap.data().ciudad,
            asignadoA: finalAsignadoA,
            identificacionUsuario: finalIdentificacion,
            fechaActualizacion: new Date().toISOString()
        };

        await equipoRef.update(datosActualizados);
        res.status(200).json({ message: 'Equipo actualizado correctamente', id, ...datosActualizados });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

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
// RUTAS DE GESTIÓN DE ACTAS (CON PUPPETEER)
// ==========================================
app.post('/api/actas', async (req, res) => {
    try {
        const datosActa = req.body;

        if (!datosActa.equipos || !Array.isArray(datosActa.equipos) || datosActa.equipos.length === 0) {
            return res.status(400).json({ error: 'Debe incluir al menos un equipo en el acta.' });
        }

        const pdfResult = await generarActaPDF(datosActa);
        let nombreArchivo = null;
        if (typeof pdfResult === 'string') {
            nombreArchivo = path.basename(pdfResult);
        } else if (pdfResult && typeof pdfResult === 'object') {
            nombreArchivo = pdfResult.nombreArchivo || pdfResult.filename || pdfResult.file || pdfResult.name;
        }

        if (!nombreArchivo) {
            nombreArchivo = `acta_${Date.now()}.pdf`;
        }

        const responsableFinal = datosActa.nombreResponsable || datosActa.usuarioRegistro || 'Soporte Técnico Positivo';

        const nuevaActa = {
            tipoActa: datosActa.tipoActa || 'Asignación',
            nombresColaborador: datosActa.nombresColaborador,
            identificacion: datosActa.identificacion,
            correoCorporativo: datosActa.correoCorporativo,
            cargo: datosActa.cargo,
            centroResultados: datosActa.centroResultados,
            liderInmediato: datosActa.liderInmediato,
            fechaAsignacion: datosActa.fechaAsignacion,
            equipos: datosActa.equipos,
            nombreResponsable: responsableFinal,
            identificacionResponsable: datosActa.identificacionResponsable || 'N/A',
            nombreArchivo: nombreArchivo,
            fechaCreacion: new Date().toISOString()
        };

        const docRef = await db.collection('actas').add(nuevaActa);

        const tipoActaLower = (datosActa.tipoActa || 'Asignación').toLowerCase();
        const esDevolucion = tipoActaLower.includes('devolución') || tipoActaLower.includes('devolucion');

        for (const eq of datosActa.equipos) {
            const serialEquipo = eq.serial || eq.numeroSerial;
            if (serialEquipo) {
                const equipoSnapshot = await db.collection('equipos').where('serial', '==', serialEquipo).get();
                
                if (!equipoSnapshot.empty) {
                    const equipoDocRef = equipoSnapshot.docs[0].ref;
                    const datosEquipoActual = equipoSnapshot.docs[0].data();

                    const camposActualizacion = {
                        fechaActualizacion: new Date().toISOString()
                    };

                    if (esDevolucion) {
                        camposActualizacion.actaDevolucion = nombreArchivo;
                        camposActualizacion.disponibilidad = 'Disponible';
                        camposActualizacion.asignadoA = null;
                        camposActualizacion.identificacionUsuario = null;
                    } else {
                        camposActualizacion.actaAsignacion = nombreArchivo;
                        camposActualizacion.disponibilidad = 'Asignado';
                        camposActualizacion.asignadoA = datosActa.nombresColaborador || datosEquipoActual.asignadoA;
                        camposActualizacion.identificacionUsuario = datosActa.identificacion || datosEquipoActual.identificacionUsuario;
                    }

                    await equipoDocRef.update(camposActualizacion);
                }
            }
        }

        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const pdfUrl = `${baseUrl}/uploads/${nombreArchivo}`;

        res.status(201).json({ 
            message: 'Acta generada, PDF creado y equipos actualizados con éxito', 
            id: docRef.id, 
            pdfUrl: pdfUrl,
            nombreArchivo: nombreArchivo,
            ...nuevaActa 
        });
    } catch (error) {
        console.error("Error al generar el acta o PDF:", error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/actas', async (req, res) => {
    try {
        const snapshot = await db.collection('actas').get();
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        
        const actas = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                pdfUrl: data.nombreArchivo ? `${baseUrl}/uploads/${data.nombreArchivo}` : null
            };
        });
        res.status(200).json(actas);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/actas/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const docSnap = await db.collection('actas').doc(id).get();
        if (!docSnap.exists) {
            return res.status(404).json({ error: 'El acta no existe en la base de datos.' });
        }
        const data = docSnap.data();
        const baseUrl = `${req.protocol}://${req.get('host')}`;

        res.status(200).json({ 
            id: docSnap.id, 
            ...data,
            pdfUrl: data.nombreArchivo ? `${baseUrl}/uploads/${data.nombreArchivo}` : null
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// RUTAS DE CHAT
// ==========================================
const parseFecha = (fecha) => {
    if (!fecha) return 0;
    if (typeof fecha.toDate === 'function') return fecha.toDate().getTime();
    return new Date(fecha).getTime();
};

app.get('/api/chat/:chatId/mensajes', async (req, res) => {
    try {
        const { chatId } = req.params;
        const snapshot = await db.collection('mensajes').where('chatId', '==', chatId).get();
        const mensajes = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => parseFecha(a.fechaHora) - parseFecha(b.fechaHora));
        res.status(200).json(mensajes);
    } catch (error) {
        res.status(500).json({ error: 'Error obteniendo mensajes: ' + error.message });
    }
});

app.post('/api/chat/enviar', uploadFlexible('archivo'), async (req, res) => {
    try {
        const { chatId, remitenteEmail, remitenteNombre, remitenteCargo, fechaHora, texto } = req.body;
        const nuevoMensaje = {
            chatId: chatId || 'general',
            remitenteEmail: remitenteEmail || 'usuario@positivo.com',
            remitenteNombre: remitenteNombre || 'Usuario',
            remitenteCargo: remitenteCargo || 'Asociado',
            texto: texto || '',
            archivo: req.file ? `http://localhost:${PORT}/uploads/${req.file.filename}` : null,
            fechaHora: fechaHora || new Date().toISOString()
        };
        const docRef = await db.collection('mensajes').add(nuevoMensaje);
        res.status(201).json({ message: 'Mensaje guardado con éxito', data: { id: docRef.id, ...nuevoMensaje } });
    } catch (error) {
        res.status(500).json({ error: 'Error guardando mensaje: ' + error.message });
    }
});

const authRoutesPath = './routes/auth.routes';
if (fs.existsSync(path.join(__dirname, 'routes', 'auth.routes.js')) || fs.existsSync(path.join(__dirname, 'routes', 'auth.routes'))) {
    app.use('/api/auth', require(authRoutesPath));
}

// ==========================================
// MIDDLEWARE DE MANEJO DE ERRORES GLOBAL
// ==========================================
app.use((err, req, res, next) => {
    console.error("Error crítico capturado en servidor:", err);
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'El archivo adjunto supera el límite máximo permitido de 10MB.' });
        }
        return res.status(400).json({ error: `Error en la subida del archivo: ${err.message}` });
    } else if (err) {
        return res.status(500).json({ error: `Error interno: ${err.message}` });
    }
    next();
});

app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});