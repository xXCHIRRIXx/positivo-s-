import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nombre: '',
    cargo: ''
  });
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMensaje('');

    const endpoint = isLogin
      ? 'http://localhost:4000/api/auth/login'
      : 'http://localhost:4000/api/auth/register';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Ocurrió un error');

      // Extraer datos del backend o de lo ingresado en el formulario
      const userObj = data.usuario || data.user || {};
      const emailFinal = userObj.email || userObj.correo || formData.email;
      const nombreFinal = userObj.nombre || formData.nombre || emailFinal.split('@')[0];
      const cargoFinal = userObj.cargo || formData.cargo || 'Asociado';

      // Guardar en localStorage para usarlos en el Chat y en toda la app
      localStorage.setItem('usuarioEmail', emailFinal);
      localStorage.setItem('usuarioNombre', nombreFinal);
      localStorage.setItem('usuarioCargo', cargoFinal);

      if (isLogin) {
        setMensaje('¡Inicio de sesión exitoso!');
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      } else {
        setMensaje('¡Registro exitoso! Entrando al sistema...');
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-700">
        
        {/* Cabecera corporativa */}
        <div className="bg-gradient-to-r from-emerald-600 to-blue-600 p-6 text-center">
          <h1 className="text-3xl font-extrabold text-white tracking-wide">
            POSITIVO <span className="text-emerald-300">S+</span>
          </h1>
          <p className="text-emerald-100 text-sm mt-1">Gestión Inteligente de Inventario y Activos</p>
        </div>

        {/* Selector Login / Registro */}
        <div className="p-8">
          <div className="flex justify-center mb-6 bg-slate-900 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                isLogin ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                !isLogin ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Registrarse
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500 text-red-300 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          {mensaje && (
            <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500 text-emerald-300 rounded-lg text-sm text-center">
              {mensaje}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    required={!isLogin}
                    value={formData.nombre}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    placeholder="Juan Pérez"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Cargo de Asociado
                  </label>
                  <input
                    type="text"
                    name="cargo"
                    required={!isLogin}
                    value={formData.cargo}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    placeholder="Ej. Técnico de Soporte, Analista..."
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="correo@positivo.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Contraseña
              </label>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-lg transition-all transform active:scale-95"
            >
              {isLogin ? 'Ingresar al Sistema' : 'Crear Cuenta'}
            </button>
          </form>
        </div>

        <div className="bg-slate-900/50 py-4 text-center border-t border-slate-700/50">
          <p className="text-xs text-slate-500">Panel de Control & Soporte Tecnológico</p>
        </div>

      </div>
    </div>
  );
}