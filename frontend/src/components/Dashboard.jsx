import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../auth/firebase.config';

export default function Dashboard() {
  const navigate = useNavigate();

  // Estados
  const [equipos, setEquipos] = useState([]);
  const [actas, setActas] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [resEquipos, resActas] = await Promise.all([
        fetch('http://localhost:4000/api/equipos').catch(() => null),
        fetch('http://localhost:4000/api/actas').catch(() => null)
      ]);

      if (resEquipos && resEquipos.ok) {
        const dataEquipos = await resEquipos.json();
        console.log("📦 Equipos recibidos de la API:", dataEquipos);
        setEquipos(dataEquipos);
      }
      if (resActas && resActas.ok) {
        const dataActas = await resActas.json();
        console.log("📄 Actas recibidas de la API:", dataActas);
        setActas(dataActas);
      }
    } catch (err) {
      console.error('Error cargando métricas:', err);
    } finally {
      setCargando(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    }
  };

  // --- CÁLCULO DE MÉTRICAS ---
  const totalActas = actas.length;
  const totalEquipos = equipos.length;

  const asignados = equipos.filter(e => e.disponibilidad === 'Asignado').length;
  const sinAsignar = equipos.filter(e => e.disponibilidad === 'Disponible' || !e.disponibilidad).length;
  const mantenimiento = equipos.filter(e => e.disponibilidad === 'Mantenimiento').length;

  const propios = equipos.filter(e => e.tipoPropiedad === 'Propio').length;
  const proveedores = equipos.filter(e => e.tipoPropiedad === 'Proveedor').length;

  // Porcentajes
  const pctAsignados = totalEquipos > 0 ? Math.round((asignados / totalEquipos) * 100) : 0;
  const pctSinAsignar = totalEquipos > 0 ? Math.round((sinAsignar / totalEquipos) * 100) : 0;
  const pctMantenimiento = totalEquipos > 0 ? Math.round((mantenimiento / totalEquipos) * 100) : 0;

  const pctPropios = totalEquipos > 0 ? Math.round((propios / totalEquipos) * 100) : 0;
  const pctProveedores = totalEquipos > 0 ? Math.round((proveedores / totalEquipos) * 100) : 0;

  // --- OPCIÓN A: Top Usuarios Robustos ---
  const obtenerTopUsuario = (lista, camposPosibles) => {
    if (!lista || lista.length === 0) return { usuario: 'Sin registros', cantidad: 0 };
    const conteo = {};
    
    lista.forEach(item => {
      let usr = null;
      const campos = Array.isArray(camposPosibles) ? camposPosibles : [camposPosibles];
      
      // 1. Buscar en campos principales (excluyendo genéricos)
      for (const campo of campos) {
        if (item[campo] && item[campo] !== 'Usuario Actual' && item[campo] !== 'Sistema') {
          usr = item[campo];
          break;
        }
      }
      
      // 2. Si no se encontró, buscar en campos alternativos comunes
      if (!usr) {
        const alternativos = ['responsableAutenticado', 'usuario', 'creadoPor', 'registradoPor', 'autor', 'user', 'usuarioGenerador', 'usuarioRegistro'];
        for (const campo of alternativos) {
          if (item[campo] && item[campo] !== 'Usuario Actual' && item[campo] !== 'Sistema') {
            usr = item[campo];
            break;
          }
        }
      }
      
      // 3. Último recurso (excluyendo 'Sistema')
      if (!usr) {
        for (const campo of campos) {
          if (item[campo] && item[campo] !== 'Sistema') {
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

    if (max === 0 && conteo['Sin registrar']) {
      topUser = 'Sin registrar';
      max = conteo['Sin registrar'];
    }

    return { usuario: topUser, cantidad: max };
  };

  const topActas = obtenerTopUsuario(actas, ['responsableAutenticado', 'usuarioGenerador', 'usuario', 'creadoPor', 'autor']);
  const topEquipos = obtenerTopUsuario(equipos, ['usuarioRegistro', 'usuario', 'registradoPor']);

  // Circunferencia SVG para gráficos tipo Dona (r = 38)
  const CIRCUNFERENCIA = 2 * Math.PI * 38;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 md:p-10 font-sans">
      
      {/* ----------------- CABECERA ----------------- */}
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-slate-900/60 p-6 rounded-3xl border border-slate-800/80 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="text-xs font-semibold text-cyan-400 tracking-wider uppercase">Plataforma Operativa IT</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">Panel de Control</h1>
          <p className="text-slate-400 text-xs sm:text-sm">Gestión unificada de inventario, soporte y trazabilidad de activos.</p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button 
            onClick={cargarDatos}
            disabled={cargando}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 rounded-2xl text-xs font-bold text-cyan-300 transition-all flex items-center gap-2 shadow-lg hover:shadow-cyan-500/10"
          >
            <span className={cargando ? 'animate-spin' : ''}>🔄</span>
            {cargando ? 'Sincronizando...' : 'Actualizar Datos'}
          </button>

          <button 
            onClick={handleLogout}
            className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 active:scale-95 border border-rose-500/30 rounded-2xl text-xs font-bold text-rose-300 transition-all flex items-center gap-2 shadow-lg"
          >
            🚪 Cerrar Sesión
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
            
            {/* Tarjeta 1: Gestión de Equipos */}
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

            {/* Tarjeta 2: Generación de Actas */}
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

            {/* Tarjeta 3: Historial y Auditoría */}
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

            {/* Tarjeta 4: Canal de Chat */}
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
            <span className="text-[11px] font-mono text-slate-500 bg-slate-900 border border-slate-800 px-3 py-1 rounded-full">
              Autogestionado
            </span>
          </div>

          {/* Tarjetas KPI Superiores */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Total Actas */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden shadow-lg">
              <div className="flex justify-between items-start">
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Actas Registradas</span>
                <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl text-lg">📄</span>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-black text-white">{totalActas}</span>
                <span className="text-xs text-emerald-400 font-semibold ml-2">documentos</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>

            {/* Total Equipos */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden shadow-lg">
              <div className="flex justify-between items-start">
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Total Equipos</span>
                <span className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl text-lg">💻</span>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-black text-white">{totalEquipos}</span>
                <span className="text-xs text-cyan-400 font-semibold ml-2">activos</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-cyan-500 h-full rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>

            {/* Top Generador Actas */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden shadow-lg">
              <div className="flex justify-between items-start">
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Líder en Actas</span>
                <span className="p-2 bg-amber-500/10 text-amber-400 rounded-xl text-lg">🏆</span>
              </div>
              <div className="mt-2">
                <h4 className="text-lg font-bold text-amber-300 truncate">{topActas.usuario}</h4>
                <p className="text-xs text-slate-400">{topActas.cantidad} actas creadas</p>
              </div>
              <p className="text-[10px] text-slate-500 mt-2">Mayor emisión documental</p>
            </div>

            {/* Top Registrador Equipos */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden shadow-lg">
              <div className="flex justify-between items-start">
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Líder en Inventario</span>
                <span className="p-2 bg-purple-500/10 text-purple-400 rounded-xl text-lg">⚡</span>
              </div>
              <div className="mt-2">
                <h4 className="text-lg font-bold text-purple-300 truncate">{topEquipos.usuario}</h4>
                <p className="text-xs text-slate-400">{topEquipos.cantidad} equipos ingresados</p>
              </div>
              <p className="text-[10px] text-slate-500 mt-2">Mayor carga de activos</p>
            </div>

          </div>

          {/* Bloque de Gráficos Visuales */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* GRÁFICO 1: Asignación y Disponibilidad */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="font-bold text-white text-base">📌 Disponibilidad de Equipos</h3>
                    <p className="text-xs text-slate-400">Estado operativo del stock de hardware</p>
                  </div>
                  <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/50 px-2.5 py-1 rounded-lg">
                    {totalEquipos} Total
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                  
                  {/* Dona SVG Visual */}
                  <div className="relative flex items-center justify-center">
                    <svg className="w-44 h-44 transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        stroke="#1e293b"
                        strokeWidth="10"
                        fill="transparent"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        stroke="#3b82f6"
                        strokeWidth="10"
                        fill="transparent"
                        strokeDasharray={CIRCUNFERENCIA}
                        strokeDashoffset={CIRCUNFERENCIA - (CIRCUNFERENCIA * pctAsignados) / 100}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        stroke="#10b981"
                        strokeWidth="10"
                        fill="transparent"
                        strokeDasharray={CIRCUNFERENCIA}
                        strokeDashoffset={CIRCUNFERENCIA - (CIRCUNFERENCIA * pctSinAsignar) / 100}
                        strokeLinecap="round"
                        style={{
                          transformOrigin: 'center',
                          transform: `rotate(${(pctAsignados * 360) / 100}deg)`
                        }}
                        className="transition-all duration-1000 ease-out"
                      />
                      {mantenimiento > 0 && (
                        <circle
                          cx="50"
                          cy="50"
                          r="38"
                          stroke="#f43f5e"
                          strokeWidth="10"
                          fill="transparent"
                          strokeDasharray={CIRCUNFERENCIA}
                          strokeDashoffset={CIRCUNFERENCIA - (CIRCUNFERENCIA * pctMantenimiento) / 100}
                          strokeLinecap="round"
                          style={{
                            transformOrigin: 'center',
                            transform: `rotate(${((pctAsignados + pctSinAsignar) * 360) / 100}deg)`
                          }}
                          className="transition-all duration-1000 ease-out"
                        />
                      )}
                    </svg>
                    
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-2xl font-black text-white">{pctAsignados}%</span>
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Asignados</span>
                    </div>
                  </div>

                  {/* Leyendas y Desglose */}
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-950/60 rounded-2xl border border-blue-500/20 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-3 h-3 bg-blue-500 rounded-full shadow-sm shadow-blue-500"></div>
                        <span className="text-xs text-slate-300 font-semibold">Asignados</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-blue-400">{asignados}</span>
                        <span className="text-[10px] text-slate-500 ml-1">({pctAsignados}%)</span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-950/60 rounded-2xl border border-emerald-500/20 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-sm shadow-emerald-500"></div>
                        <span className="text-xs text-slate-300 font-semibold">Disponibles</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-emerald-400">{sinAsignar}</span>
                        <span className="text-[10px] text-slate-500 ml-1">({pctSinAsignar}%)</span>
                      </div>
                    </div>

                    {mantenimiento > 0 && (
                      <div className="p-3 bg-slate-950/60 rounded-2xl border border-rose-500/20 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-3 h-3 bg-rose-500 rounded-full shadow-sm shadow-rose-500"></div>
                          <span className="text-xs text-slate-300 font-semibold">Mantenimiento</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-rose-400">{mantenimiento}</span>
                          <span className="text-[10px] text-slate-500 ml-1">({pctMantenimiento}%)</span>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* Barra Proporcional inferior */}
              <div className="mt-6 pt-4 border-t border-slate-800">
                <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden flex p-0.5 border border-slate-800 gap-0.5">
                  <div style={{ width: `${pctAsignados}%` }} className="bg-blue-500 h-full rounded-l-full transition-all"></div>
                  <div style={{ width: `${pctSinAsignar}%` }} className="bg-emerald-500 h-full transition-all"></div>
                  {pctMantenimiento > 0 && (
                    <div style={{ width: `${pctMantenimiento}%` }} className="bg-rose-500 h-full rounded-r-full transition-all"></div>
                  )}
                </div>
              </div>
            </div>

            {/* GRÁFICO 2: Propiedad del Inventario */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="font-bold text-white text-base">🏢 Tipo de Propiedad</h3>
                    <p className="text-xs text-slate-400">Origen de los equipos registrados</p>
                  </div>
                  <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/50 px-2.5 py-1 rounded-lg">
                    {propios} Propios / {proveedores} Proveedor
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                  
                  {/* Dona SVG Visual */}
                  <div className="relative flex items-center justify-center">
                    <svg className="w-44 h-44 transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        stroke="#1e293b"
                        strokeWidth="10"
                        fill="transparent"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        stroke="#06b6d4"
                        strokeWidth="10"
                        fill="transparent"
                        strokeDasharray={CIRCUNFERENCIA}
                        strokeDashoffset={CIRCUNFERENCIA - (CIRCUNFERENCIA * pctPropios) / 100}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        stroke="#f59e0b"
                        strokeWidth="10"
                        fill="transparent"
                        strokeDasharray={CIRCUNFERENCIA}
                        strokeDashoffset={CIRCUNFERENCIA - (CIRCUNFERENCIA * pctProveedores) / 100}
                        strokeLinecap="round"
                        style={{
                          transformOrigin: 'center',
                          transform: `rotate(${(pctPropios * 360) / 100}deg)`
                        }}
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>

                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-2xl font-black text-white">{pctPropios}%</span>
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Propios</span>
                    </div>
                  </div>

                  {/* Leyendas y Desglose */}
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-950/60 rounded-2xl border border-cyan-500/20 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-3 h-3 bg-cyan-400 rounded-full shadow-sm shadow-cyan-400"></div>
                        <span className="text-xs text-slate-300 font-semibold">Equipos Propios</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-cyan-300">{propios}</span>
                        <span className="text-[10px] text-slate-500 ml-1">({pctPropios}%)</span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-950/60 rounded-2xl border border-amber-500/20 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-3 h-3 bg-amber-400 rounded-full shadow-sm shadow-amber-400"></div>
                        <span className="text-xs text-slate-300 font-semibold">De Proveedor / Renta</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-amber-300">{proveedores}</span>
                        <span className="text-[10px] text-slate-500 ml-1">({pctProveedores}%)</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Barra Proporcional inferior */}
              <div className="mt-6 pt-4 border-t border-slate-800">
                <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden flex p-0.5 border border-slate-800 gap-0.5">
                  <div style={{ width: `${pctPropios}%` }} className="bg-cyan-500 h-full rounded-l-full transition-all"></div>
                  <div style={{ width: `${pctProveedores}%` }} className="bg-amber-500 h-full rounded-r-full transition-all"></div>
                </div>
              </div>
            </div>

          </div>

        </section>

      </div>
    </div>
  );
}