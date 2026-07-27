import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();

  // Función auxiliar para resolver correctamente la URL de la foto (local, base64 o relativa del backend)
  const obtenerFotoUrl = (foto) => {
    if (!foto) return '';
    if (foto.startsWith('http://') || foto.startsWith('https://') || foto.startsWith('data:')) {
      return foto;
    }
    // Si la ruta es relativa del backend (ej: /uploads/... o uploads/...)
    const rutaLimpiada = foto.startsWith('/') ? foto : `/${foto}`;
    return `http://localhost:4000${rutaLimpiada}`;
  };

  // Obtener la sesión activa desde localStorage
  const miEmail = localStorage.getItem('usuarioEmail');
  const [miNombre, setMiNombre] = useState(localStorage.getItem('usuarioNombre') || 'Usuario');
  const [miCargo, setMiCargo] = useState(localStorage.getItem('usuarioCargo') || '');
  const [miFoto, setMiFoto] = useState(obtenerFotoUrl(localStorage.getItem('usuarioFoto') || ''));

  // Estados de la aplicación
  const [equipos, setEquipos] = useState([]);
  const [actas, setActas] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Estado para el Modal de Editar Perfil
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [formPerfil, setFormPerfil] = useState({
    nombre: miNombre,
    cargo: miCargo,
    foto: localStorage.getItem('usuarioFoto') || '' // Guardamos la ruta original para el formulario
  });
  const [archivoFoto, setArchivoFoto] = useState(null); // Archivo real para FormData
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);

  // Validar sesión al montar el componente
  useEffect(() => {
    if (!miEmail) {
      navigate('/');
      return;
    }
    cargarDatosAPI();
    sincronizarPerfilDesdeBackend();
  }, [miEmail, navigate]);

  const cargarDatosAPI = async () => {
    setCargando(true);
    try {
      const [resEquipos, resActas] = await Promise.all([
        fetch('http://localhost:4000/api/equipos').catch(() => null),
        fetch('http://localhost:4000/api/actas').catch(() => null)
      ]);

      if (resEquipos && resEquipos.ok) {
        setEquipos(await resEquipos.json());
      }
      if (resActas && resActas.ok) {
        setActas(await resActas.json());
      }
    } catch (err) {
      console.error('Error cargando métricas:', err);
    } finally {
      setCargando(false);
    }
  };

  const sincronizarPerfilDesdeBackend = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/usuarios');
      if (res.ok) {
        const usuarios = await res.json();
        const miUsuarioEnBD = usuarios.find(u => u.email?.toLowerCase() === miEmail?.toLowerCase());
        
        if (miUsuarioEnBD) {
          if (miUsuarioEnBD.nombre) {
            setMiNombre(miUsuarioEnBD.nombre);
            localStorage.setItem('usuarioNombre', miUsuarioEnBD.nombre);
          }
          if (miUsuarioEnBD.cargo) {
            setMiCargo(miUsuarioEnBD.cargo);
            localStorage.setItem('usuarioCargo', miUsuarioEnBD.cargo);
          }
          if (miUsuarioEnBD.foto) {
            localStorage.setItem('usuarioFoto', miUsuarioEnBD.foto);
            setMiFoto(obtenerFotoUrl(miUsuarioEnBD.foto));
          }
        }
      }
    } catch (err) {
      console.log('Usando datos locales de sesión (Backend offline)');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('usuarioEmail');
    localStorage.removeItem('usuarioNombre');
    localStorage.removeItem('usuarioCargo');
    localStorage.removeItem('usuarioFoto');
    navigate('/');
  };

  // ⚡ SELECCIÓN DE FOTO (Guarda el archivo y muestra vista previa inmediata)
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setArchivoFoto(file); // Guardamos el archivo para enviarlo por FormData

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormPerfil(prev => ({ ...prev, foto: event.target.result }));
    };
    reader.readAsDataURL(file);
  };

  // ⚡ Actualización real enviando FormData al Backend (CORREGIDO)
  const handleGuardarPerfil = async (e) => {
    e.preventDefault();
    setGuardandoPerfil(true);

    try {
      const formData = new FormData();
      formData.append('email', miEmail); // Añadido explícitamente para el backend
      formData.append('nombre', formPerfil.nombre);
      formData.append('cargo', formPerfil.cargo);
      
      // Si seleccionó un archivo de su PC, lo adjuntamos para Multer
      if (archivoFoto) {
        formData.append('foto', archivoFoto);
      } else {
        // Si es una URL de texto o mantiene la actual
        formData.append('foto', formPerfil.foto);
      }

      // Apuntamos a la ruta general /api/usuarios/actualizar para evitar fallos de parámetros con el email en la URL
      const response = await fetch(`http://localhost:4000/api/usuarios/actualizar`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || data.mensaje || `Error del servidor: ${response.status}`);
      }

      // La URL de la foto que devuelve el servidor (o mantenemos la actual del form)
      const fotoFinal = data.foto || formPerfil.foto;

      // Actualizar localStorage
      localStorage.setItem('usuarioNombre', formPerfil.nombre);
      localStorage.setItem('usuarioCargo', formPerfil.cargo);
      localStorage.setItem('usuarioFoto', fotoFinal);

      // Actualizar estados locales
      setMiNombre(formPerfil.nombre);
      setMiCargo(formPerfil.cargo);
      setMiFoto(obtenerFotoUrl(fotoFinal));

      setIsProfileOpen(false);
      setArchivoFoto(null);
      
      // Recarga rápida para refrescar toda la interfaz visualmente
      window.location.reload();

    } catch (err) {
      console.error('Error al actualizar perfil:', err);
      alert(`No se pudo guardar: ${err.message}`);
    } finally {
      setGuardandoPerfil(false);
    }
  };

  // --- CÁLCULO DE MÉTRICAS ---
  const totalActas = actas.length;
  const totalEquipos = equipos.length;

  const asignados = equipos.filter(e => e.disponibilidad === 'Asignado').length;
  const sinAsignar = equipos.filter(e => e.disponibilidad === 'Disponible' || !e.disponibilidad).length;

  const propios = equipos.filter(e => e.tipoPropiedad === 'Propio').length;
  const proveedores = equipos.filter(e => e.tipoPropiedad === 'Proveedor').length;

  const pctAsignados = totalEquipos > 0 ? Math.round((asignados / totalEquipos) * 100) : 0;
  const pctSinAsignar = totalEquipos > 0 ? Math.round((sinAsignar / totalEquipos) * 100) : 0;
  const pctPropios = totalEquipos > 0 ? Math.round((propios / totalEquipos) * 100) : 0;
  const pctProveedores = totalEquipos > 0 ? Math.round((proveedores / totalEquipos) * 100) : 0;

  const obtenerTopUsuario = (lista, camposPosibles) => {
    if (!lista || lista.length === 0) return { usuario: 'Sin registros', cantidad: 0 };
    const conteo = {};
    
    lista.forEach(item => {
      let usr = null;
      const campos = Array.isArray(camposPosibles) ? camposPosibles : [camposPosibles];
      
      for (const campo of campos) {
        if (item[campo] && item[campo] !== 'Usuario Actual' && item[campo] !== 'Sistema') {
          usr = item[campo];
          break;
        }
      }
      
      if (!usr) {
        const alternativos = ['nombreResponsable', 'responsableAutenticado', 'usuario', 'creadoPor', 'registradoPor', 'autor', 'user'];
        for (const campo of alternativos) {
          if (item[campo] && item[campo] !== 'Usuario Actual' && item[campo] !== 'Sistema') {
            usr = item[campo];
            break;
          }
        }
      }
      
      const usuarioFinal = usr && usr !== 'Sistema' ? usr : 'Sin registrar';
      conteo[usuarioFinal] = (conteo[usuarioFinal] || 0) + 1;
    });

    let topUser = 'N/A';
    let max = 0;
    Object.entries(conteo).forEach(([usr, cant]) => {
      if (cant > max && usr !== 'Sin registrar') {
        max = cant;
        topUser = usr;
      }
    });

    return { usuario: topUser, cantidad: max };
  };

  const topActas = obtenerTopUsuario(actas, ['nombreResponsable', 'responsable', 'responsableAutenticado', 'usuarioGenerador', 'usuario', 'creadoPor', 'autor']);
  const topEquipos = obtenerTopUsuario(equipos, ['usuarioRegistro', 'usuario', 'registradoPor']);

  const CIRCUNFERENCIA = 2 * Math.PI * 38;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 md:p-10 font-sans">
      
      {/* ----------------- CABECERA ----------------- */}
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-slate-900/60 p-6 rounded-3xl border border-slate-800/80 backdrop-blur-md">
        
        {/* Perfil e Identificación con Avatar Grande */}
        <div className="flex items-center gap-5">
          <div 
            onClick={() => {
              setFormPerfil({ nombre: miNombre, cargo: miCargo, foto: localStorage.getItem('usuarioFoto') || '' });
              setArchivoFoto(null);
              setIsProfileOpen(true);
            }} 
            className="relative group cursor-pointer flex-shrink-0"
            title="Editar Perfil y Foto"
          >
            {miFoto ? (
              <img 
                src={miFoto} 
                alt="Perfil" 
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-cyan-500/50 shadow-xl group-hover:scale-105 group-hover:border-cyan-400 transition-all" 
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-cyan-500/10 border-2 border-cyan-500/30 flex items-center justify-center text-cyan-300 font-black text-3xl shadow-xl group-hover:scale-105 group-hover:border-cyan-400 transition-all">
                {miNombre ? miNombre.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <div className="absolute inset-0 bg-slate-950/70 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-xs text-cyan-300 font-bold gap-1">
              <span>✏️</span>
              <span>Editar</span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
              <span className="text-xs font-semibold text-cyan-400 tracking-wider uppercase">Plataforma Operativa IT</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
              ¡Bienvenido, {miNombre}!
            </h1>
            <div className="mt-2">
              <span className="text-xs font-semibold px-3 py-1 bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 rounded-full">
                {miCargo || 'Sin cargo asignado'}
              </span>
            </div>
          </div>
        </div>

        {/* Botones de Acción Global */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button 
            onClick={() => {
              setFormPerfil({ nombre: miNombre, cargo: miCargo, foto: localStorage.getItem('usuarioFoto') || '' });
              setArchivoFoto(null);
              setIsProfileOpen(true);
            }}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 rounded-2xl text-xs font-bold text-slate-200 transition-all flex items-center gap-2 shadow-lg"
          >
            ⚙️ Mi Perfil
          </button>

          <button 
            onClick={cargarDatosAPI}
            disabled={cargando}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 rounded-2xl text-xs font-bold text-cyan-300 transition-all flex items-center gap-2 shadow-lg"
          >
            <span className={cargando ? 'animate-spin' : ''}>🔄</span>
            {cargando ? 'Sincronizando...' : 'Actualizar'}
          </button>

          <button 
            onClick={handleLogout}
            className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 active:scale-95 border border-rose-500/30 rounded-2xl text-xs font-bold text-rose-300 transition-all flex items-center gap-2 shadow-lg"
          >
            🚪 Salir
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-10">

        {/* ----------------- 1. MÓDULOS DE NAVEGACIÓN ----------------- */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <span>⚡</span> Módulos del Sistema
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div 
              onClick={() => navigate('/equipos')}
              className="group bg-gradient-to-b from-slate-900 to-slate-900/90 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-500/5 relative overflow-hidden"
            >
              <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl flex items-center justify-center text-cyan-400 text-2xl mb-3 group-hover:scale-110 transition-transform">
                💻
              </div>
              <h3 className="font-bold text-white text-base group-hover:text-cyan-300 transition-colors">Gestión de Equipos</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">Inventario, seriales y disponibilidad.</p>
              <div className="mt-4 flex items-center text-[11px] font-semibold text-cyan-400 opacity-80 group-hover:opacity-100">
                <span>Acceder</span>
                <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>

            <div 
              onClick={() => navigate('/actas')}
              className="group bg-gradient-to-b from-slate-900 to-slate-900/90 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/5 relative overflow-hidden"
            >
              <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 text-2xl mb-3 group-hover:scale-110 transition-transform">
                📄
              </div>
              <h3 className="font-bold text-white text-base group-hover:text-emerald-300 transition-colors">Generación de Actas</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">Crear PDF de entrega y devolución.</p>
              <div className="mt-4 flex items-center text-[11px] font-semibold text-emerald-400 opacity-80 group-hover:opacity-100">
                <span>Acceder</span>
                <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>

            <div 
              onClick={() => navigate('/auditoria')}
              className="group bg-gradient-to-b from-slate-900 to-slate-900/90 border border-slate-800 hover:border-purple-500/50 rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/5 relative overflow-hidden"
            >
              <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-center text-purple-400 text-2xl mb-3 group-hover:scale-110 transition-transform">
                📜
              </div>
              <h3 className="font-bold text-white text-base group-hover:text-purple-300 transition-colors">Historial / Auditoría</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">Trazabilidad de cambios y logs.</p>
              <div className="mt-4 flex items-center text-[11px] font-semibold text-purple-400 opacity-80 group-hover:opacity-100">
                <span>Acceder</span>
                <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>

            <div 
              onClick={() => navigate('/chat')}
              className="group bg-gradient-to-b from-slate-900 to-slate-900/90 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/5 relative overflow-hidden"
            >
              <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center text-amber-400 text-2xl mb-3 group-hover:scale-110 transition-transform">
                💬
              </div>
              <h3 className="font-bold text-white text-base group-hover:text-amber-300 transition-colors">Canal de Chat</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">Comunicación interna y adjuntos.</p>
              <div className="mt-4 flex items-center text-[11px] font-semibold text-amber-400 opacity-80 group-hover:opacity-100">
                <span>Acceder</span>
                <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          </div>
        </section>

        {/* ----------------- 2. ANALÍTICA Y MÉTRICAS ----------------- */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-slate-800/80 pb-4 gap-2">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                📊 Métricas y Analítica Operativa
              </h2>
              <p className="text-xs text-slate-400">Indicadores en tiempo real sobre el stock y rendimiento del equipo.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="flex justify-between items-start">
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Actas Registradas</span>
                <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl text-lg">📄</span>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-black text-white">{totalActas}</span>
                <span className="text-xs text-emerald-400 font-semibold ml-2">documentos</span>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="flex justify-between items-start">
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Total Equipos</span>
                <span className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl text-lg">💻</span>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-black text-white">{totalEquipos}</span>
                <span className="text-xs text-cyan-400 font-semibold ml-2">activos</span>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="flex justify-between items-start">
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Líder en Actas</span>
                <span className="p-2 bg-amber-500/10 text-amber-400 rounded-xl text-lg">🏆</span>
              </div>
              <div className="mt-2">
                <h4 className="text-lg font-bold text-amber-300 truncate">{topActas.usuario}</h4>
                <p className="text-xs text-slate-400">{topActas.cantidad} actas creadas</p>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="flex justify-between items-start">
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Líder en Inventario</span>
                <span className="p-2 bg-purple-500/10 text-purple-400 rounded-xl text-lg">⚡</span>
              </div>
              <div className="mt-2">
                <h4 className="text-lg font-bold text-purple-300 truncate">{topEquipos.usuario}</h4>
                <p className="text-xs text-slate-400">{topEquipos.cantidad} equipos ingresados</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* GRÁFICO 1 */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-bold text-white text-base">📌 Disponibilidad de Equipos</h3>
                  <p className="text-xs text-slate-400">Estado operativo del stock</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                <div className="relative flex items-center justify-center">
                  <svg className="w-44 h-44 transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="38" stroke="#1e293b" strokeWidth="10" fill="transparent" />
                    <circle cx="50" cy="50" r="38" stroke="#3b82f6" strokeWidth="10" fill="transparent" strokeDasharray={CIRCUNFERENCIA} strokeDashoffset={CIRCUNFERENCIA - (CIRCUNFERENCIA * pctAsignados) / 100} strokeLinecap="round" />
                    <circle cx="50" cy="50" r="38" stroke="#10b981" strokeWidth="10" fill="transparent" strokeDasharray={CIRCUNFERENCIA} strokeDashoffset={CIRCUNFERENCIA - (CIRCUNFERENCIA * pctSinAsignar) / 100} strokeLinecap="round" style={{ transformOrigin: 'center', transform: `rotate(${(pctAsignados * 360) / 100}deg)` }} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-black text-white">{pctAsignados}%</span>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400">Asignados</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-3 bg-slate-950/60 rounded-2xl border border-blue-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-xs text-slate-300 font-semibold">Asignados</span>
                    </div>
                    <span className="text-sm font-bold text-blue-400">{asignados}</span>
                  </div>

                  <div className="p-3 bg-slate-950/60 rounded-2xl border border-emerald-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                      <span className="text-xs text-slate-300 font-semibold">Disponibles</span>
                    </div>
                    <span className="text-sm font-bold text-emerald-400">{sinAsignar}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* GRÁFICO 2 */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-bold text-white text-base">🏢 Tipo de Propiedad</h3>
                  <p className="text-xs text-slate-400">Origen de los equipos</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                <div className="relative flex items-center justify-center">
                  <svg className="w-44 h-44 transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="38" stroke="#1e293b" strokeWidth="10" fill="transparent" />
                    <circle cx="50" cy="50" r="38" stroke="#06b6d4" strokeWidth="10" fill="transparent" strokeDasharray={CIRCUNFERENCIA} strokeDashoffset={CIRCUNFERENCIA - (CIRCUNFERENCIA * pctPropios) / 100} strokeLinecap="round" />
                    <circle cx="50" cy="50" r="38" stroke="#f59e0b" strokeWidth="10" fill="transparent" strokeDasharray={CIRCUNFERENCIA} strokeDashoffset={CIRCUNFERENCIA - (CIRCUNFERENCIA * pctProveedores) / 100} strokeLinecap="round" style={{ transformOrigin: 'center', transform: `rotate(${(pctPropios * 360) / 100}deg)` }} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-black text-white">{pctPropios}%</span>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400">Propios</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-3 bg-slate-950/60 rounded-2xl border border-cyan-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
                      <span className="text-xs text-slate-300 font-semibold">Propios</span>
                    </div>
                    <span className="text-sm font-bold text-cyan-300">{propios}</span>
                  </div>

                  <div className="p-3 bg-slate-950/60 rounded-2xl border border-amber-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 bg-amber-400 rounded-full"></div>
                      <span className="text-xs text-slate-300 font-semibold">Proveedor</span>
                    </div>
                    <span className="text-sm font-bold text-amber-300">{proveedores}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ----------------- MODAL EDITAR PERFIL ----------------- */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>👤</span> Editar Perfil y Foto
              </h3>
              <button 
                onClick={() => setIsProfileOpen(false)}
                className="text-slate-400 hover:text-white text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardarPerfil} className="space-y-5">
              
              {/* Vista Previa del Avatar Grande en el Modal */}
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="w-28 h-28 rounded-3xl overflow-hidden border-2 border-cyan-500/40 shadow-xl bg-slate-950 flex items-center justify-center relative group">
                  {formPerfil.foto ? (
                    <img 
                      src={obtenerFotoUrl(formPerfil.foto)} 
                      alt="Vista previa" 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <span className="text-cyan-400 font-black text-4xl">
                      {formPerfil.nombre ? formPerfil.nombre.charAt(0).toUpperCase() : 'U'}
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-400">Vista previa de tu avatar corporativo</span>
              </div>

              {/* Subir foto desde la PC */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                  Subir Imagen desde tu PC
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-cyan-500/10 file:text-cyan-300 hover:file:bg-cyan-500/20 file:cursor-pointer bg-slate-950 border border-slate-800 rounded-xl"
                />
              </div>

              {/* URL Web de la Foto */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                  O pegar enlace URL de la foto
                </label>
                <input
                  type="url"
                  value={formPerfil.foto.startsWith('data:') || formPerfil.foto.startsWith('http://localhost') ? '' : formPerfil.foto}
                  onChange={(e) => {
                    setArchivoFoto(null); // Limpiamos archivo si escribe URL manual
                    setFormPerfil({ ...formPerfil, foto: e.target.value });
                  }}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-colors text-sm"
                  placeholder="https://ejemplo.com/tu-foto.jpg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  value={formPerfil.nombre}
                  onChange={(e) => setFormPerfil({ ...formPerfil, nombre: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-colors text-sm"
                  placeholder="Tu nombre completo"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                  Cargo de Asociado
                </label>
                <input
                  type="text"
                  required
                  value={formPerfil.cargo}
                  onChange={(e) => setFormPerfil({ ...formPerfil, cargo: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-colors text-sm"
                  placeholder="Ej. Técnico de Soporte IT"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoPerfil}
                  className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2"
                >
                  {guardandoPerfil ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}