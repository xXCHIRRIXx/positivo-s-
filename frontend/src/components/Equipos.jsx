import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { auth } from '../auth/firebase.config';
import { onAuthStateChanged } from 'firebase/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const initialFormState = {
  serial: '',
  tipoPropiedad: 'Propio',
  proveedor: '',
  modelo: '',
  descripcion: '',
  estadoFisico: 'Bueno',
  disponibilidad: 'Disponible',
  ciudad: 'Bogotá',
  asignadoA: '',
  identificacionUsuario: '',
  usuarioRegistro: ''
};

export default function Equipos() {
  const navigate = useNavigate();
  const [equipos, setEquipos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('Todos');
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const [esAdmin, setEsAdmin] = useState(true); 
  const [equipoEditando, setEquipoEditando] = useState(null);

  const [emailUsuario, setEmailUsuario] = useState('');
  const [uidUsuario, setUidUsuario] = useState('');

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    cargarEquipos();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setEmailUsuario(user.email || '');
        setUidUsuario(user.uid || '');
      }
    });
    return () => unsubscribe();
  }, []);

  const cargarEquipos = async () => {
    try {
      const response = await fetch(`${API_URL}/api/equipos`);
      const data = await response.json();
      if (response.ok) setEquipos(data);
    } catch (err) {
      console.error('Error al cargar equipos:', err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const iniciarEdicion = (eq) => {
    setEquipoEditando(eq.id);
    setFormData({
      serial: eq.serial || '',
      tipoPropiedad: eq.tipoPropiedad || 'Propio',
      proveedor: eq.proveedor || '',
      modelo: eq.modelo || '',
      descripcion: eq.descripcion || '',
      estadoFisico: eq.estadoFisico || 'Bueno',
      disponibilidad: eq.disponibilidad || 'Disponible',
      ciudad: eq.ciudad || 'Bogotá',
      asignadoA: eq.asignadoA || eq.asignado_a || '',
      identificacionUsuario: eq.identificacionUsuario || eq.identificacion_usuario || '',
      usuarioRegistro: eq.usuarioRegistro || eq.registradoPor || ''
    });
    setError('');
    setMensaje('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelarEdicion = () => {
    setEquipoEditando(null);
    setFormData(initialFormState);
    setError('');
    setMensaje('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMensaje('');

    try {
      const url = equipoEditando 
        ? `${API_URL}/api/equipos/${equipoEditando}` 
        : `${API_URL}/api/equipos`;
      const method = equipoEditando ? 'PUT' : 'POST';

      const asignadoVal = formData.disponibilidad === 'Asignado' ? formData.asignadoA : '';
      const idVal = formData.disponibilidad === 'Asignado' ? formData.identificacionUsuario : '';
      const fechaActual = new Date().toISOString();

      const datosAEnviar = {
        ...formData,
        asignadoA: asignadoVal,
        identificacionUsuario: idVal,
        asignado_a: asignadoVal,
        identificacion_usuario: idVal,
        registradoPor: formData.usuarioRegistro,
        emailUsuario,
        uidUsuario,
        ...(equipoEditando ? { fechaActualizacion: fechaActual } : { fechaRegistro: fechaActual })
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosAEnviar)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error al guardar el equipo');

      setMensaje(equipoEditando ? '¡Equipo actualizado exitosamente!' : '¡Equipo registrado exitosamente!');
      cancelarEdicion();
      cargarEquipos();
    } catch (err) {
      setError(err.message);
    }
  };

  const eliminarEquipo = async (id) => {
    if (!esAdmin) {
      alert('Acceso denegado: Solo los administradores pueden eliminar registros.');
      return;
    }

    if (!window.confirm('¿Estás seguro de eliminar este equipo del inventario?')) return;

    try {
      const response = await fetch(`${API_URL}/api/equipos/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        cargarEquipos();
      }
    } catch (err) {
      alert('Error al eliminar el equipo');
    }
  };

  const equiposFiltrados = useMemo(() => {
    return equipos.filter(eq => {
      const asignadoTexto = eq.asignadoA || eq.asignado_a || '';
      const idTexto = eq.identificacionUsuario || eq.identificacion_usuario || '';
      const responsableTexto = eq.usuarioRegistro || eq.registradoPor || '';
      const query = busqueda.toLowerCase();

      const cumpleBusqueda = 
        (eq.serial && eq.serial.toLowerCase().includes(query)) ||
        (eq.modelo && eq.modelo.toLowerCase().includes(query)) ||
        (asignadoTexto.toLowerCase().includes(query)) ||
        (idTexto.toLowerCase().includes(query)) ||
        (responsableTexto.toLowerCase().includes(query));

      if (filtroTipo === 'Todos') return cumpleBusqueda;
      if (filtroTipo === 'Propios') return cumpleBusqueda && eq.tipoPropiedad === 'Propio';
      if (filtroTipo === 'Proveedores') return cumpleBusqueda && eq.tipoPropiedad === 'Proveedor';
      return cumpleBusqueda;
    });
  }, [equipos, busqueda, filtroTipo]);

  const exportarAExcel = () => {
    if (equiposFiltrados.length === 0) {
      alert('No hay datos disponibles para exportar.');
      return;
    }

    const datosExcel = equiposFiltrados.map(eq => ({
      'Serial': eq.serial || 'N/A',
      'Modelo / Equipo': eq.modelo || 'N/A',
      'Tipo Propiedad': eq.tipoPropiedad || 'Propio',
      'Proveedor': eq.proveedor || 'N/A',
      'Ciudad': eq.ciudad || 'Bogotá',
      'Estado Físico': eq.estadoFisico || 'Bueno',
      'Disponibilidad': eq.disponibilidad || 'Disponible',
      'Asignado A': eq.asignadoA || eq.asignado_a || 'N/A',
      'Identificación': eq.identificacionUsuario || eq.identificacion_usuario || 'N/A',
      'Responsable': eq.usuarioRegistro || eq.registradoPor || 'N/A',
      'Fecha Registro': eq.fechaRegistro ? new Date(eq.fechaRegistro).toLocaleString() : 'N/A',
      'Última Actualización': eq.fechaActualizacion ? new Date(eq.fechaActualizacion).toLocaleString() : 'N/A',
      'Descripción / Observaciones': eq.descripcion || ''
    }));

    const hoja = XLSX.utils.json_to_sheet(datosExcel);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Inventario');

    XLSX.writeFile(libro, 'Inventario_Equipos.xlsx');
  };

  const totalEquipos = equipos.length;
  const totalPropios = equipos.filter(eq => eq.tipoPropiedad === 'Propio').length;
  const totalProveedores = equipos.filter(eq => eq.tipoPropiedad === 'Proveedor').length;

  const getBadgeEstado = (estado) => {
    switch (estado) {
      case 'Bueno': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'Con falla': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'Dañado': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 md:p-10">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-cyan-400">Gestión de Equipos</h1>
          <p className="text-slate-400 text-sm">Control de seriales, activos propios, proveedores, disponibilidad y ciudad.</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={exportarAExcel}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500/40 rounded-xl text-sm font-semibold transition-all shadow-lg flex items-center gap-2"
          >
            📊 Exportar Excel
          </button>

          <button 
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sm font-semibold transition-colors"
          >
            ← Volver
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 shadow-lg flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Total Registrados</p>
              <h3 className="text-3xl font-extrabold text-cyan-400 mt-1">{totalEquipos}</h3>
            </div>
            <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/30 rounded-xl flex items-center justify-center text-cyan-400 text-xl font-bold">
              💻
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 shadow-lg flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Activos Propios</p>
              <h3 className="text-3xl font-extrabold text-emerald-400 mt-1">{totalPropios}</h3>
            </div>
            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center text-emerald-400 text-xl font-bold">
              🏢
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 shadow-lg flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">De Proveedores</p>
              <h3 className="text-3xl font-extrabold text-amber-400 mt-1">{totalProveedores}</h3>
            </div>
            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-center text-amber-400 text-xl font-bold">
              🤝
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 h-fit shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-xl font-bold ${equipoEditando ? 'text-amber-400' : 'text-emerald-400'}`}>
                {equipoEditando ? 'Editando Activo' : 'Registrar Nuevo Activo'}
              </h2>
              {equipoEditando && (
                <button 
                  type="button" 
                  onClick={cancelarEdicion}
                  className="text-xs text-slate-400 hover:text-white underline"
                >
                  Cancelar
                </button>
              )}
            </div>

            {error && <div className="mb-4 p-3 bg-red-500/20 border border-red-500 text-red-300 rounded-lg text-xs">{error}</div>}
            {mensaje && <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500 text-emerald-300 rounded-lg text-xs">{mensaje}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-cyan-300 uppercase mb-1">Responsable</label>
                <select
                  name="usuarioRegistro"
                  required
                  value={formData.usuarioRegistro}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-900 border border-cyan-500/50 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400"
                >
                  <option value="" disabled>-- Seleccione un responsable --</option>
                  <option value="JUAN CASTRO">JUAN DAVID CASTRO</option>
                  <option value="ANDRES CASTRO">ANDRES FELIPE CASTRO</option>
                  <option value="ESTEFANIA ROCHA">ESTEFANIA GALARZA ROCHA</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Número de Serial</label>
                <input
                  type="text"
                  name="serial"
                  required
                  value={formData.serial}
                  onChange={handleChange}
                  placeholder="Ej. SN-987654321"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Tipo de Propiedad</label>
                <select
                  name="tipoPropiedad"
                  value={formData.tipoPropiedad}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
                >
                  <option value="Propio">Propio</option>
                  <option value="Proveedor">Proveedor</option>
                </select>
              </div>

              {formData.tipoPropiedad === 'Proveedor' && (
                <div>
                  <label className="block text-xs font-semibold text-amber-300 uppercase mb-1">Nombre del Proveedor</label>
                  <input
                    type="text"
                    name="proveedor"
                    required
                    value={formData.proveedor}
                    onChange={handleChange}
                    placeholder="Ej. TecnoSuministros S.A."
                    className="w-full px-3 py-2 bg-slate-900 border border-amber-500/50 rounded-lg text-white text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Modelo / Equipo</label>
                <input
                  type="text"
                  name="modelo"
                  required
                  value={formData.modelo}
                  onChange={handleChange}
                  placeholder="Ej. Laptop Dell Latitude 5420"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-300 uppercase mb-1">Ciudad</label>
                <select
                  name="ciudad"
                  value={formData.ciudad}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-900 border border-emerald-500/50 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-400"
                >
                  <option value="Bogotá">Bogotá</option>
                  <option value="Medellín">Medellín</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-cyan-300 uppercase mb-1">Estado Físico</label>
                <select
                  name="estadoFisico"
                  value={formData.estadoFisico}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-900 border border-cyan-500/50 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400"
                >
                  <option value="Bueno">Bueno</option>
                  <option value="Con falla">Con falla</option>
                  <option value="Dañado">Dañado</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-blue-300 uppercase mb-1">Disponibilidad</label>
                <select
                  name="disponibilidad"
                  value={formData.disponibilidad}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-900 border border-blue-500/50 rounded-lg text-white text-sm focus:outline-none focus:border-blue-400"
                >
                  <option value="Disponible">Disponible</option>
                  <option value="Asignado">Asignado</option>
                </select>
              </div>

              {formData.disponibilidad === 'Asignado' && (
                <div className="space-y-3 p-3.5 bg-slate-900/60 border border-blue-500/40 rounded-xl">
                  <div>
                    <label className="block text-xs font-semibold text-blue-300 uppercase mb-1">Nombre de a quién se asignó</label>
                    <input
                      type="text"
                      name="asignadoA"
                      required={formData.disponibilidad === 'Asignado'}
                      value={formData.asignadoA}
                      onChange={handleChange}
                      placeholder="Ej. Juan Pérez"
                      className="w-full px-3 py-2 bg-slate-900 border border-blue-500/50 rounded-lg text-white text-sm focus:outline-none focus:border-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-blue-300 uppercase mb-1">Identificación</label>
                    <input
                      type="text"
                      name="identificacionUsuario"
                      required={formData.disponibilidad === 'Asignado'}
                      value={formData.identificacionUsuario}
                      onChange={handleChange}
                      placeholder="Ej. 1023456789"
                      className="w-full px-3 py-2 bg-slate-900 border border-blue-500/50 rounded-lg text-white text-sm focus:outline-none focus:border-blue-400"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Descripción / Observaciones</label>
                <textarea
                  name="descripcion"
                  rows={2}
                  value={formData.descripcion}
                  onChange={handleChange}
                  placeholder="Estado físico, accesorios..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
                ></textarea>
              </div>

              <button
                type="submit"
                className={`w-full py-3 text-white font-bold rounded-lg shadow-lg transition-all text-sm ${
                  equipoEditando 
                    ? 'bg-amber-600 hover:bg-amber-500' 
                    : 'bg-cyan-600 hover:bg-cyan-500'
                }`}
              >
                {equipoEditando ? 'Actualizar Activo' : 'Guardar Activo'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-slate-800/80 border border-slate-700 rounded-2xl p-6 shadow-xl flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
              <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-700 w-full md:w-auto">
                {['Todos', 'Propios', 'Proveedores'].map((tipo) => (
                  <button
                    key={tipo}
                    onClick={() => setFiltroTipo(tipo)}
                    className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      filtroTipo === tipo 
                        ? 'bg-cyan-600 text-white shadow' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tipo}
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder="🔍 Buscar por serial, modelo, responsable o ID..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500 w-full md:w-72"
              />
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase">
                    <th className="py-3 px-3">Serial</th>
                    <th className="py-3 px-3">Modelo</th>
                    <th className="py-3 px-3">Fechas</th>
                    <th className="py-3 px-3">Propiedad</th>
                    <th className="py-3 px-3">Ciudad</th>
                    <th className="py-3 px-3">Estado</th>
                    <th className="py-3 px-3">Disponibilidad / Asignado</th>
                    <th className="py-3 px-3">Responsable</th>
                    <th className="py-3 px-3">Descripción</th>
                    <th className="py-3 px-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50 text-xs">
                  {equiposFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-8 text-slate-500">No se encontraron equipos registrados.</td>
                    </tr>
                  ) : (
                    equiposFiltrados.map((eq) => {
                      const nombreAsignado = eq.asignadoA || eq.asignado_a;
                      const idAsignado = eq.identificacionUsuario || eq.identificacion_usuario;
                      const responsable = eq.usuarioRegistro || eq.registradoPor || 'N/A';

                      return (
                        <tr key={eq.id} className="hover:bg-slate-700/30 transition-colors">
                          <td className="py-3 px-3 font-bold text-white font-mono whitespace-nowrap">
                            {eq.serial}
                          </td>
                          <td className="py-3 px-3 text-slate-300">
                            {eq.modelo}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="space-y-0.5">
                              <div className="text-[10px] text-slate-400">
                                📅 <span className="text-slate-300">Reg:</span> {eq.fechaRegistro ? new Date(eq.fechaRegistro).toLocaleString() : 'N/A'}
                              </div>
                              {eq.fechaActualizacion && (
                                <div className="text-[10px] text-amber-400/90">
                                  ✏️ <span className="text-amber-300">Act:</span> {new Date(eq.fechaActualizacion).toLocaleString()}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-full font-semibold border ${
                              eq.tipoPropiedad === 'Propio' 
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            }`}>
                              {eq.tipoPropiedad} {eq.tipoPropiedad === 'Proveedor' && eq.proveedor ? `(${eq.proveedor})` : ''}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 bg-slate-700/50 text-slate-200 border border-slate-600 rounded font-medium">
                              {eq.ciudad || 'Bogotá'}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded font-medium border ${getBadgeEstado(eq.estadoFisico)}`}>
                              {eq.estadoFisico || 'Bueno'}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded font-medium border inline-block mb-1 ${
                              eq.disponibilidad === 'Asignado'
                                ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                            }`}>
                              {eq.disponibilidad || 'Disponible'}
                            </span>
                            {eq.disponibilidad === 'Asignado' && (
                              <div className="text-[11px] text-slate-300 mt-0.5 space-y-0.5">
                                <div>👤 <span className="font-semibold text-white">{nombreAsignado || 'N/A'}</span></div>
                                <div>🆔 <span className="font-mono text-slate-400">{idAsignado || 'N/A'}</span></div>
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-cyan-300 font-medium">
                            {responsable}
                          </td>
                          <td className="py-3 px-3 text-slate-300 max-w-xs truncate" title={eq.descripcion}>
                            {eq.descripcion || <span className="text-slate-500 italic">Sin descripción</span>}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="flex justify-center gap-1.5">
                              <button
                                onClick={() => iniciarEdicion(eq)}
                                className="px-2.5 py-1 bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-500/40 rounded-lg text-xs transition-all"
                                title="Editar registro"
                              >
                                Editar
                              </button>

                              {esAdmin ? (
                                <button
                                  onClick={() => eliminarEquipo(eq.id)}
                                  className="px-2.5 py-1 bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/40 rounded-lg text-xs transition-all"
                                  title="Eliminar registro"
                                >
                                  Eliminar
                                </button>
                              ) : (
                                <span className="text-xs text-slate-500 italic">Restringido</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}