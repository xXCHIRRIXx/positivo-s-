import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../auth/firebase.config';
import { onAuthStateChanged } from 'firebase/auth';

export default function Actas() {
  const navigate = useNavigate();
  
  const [tipoActa, setTipoActa] = useState('Asignación');
  const [sede, setSede] = useState('Bogotá');
  const [nombresColaborador, setNombresColaborador] = useState('');
  const [identificacion, setIdentificacion] = useState('');
  const [correoCorporativo, setCorreoCorporativo] = useState('');
  const [cargo, setCargo] = useState('');
  const [centroResultados, setCentroResultados] = useState('');
  const [liderInmediato, setLiderInmediato] = useState('');
  const [fechaAsignacion, setFechaAsignacion] = useState(new Date().toISOString().split('T')[0]);

  // Estados sincronizados con Firebase Auth y datos del responsable
  const [nombreResponsable, setNombreResponsable] = useState('');
  const [emailResponsable, setEmailResponsable] = useState('');
  const [uidResponsable, setUidResponsable] = useState('');
  const [identificacionResponsable, setIdentificacionResponsable] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setEmailResponsable(user.email || '');
        setUidResponsable(user.uid || '');
      }
    });
    return () => unsubscribe();
  }, []);

  const [equiposSeleccionados, setEquiposSeleccionados] = useState([]);

  const [tipoElemento, setTipoElemento] = useState('Computador');
  const [modeloItem, setModeloItem] = useState('');
  const [serialItem, setSerialItem] = useState('');
  const [estadoFisicoItem, setEstadoFisicoItem] = useState('Bueno');
  const [observacionItem, setObservacionItem] = useState('');

  // Estado para las novedades generales del acta
  const [novedades, setNovedades] = useState('');

  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const agregarEquipoALista = (e) => {
    e.preventDefault();
    if (!modeloItem.trim() || !serialItem.trim()) {
      alert('Por favor ingrese el modelo y el serial del elemento.');
      return;
    }

    if (equiposSeleccionados.some(item => item.serial.toLowerCase() === serialItem.trim().toLowerCase())) {
      alert('Este serial ya está agregado en la lista del acta.');
      return;
    }

    const nuevoItem = {
      idEquipo: Date.now().toString(),
      serial: serialItem.trim(),
      modelo: modeloItem.trim(),
      tipo: tipoElemento,
      estado: estadoFisicoItem,
      observacion: observacionItem.trim() || 'Sin observaciones'
    };

    setEquiposSeleccionados([...equiposSeleccionados, nuevoItem]);
    setModeloItem('');
    setSerialItem('');
    setObservacionItem('');
    setEstadoFisicoItem('Bueno');
  };

  const removerEquipoDeLista = (idEquipo) => {
    setEquiposSeleccionados(equiposSeleccionados.filter(item => item.idEquipo !== idEquipo));
  };

  const handleSubmitActa = async (e) => {
    e.preventDefault();
    setError('');
    setMensaje('');

    if (equiposSeleccionados.length === 0) {
      setError('Debe agregar al menos un elemento al acta.');
      return;
    }

    const payloadActa = {
      tipoActa,
      nombresColaborador,
      identificacion,
      correoCorporativo,
      cargo,
      centroResultados,
      liderInmediato,
      fechaAsignacion,
      equipos: equiposSeleccionados,
      novedades: novedades.trim() || 'Ninguna',
      nombreResponsable,
      emailResponsable,
      uidResponsable,
      identificacionResponsable,
      
      // --- CAMPOS DE AUDITORÍA Y TRAZABILIDAD ---
      usuarioRegistro: nombreResponsable,
      emailUsuario: emailResponsable,
      uidUsuario: uidResponsable,
      auditoria_responsable: nombreResponsable,
      auditoria_sede: sede,
      auditoria_accion: `Generación Acta ${tipoActa}`
    };

    try {
      const response = await fetch('http://localhost:4000/api/actas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadActa)
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("El servidor no devolvió una respuesta JSON válida.");
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error al generar el acta');

      if (data.pdfUrl) {
        window.open(data.pdfUrl, '_blank');
      }

      setMensaje(`¡Acta de ${tipoActa} generada y PDF descargado con éxito!`);
      
      // Limpieza completa de formularios al éxito
      setNombreResponsable('');
      setIdentificacionResponsable('');
      setNombresColaborador('');
      setIdentificacion('');
      setCorreoCorporativo('');
      setCargo('');
      setCentroResultados('');
      setLiderInmediato('');
      setEquiposSeleccionados([]);
      setNovedades('');

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 md:p-10">
      
      <div className="max-w-5xl mx-auto flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-cyan-400">Generador de Actas</h1>
          <p className="text-slate-400 text-sm">Creación formal de actas de asignación y devolución con formato oficial corporativo.</p>
        </div>
        <button 
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sm font-semibold transition-colors"
        >
          ← Volver al Dashboard
        </button>
      </div>

      <div className="max-w-5xl mx-auto bg-slate-800/80 border border-slate-700 rounded-2xl p-6 md:p-8 shadow-xl">
        
        {error && <div className="mb-6 p-4 bg-red-500/20 border border-red-500 text-red-300 rounded-xl text-sm">{error}</div>}
        {mensaje && <div className="mb-6 p-4 bg-emerald-500/20 border border-emerald-500 text-emerald-300 rounded-xl text-sm">{mensaje}</div>}

        <form onSubmit={handleSubmitActa} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 border-b border-slate-700">
            <div>
              <label className="block text-xs font-semibold text-cyan-300 uppercase mb-2">Tipo de Acta</label>
              <select
                value={tipoActa}
                onChange={(e) => {
                  setTipoActa(e.target.value);
                  setEquiposSeleccionados([]);
                }}
                className="w-full px-4 py-2.5 bg-slate-900 border border-cyan-500/50 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-400"
              >
                <option value="Asignación">ACTA DE ASIGNACIÓN</option>
                <option value="Devolución">ACTA DE DEVOLUCIÓN</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-cyan-300 uppercase mb-2">Sede / Ubicación</label>
              <select
                value={sede}
                onChange={(e) => setSede(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900 border border-cyan-500/50 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-400"
              >
                <option value="Bogotá">BOGOTA</option>
                <option value="Medellín">MEDELLÍN</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">Fecha del Proceso</label>
              <input
                type="date"
                required
                value={fechaAsignacion}
                onChange={(e) => setFechaAsignacion(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-cyan-300 mb-4">Datos del Responsable (Técnico / Service Desk)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-cyan-300 uppercase mb-1">Nombre Responsable</label>
                <select
                  required
                  value={nombreResponsable}
                  onChange={(e) => setNombreResponsable(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-cyan-500/50 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400"
                >
                  <option value="" disabled>-- Seleccione un responsable --</option>
                  <option value="JUAN CASTRO">JUAN DAVID CASTRO</option>
                  <option value="ANDRES CASTRO">ANDRES FELIPE CASTRO</option>
                  <option value="ESTEFANIA ROCHA">ESTEFANIA GALARZA ROCHA</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Cédula del Responsable</label>
                <input
                  type="text"
                  required
                  value={identificacionResponsable}
                  onChange={(e) => setIdentificacionResponsable(e.target.value)}
                  placeholder="Ej. 10203040"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-700">
            <h3 className="text-lg font-bold text-emerald-400 mb-4">Datos del Colaborador</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Nombres Completos</label>
                <input
                  type="text"
                  required
                  value={nombresColaborador}
                  onChange={(e) => setNombresColaborador(e.target.value)}
                  placeholder="Ej. Juan Pérez"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Identificación (Cédula)</label>
                <input
                  type="text"
                  required
                  value={identificacion}
                  onChange={(e) => setIdentificacion(e.target.value)}
                  placeholder="Ej. 10203040"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Correo Corporativo</label>
                <input
                  type="email"
                  required
                  value={correoCorporativo}
                  onChange={(e) => setCorreoCorporativo(e.target.value)}
                  placeholder="juan.perez@positivo.com"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Cargo</label>
                <input
                  type="text"
                  required
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                  placeholder="Analista de Soporte"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Centro de Resultados</label>
                <input
                  type="text"
                  required
                  value={centroResultados}
                  onChange={(e) => setCentroResultados(e.target.value)}
                  placeholder="CR-TI-01"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Líder Inmediato</label>
                <input
                  type="text"
                  required
                  value={liderInmediato}
                  onChange={(e) => setLiderInmediato(e.target.value)}
                  placeholder="Nombre del líder"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-700">
            <h3 className="text-lg font-bold text-cyan-300 mb-4">Registro de Elementos / Equipos</h3>
            
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700 grid grid-cols-1 md:grid-cols-6 gap-3 items-end mb-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Tipo</label>
                <select
                  value={tipoElemento}
                  onChange={(e) => setTipoElemento(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="Computador">LAPTOP POSITIVOS</option>
                  <option value="Celular">CELULAR</option>
                  <option value="Herramienta">LINEA TELEFÓNICA</option>
                  <option value="Periférico">TECLADO</option>
                  <option value="Almacenamiento">MOUSE</option>
                  <option value="Otro">DIADEMA</option>
                  <option value="Periférico">BASE REFRIGERANTE</option>
                  <option value="Almacenamiento">PANTALLA</option>
                  <option value="Otro">MULTIPUERTO</option>
                  <option value="Otro">CABLE UTP</option>
                  <option value="Otro">CABLE HDMI</option>
                  <option value="Periférico">DESTORNILLADORES</option>
                  <option value="Almacenamiento">DISCO SÓLIDO</option>
                  <option value="Otro">DISCO MECÁNICO</option>
                  <option value="Periférico">GUAYA</option>
                  <option value="Almacenamiento">MALETA</option>
                  <option value="Otro">OTRO</option>

                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Modelo / Elemento</label>
                <input
                  type="text"
                  value={modeloItem}
                  onChange={(e) => setModeloItem(e.target.value)}
                  placeholder="Ej. Dell Latitude 3420"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Serial</label>
                <input
                  type="text"
                  value={serialItem}
                  onChange={(e) => setSerialItem(e.target.value)}
                  placeholder="Ej. 5CG1234ABC"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Estado Físico</label>
                <select
                  value={estadoFisicoItem}
                  onChange={(e) => setEstadoFisicoItem(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="Bueno">BUENO</option>
                  <option value="Con falla">CON FALLA</option>
                  <option value="Dañado">DAÑADO</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Observación</label>
                <input
                  type="text"
                  value={observacionItem}
                  onChange={(e) => setObservacionItem(e.target.value)}
                  placeholder="Ej. Rayón leve en tapa"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <button
                  type="button"
                  onClick={agregarEquipoALista}
                  className="w-full px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg text-sm transition-colors shadow-md"
                >
                  + Agregar
                </button>
              </div>
            </div>

            {equiposSeleccionados.length > 0 ? (
              <div className="overflow-x-auto border border-slate-700 rounded-xl mb-6">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-900 text-xs uppercase text-cyan-400">
                    <tr>
                      <th className="px-4 py-3">Tipo</th>
                      <th className="px-4 py-3">Modelo</th>
                      <th className="px-4 py-3">Serial</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3">Observación</th>
                      <th className="px-4 py-3 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {equiposSeleccionados.map((item) => (
                      <tr key={item.idEquipo} className="hover:bg-slate-900/40">
                        <td className="px-4 py-3 font-medium text-white">{item.tipo}</td>
                        <td className="px-4 py-3">{item.modelo}</td>
                        <td className="px-4 py-3 font-mono text-cyan-300">{item.serial}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            item.estado === 'Bueno' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {item.estado}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400">{item.observacion}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => removerEquipoDeLista(item.idEquipo)}
                            className="text-red-400 hover:text-red-300 font-bold px-2 py-1 bg-red-500/10 hover:bg-red-500/20 rounded text-xs transition-colors"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic text-center py-4 bg-slate-900/30 rounded-xl border border-dashed border-slate-700 mb-6">
                No hay elementos agregados todavía. Complete los campos superiores y presione "+ Agregar".
              </p>
            )}

            <div>
              <label className="block text-xs font-semibold text-cyan-300 uppercase mb-2">Novedades / Observaciones Generales del Acta</label>
              <textarea
                value={novedades}
                onChange={(e) => setNovedades(e.target.value)}
                placeholder="Escriba aquí cualquier novedad o comentario adicional general (Opcional)..."
                rows="2"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500"
              ></textarea>
            </div>

          </div>

          <div className="pt-6 border-t border-slate-700 flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-base shadow-lg transition-colors flex items-center gap-2"
            >
              Generar Acta y Descargar PDF
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}