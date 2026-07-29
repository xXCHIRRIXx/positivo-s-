import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../auth/firebase.config'; 
import { collection, onSnapshot } from 'firebase/firestore';

export default function AuditoriaDashboard() {
  const navigate = useNavigate();
  
  const [busqueda, setBusqueda] = useState('');
  const [filtroSede, setFiltroSede] = useState('Todas');
  const [filtroAccion, setFiltroAccion] = useState('Todas');
  const [filtroFecha, setFiltroFecha] = useState('');
  const [logs, setLogs] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [equipoModal, setEquipoModal] = useState(null); // Estado para controlar el modal de equipos

  useEffect(() => {
    let usuariosMap = {}; 
    let equiposDocs = [];
    let actasDocs = [];
    let cargandoUsuarios = true;
    let cargandoEquipos = true;
    let cargandoActas = true;

    const formatearNombre = (str) => {
      if (!str) return '';
      return str
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };

    const verificarYActualizar = () => {
      if (cargandoUsuarios && cargandoEquipos && cargandoActas) return;

      const resolverResponsable = (data) => {
        const posiblesReferencias = [
          data.uidUsuario, data.uid, data.userId,
          data.emailUsuario, data.email, data.correoCorporativo,
          data.creadoPor, data.createdBy
        ];

        for (const ref of posiblesReferencias) {
          if (ref && usuariosMap[ref]) {
            return usuariosMap[ref];
          }
        }

        const nombresDirectos = [
          data.nombreResponsable, data.usuarioRegistro,
          data.registradoPor, data.responsable,
          data.usuario, data.nombre
        ];

        for (const val of nombresDirectos) {
          if (val && typeof val === 'string' && val.trim().length > 1) {
            const valLower = val.toLowerCase();
            if (!valLower.includes('invitado') && !valLower.includes('soporte') && !valLower.includes('tecnico') && !valLower.includes('usuario')) {
              return formatearNombre(val);
            }
          }
        }

        return 'No registrado';
      };

      const equiposMapeados = equiposDocs.map(doc => {
        const data = doc.data();
        let fechaFormateada = 'Sin fecha';
        let fechaObj = null;
        
        const rawFecha = data.fechaRegistro || data.createdAt || data.fecha || data.timestamp || data.date || data.fechaCreacion;
        if (rawFecha) {
          fechaObj = typeof rawFecha.toDate === 'function' 
            ? rawFecha.toDate() 
            : new Date(rawFecha);
          
          if (!isNaN(fechaObj.getTime())) {
            fechaFormateada = fechaObj.toLocaleString();
          } else {
            fechaObj = null;
          }
        }

        return {
          id: doc.id,
          idAuditoria: `EQ-${doc.id.slice(0, 5).toUpperCase()}`,
          fechaHora: fechaFormateada,
          fechaObj: fechaObj,
          responsable: resolverResponsable(data),
          sede: data.sede || data.ubicacion || 'Bogotá',
          modulo: 'Inventario',
          accion: 'Registro de Equipo',
          detalle: `Equipo: ${data.tipo || data.marca || data.modelo || 'Dispositivo'} (Serial: ${data.serial || data.serialEquipo || 'N/A'})`,
          pdfUrl: null,
          datosEquipo: data // Guardamos la data completa del equipo para mostrarla en el modal
        };
      });

      const actasMapeadas = actasDocs.map(doc => {
        const data = doc.data();
        let fechaFormateada = 'Sin fecha';
        let fechaObj = null;
        
        const rawFecha = data.fechaGeneracion || data.createdAt || data.fecha || data.timestamp || data.date || data.fechaCreacion;
        if (rawFecha) {
          fechaObj = typeof rawFecha.toDate === 'function' 
            ? rawFecha.toDate() 
            : new Date(rawFecha);

          if (!isNaN(fechaObj.getTime())) {
            fechaFormateada = fechaObj.toLocaleString();
          } else {
            fechaObj = null;
          }
        }

        const colaboradorNombre = data.nombresColaborador || data.colaborador || data.nombreColaborador || data.empleado || data.destinatario || data.nombreCompleto || data.trabajador || 'N/A';

        // Construcción de la URL del PDF basándose en el nombreArchivo o pdfUrl que entrega el backend
        let pdfUrlFinal = data.pdfUrl || null;
        if (!pdfUrlFinal && data.nombreArchivo) {
          const origin = window.location.origin.includes('localhost') ? 'http://localhost:4000' : window.location.origin;
          pdfUrlFinal = `${origin}/uploads/${data.nombreArchivo}`;
        }

        return {
          id: doc.id,
          idAuditoria: `ACT-${doc.id.slice(0, 5).toUpperCase()}`,
          fechaHora: fechaFormateada,
          fechaObj: fechaObj,
          responsable: resolverResponsable(data),
          sede: data.sede || data.ubicacion || 'Bogotá',
          modulo: 'Actas',
          accion: data.tipoActa || 'Generación de Acta',
          detalle: `Acta para colaborador: ${colaboradorNombre}`,
          pdfUrl: pdfUrlFinal,
          datosEquipo: null
        };
      });

      setLogs([...equiposMapeados, ...actasMapeadas]);
      setCargando(false);
    };

    const procesarSnapshotUsuarios = (snapshot) => {
      snapshot.docs.forEach(doc => {
        const uData = doc.data();
        const nombreReal = uData.nombre || uData.name || uData.displayName || uData.nombres;
        if (nombreReal) {
          const nombreLimpio = formatearNombre(nombreReal);
          usuariosMap[doc.id] = nombreLimpio;
          if (uData.uid) usuariosMap[uData.uid] = nombreLimpio;
          if (uData.email) usuariosMap[uData.email] = nombreLimpio;
        }
      });
      cargandoUsuarios = false;
      verificarYActualizar();
    };

    const unsubUsuarios = onSnapshot(collection(db, 'usuarios'), procesarSnapshotUsuarios, () => {
      cargandoUsuarios = false;
      verificarYActualizar();
    });
    
    const unsubUsers = onSnapshot(collection(db, 'users'), procesarSnapshotUsuarios, () => {});

    const unsubEquipos = onSnapshot(collection(db, 'equipos'), (snapshot) => {
      equiposDocs = snapshot.docs;
      cargandoEquipos = false;
      verificarYActualizar();
    }, () => {
      cargandoEquipos = false;
      verificarYActualizar();
    });

    const unsubActas = onSnapshot(collection(db, 'actas'), (snapshot) => {
      actasDocs = snapshot.docs;
      cargandoActas = false;
      verificarYActualizar();
    }, () => {
      cargandoActas = false;
      verificarYActualizar();
    });

    return () => {
      unsubUsuarios();
      unsubUsers();
      unsubEquipos();
      unsubActas();
    };
  }, []);

  const handleVerPdf = (pdfUrl) => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    } else {
      alert('El archivo PDF para este registro no está disponible.');
    }
  };

  const logsFiltrados = logs.filter(log => {
    const coincideSede = filtroSede === 'Todas' || log.sede === filtroSede;
    
    let coincideAccion = true;
    if (filtroAccion !== 'Todas') {
      if (filtroAccion === 'Acta') {
        coincideAccion = log.modulo === 'Actas'; 
      } else if (filtroAccion === 'Registro') {
        coincideAccion = log.modulo === 'Inventario';
      } else {
        coincideAccion = log.accion && log.accion.toLowerCase().includes(filtroAccion.toLowerCase());
      }
    }

    const textoBusqueda = busqueda.toLowerCase();
    const coincideBusqueda = 
      (log.responsable && log.responsable.toLowerCase().includes(textoBusqueda)) ||
      (log.detalle && log.detalle.toLowerCase().includes(textoBusqueda)) ||
      (log.idAuditoria && log.idAuditoria.toLowerCase().includes(textoBusqueda));

    let coincideFecha = true;
    if (filtroFecha && log.fechaObj) {
      const yyyy = log.fechaObj.getFullYear();
      const mm = String(log.fechaObj.getMonth() + 1).padStart(2, '0');
      const dd = String(log.fechaObj.getDate()).padStart(2, '0');
      const fechaLogStr = `${yyyy}-${mm}-${dd}`;
      coincideFecha = fechaLogStr === filtroFecha;
    } else if (filtroFecha && !log.fechaObj) {
      coincideFecha = false;
    }

    return coincideSede && coincideAccion && coincideBusqueda && coincideFecha;
  });

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 md:p-10 relative">
      
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-indigo-400">Historial / Trazabilidad</h1>
          <p className="text-slate-400 text-sm mt-1">Registro en tiempo real de equipos ingresados y actas generadas por sede. Haz clic en un registro de acta para visualizar su PDF o en los detalles del equipo.</p>
        </div>
        <button 
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sm font-semibold transition-colors"
        >
          ← Volver al Dashboard
        </button>
      </div>

      <div className="max-w-7xl mx-auto bg-slate-800/80 border border-slate-700 rounded-2xl p-6 shadow-xl">
        
        {/* Controles de búsqueda y filtros */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 pb-6 border-b border-slate-700">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">Buscar (Responsable, Detalle, ID)</label>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Ej. Juancho, Andres, Dell..."
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-indigo-300 uppercase mb-2">Sede</label>
            <select
              value={filtroSede}
              onChange={(e) => setFiltroSede(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900 border border-indigo-500/50 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-400"
            >
              <option value="Todas">Todas las Sedes</option>
              <option value="Bogotá">Bogotá</option>
              <option value="Medellín">Medellín</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-indigo-300 uppercase mb-2">Tipo de Acción</label>
            <select
              value={filtroAccion}
              onChange={(e) => setFiltroAccion(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900 border border-indigo-500/50 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-400"
            >
              <option value="Todas">Todas las Acciones</option>
              <option value="Registro">Registro de Equipo</option>
              <option value="Acta">Generación de Acta (Todas)</option>
              <option value="Asignación">Asignación</option>
              <option value="Devolución">Devolución</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-indigo-300 uppercase mb-2">Fecha</label>
            <input
              type="date"
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900 border border-indigo-500/50 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-400"
            />
          </div>
        </div>

        {cargando ? (
          <div className="text-center py-12 text-slate-400 text-sm animate-pulse">
            Sincronizando con Firebase Firestore...
          </div>
        ) : logsFiltrados.length > 0 ? (
          <div className="overflow-x-auto border border-slate-700 rounded-xl">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900 text-xs uppercase text-indigo-400">
                <tr>
                  <th className="px-4 py-3">ID / Fecha</th>
                  <th className="px-4 py-3">Responsable</th>
                  <th className="px-4 py-3">Sede</th>
                  <th className="px-4 py-3">Acción</th>
                  <th className="px-4 py-3">Detalle del Registro</th>
                  <th className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {logsFiltrados.map((log) => (
                  <tr 
                    key={log.id} 
                    className={`hover:bg-slate-900/40 transition-colors ${log.pdfUrl ? 'cursor-pointer' : ''}`}
                    onClick={() => {
                      if (log.pdfUrl) handleVerPdf(log.pdfUrl);
                    }}
                  >
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs text-indigo-300">{log.idAuditoria}</div>
                      <div className="text-slate-400 text-xs">{log.fechaHora}</div>
                    </td>
                    <td className="px-4 py-3 font-medium text-white flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-xs">
                        {log.responsable ? log.responsable.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <span className="truncate max-w-xs" title={log.responsable}>{log.responsable}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        log.sede === 'Bogotá' ? 'bg-blue-500/20 text-blue-300' : 'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {log.sede}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-200">{log.accion}</span>
                      <div className="text-slate-500 text-xs">{log.modulo}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 max-w-md truncate" title={log.detalle}>
                      {log.detalle}
                    </td>
                    <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      {log.pdfUrl ? (
                        <button
                          onClick={() => handleVerPdf(log.pdfUrl)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow transition-all flex items-center gap-1 mx-auto"
                          title="Ver Acta en PDF"
                        >
                          📄 Ver PDF
                        </button>
                      ) : log.datosEquipo ? (
                        <button
                          onClick={() => setEquipoModal(log.datosEquipo)}
                          className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-indigo-300 rounded-lg text-xs font-semibold shadow transition-all flex items-center gap-1 mx-auto border border-slate-600"
                          title="Ver Detalle del Equipo"
                        >
                          🔍 Ver Detalle
                        </button>
                      ) : (
                        <span className="text-xs text-slate-500 italic">No aplica</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 bg-slate-900/30 rounded-xl border border-dashed border-slate-700">
            <p className="text-sm text-slate-400 italic">No hay registros que coincidan con los filtros seleccionados.</p>
            <p className="text-xs text-slate-500 mt-1">Prueba cambiando los parámetros de búsqueda o la fecha.</p>
          </div>
        )}

      </div>

      {/* ================= MODAL DE DETALLE DE EQUIPO ================= */}
      {equipoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-xl p-6 shadow-2xl text-white relative animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center pb-4 border-b border-slate-700 mb-4">
              <h3 className="text-lg font-bold text-indigo-400 flex items-center gap-2">
                <span>💻</span> Detalle del Equipo Registrado
              </h3>
              <button 
                onClick={() => setEquipoModal(null)}
                className="text-slate-400 hover:text-white bg-slate-900/50 hover:bg-slate-900 p-1.5 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-6 max-h-[60vh] overflow-y-auto pr-1">
              <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                <span className="block text-xs font-semibold text-slate-400 uppercase">Serial</span>
                <span className="font-mono text-indigo-300 font-medium">{equipoModal.serial || equipoModal.serialEquipo || 'N/A'}</span>
              </div>
              <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                <span className="block text-xs font-semibold text-slate-400 uppercase">Modelo / Marca / Tipo</span>
                <span className="font-medium">{equipoModal.modelo || equipoModal.marca || equipoModal.tipo || 'N/A'}</span>
              </div>
              <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                <span className="block text-xs font-semibold text-slate-400 uppercase">Tipo de Propiedad</span>
                <span className="font-medium">{equipoModal.tipoPropiedad || 'Propio'}</span>
              </div>
              <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                <span className="block text-xs font-semibold text-slate-400 uppercase">Proveedor</span>
                <span className="font-medium">{equipoModal.proveedor || 'N/A'}</span>
              </div>
              <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                <span className="block text-xs font-semibold text-slate-400 uppercase">Estado Físico</span>
                <span className="font-medium">{equipoModal.estadoFisico || 'Bueno'}</span>
              </div>
              <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                <span className="block text-xs font-semibold text-slate-400 uppercase">Disponibilidad</span>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold mt-1 ${
                  equipoModal.disponibilidad === 'Asignado' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                }`}>
                  {equipoModal.disponibilidad || 'Disponible'}
                </span>
              </div>
              <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                <span className="block text-xs font-semibold text-slate-400 uppercase">Ciudad / Sede</span>
                <span className="font-medium">{equipoModal.sede || equipoModal.ciudad || 'Bogotá'}</span>
              </div>
              <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                <span className="block text-xs font-semibold text-slate-400 uppercase">Registrado Por</span>
                <span className="font-medium">{equipoModal.usuarioRegistro || 'Desconocido'}</span>
              </div>
              {equipoModal.asignadoA && (
                <div className="md:col-span-2 bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                  <span className="block text-xs font-semibold text-slate-400 uppercase">Asignado a Colaborador</span>
                  <span className="font-medium text-emerald-300">
                    {equipoModal.asignadoA} {equipoModal.identificacionUsuario ? `(ID: ${equipoModal.identificacionUsuario})` : ''}
                  </span>
                </div>
              )}
              {equipoModal.descripcion && (
                <div className="md:col-span-2 bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                  <span className="block text-xs font-semibold text-slate-400 uppercase">Descripción / Observaciones</span>
                  <span className="text-slate-300 text-xs">{equipoModal.descripcion}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-700">
              <button
                onClick={() => setEquipoModal(null)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}