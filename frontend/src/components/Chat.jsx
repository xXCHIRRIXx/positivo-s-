import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Chat() {
  const navigate = useNavigate();

  // Datos del usuario con la sesión activa
  const miEmail = localStorage.getItem('usuarioEmail') || 'usuario@positivo.com';
  const miNombre = localStorage.getItem('usuarioNombre') || 'Usuario';
  const miCargo = localStorage.getItem('usuarioCargo') || 'Asociado';

  // Estado del chat activo (Por defecto: Canal General)
  const [chatActivo, setChatActivo] = useState({
    id: 'general',
    nombre: 'Canal General',
    tipo: 'general'
  });

  const [mensajes, setMensajes] = useState([]);
  const [textoMensaje, setTextoMensaje] = useState('');
  const [archivoAdjunto, setArchivoAdjunto] = useState(null);

  // Lista de asociados registrados y filtro de búsqueda
  const [busqueda, setBusqueda] = useState('');
  const [usuarios, setUsuarios] = useState([]);

  // Responsive / Menú lateral móvil
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const mensajesEndRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 1. Cargar la lista completa de asociados desde el Backend
  const obtenerUsuarios = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/usuarios');
      if (response.ok) {
        const data = await response.json();
        // Filtrar para no mostrarme a mí mismo en la lista de contactos a escribir
        const otrosUsuarios = data.filter(u => {
          const emailU = u.email || u.correo;
          return emailU && emailU.toLowerCase() !== miEmail.toLowerCase();
        });
        setUsuarios(otrosUsuarios);
      }
    } catch (error) {
      console.error('Error al obtener la lista de asociados:', error);
    }
  };

  useEffect(() => {
    obtenerUsuarios();
  }, [miEmail]);

  // 2. Cargar los mensajes del chat activo (General o Privado)
  const obtenerMensajes = async () => {
    try {
      const response = await fetch(`http://localhost:4000/api/chat/${chatActivo.id}/mensajes`);
      if (response.ok) {
        const data = await response.json();
        setMensajes(data);
      }
    } catch (error) {
      console.error('Error cargando mensajes del chat:', error);
    }
  };

  useEffect(() => {
    obtenerMensajes();
    const interval = setInterval(obtenerMensajes, 2500); // Refresco automático cada 2.5s
    return () => clearInterval(interval);
  }, [chatActivo.id]);

  useEffect(() => {
    mensajesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  // 3. Crear o Abrir un Chat Privado 1 a 1 entre Asociados
  const abrirChatPrivado = (asociado) => {
    const emailDestino = asociado.email || asociado.correo;
    const nombreDestino = asociado.nombre || emailDestino;
    const cargoDestino = asociado.cargo || 'Asociado';

    // Generar un ID único e idéntico para ambos usuarios (ordenando alfabéticamente sus correos)
    const correosOrdenados = [miEmail.toLowerCase(), emailDestino.toLowerCase()].sort();
    const idPrivado = `dm_${correosOrdenados[0]}_${correosOrdenados[1]}`.replace(/[^a-zA-Z0-9_]/g, '_');

    setChatActivo({
      id: idPrivado,
      nombre: nombreDestino,
      cargo: cargoDestino,
      email: emailDestino,
      tipo: 'privado'
    });

    if (isMobile) setSidebarOpen(false);
  };

  // 4. Enviar Mensaje con Firma Completa (Nombre, Cargo, Correo y Fecha)
  const enviarMensaje = async (e) => {
    e.preventDefault();
    if (!textoMensaje.trim() && !archivoAdjunto) return;

    const fechaIso = new Date().toISOString();

    const formData = new FormData();
    formData.append('chatId', chatActivo.id);
    formData.append('remitenteEmail', miEmail);
    formData.append('remitenteNombre', miNombre);
    formData.append('remitenteCargo', miCargo);
    formData.append('texto', textoMensaje);
    formData.append('fechaHora', fechaIso);

    if (archivoAdjunto) {
      formData.append('archivo', archivoAdjunto);
    }

    try {
      const response = await fetch('http://localhost:4000/api/chat/enviar', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setTextoMensaje('');
        setArchivoAdjunto(null);
        const inputElem = document.getElementById('chatFileInput');
        if (inputElem) inputElem.value = '';
        obtenerMensajes();
      }
    } catch (error) {
      console.error('Error al enviar el mensaje:', error);
    }
  };

  // Formateador de Fecha y Hora
  const formatearFechaHora = (fechaRaw) => {
    if (!fechaRaw) return '';
    const d = new Date(fechaRaw);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Filtro para el buscador de contactos/asociados
  const usuariosFiltrados = usuarios.filter(u => {
    const term = busqueda.toLowerCase();
    const n = (u.nombre || '').toLowerCase();
    const c = (u.cargo || '').toLowerCase();
    const e = (u.email || u.correo || '').toLowerCase();
    return n.includes(term) || c.includes(term) || e.includes(term);
  });

  return (
    <div style={styles.container}>
      {/* BARRA LATERAL: LISTA DE ASOCIADOS Y CANALES */}
      <aside
        style={{
          ...styles.sidebar,
          ...(isMobile ? (sidebarOpen ? styles.sidebarMobileOpen : styles.sidebarMobileClosed) : {})
        }}
      >
        <div style={styles.sidebarHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={styles.brandLogo}>💬</div>
            <div>
              <h3 style={styles.brandName}>Positivo S+</h3>
              <span style={styles.onlineBadge}>● Red Interna</span>
            </div>
          </div>
          {isMobile && (
            <button onClick={() => setSidebarOpen(false)} style={styles.btnCloseSidebar}>
              ✕
            </button>
          )}
        </div>

        {/* CANAL GENERAL */}
        <div style={styles.sectionTitle}>CANAL GRUPAL</div>
        <button
          onClick={() => {
            setChatActivo({ id: 'general', nombre: 'Canal General', tipo: 'general' });
            if (isMobile) setSidebarOpen(false);
          }}
          style={{
            ...styles.channelBtn,
            ...(chatActivo.id === 'general' ? styles.channelBtnActive : {})
          }}
        >
          <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>#</span>
          <div>
            <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>General</div>
            <div style={{ fontSize: '0.72rem', opacity: 0.8 }}>Todos los asociados</div>
          </div>
        </button>

        {/* DIRECTORY DE ASOCIADOS */}
        <div style={{ ...styles.sectionTitle, marginTop: '20px' }}>CONTACTO DIRECTO (1 A 1)</div>
        
        <input
          type="text"
          placeholder="🔍 Buscar por nombre, cargo o correo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={styles.searchInput}
        />

        <div style={styles.userListScroll}>
          {usuariosFiltrados.length === 0 ? (
            <p style={styles.emptyUsersNote}>
              {busqueda ? 'No se encontraron asociados' : 'Cargando directorio de asociados...'}
            </p>
          ) : (
            usuariosFiltrados.map((u, i) => {
              const uEmail = u.email || u.correo;
              const uNombre = u.nombre || uEmail;
              const uCargo = u.cargo || 'Asociado';
              const estaSeleccionado = chatActivo.email === uEmail;

              return (
                <button
                  key={i}
                  onClick={() => abrirChatPrivado(u)}
                  style={{
                    ...styles.userCard,
                    ...(estaSeleccionado ? styles.userCardActive : {})
                  }}
                >
                  <div style={styles.userAvatar}>
                    {uNombre.charAt(0).toUpperCase()}
                  </div>
                  <div style={styles.userInfoText}>
                    <span style={styles.userNameText}>{uNombre}</span>
                    <span style={styles.userCargoText}>{uCargo}</span>
                    <span style={styles.userEmailText}>{uEmail}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div style={styles.sidebarFooter}>
          <button onClick={() => navigate(-1)} style={styles.btnBack}>
            ← Volver al Panel
          </button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL DE CONVERSACIÓN */}
      <main style={styles.mainContent}>
        
        {/* CABECERA SUPERIOR DEL CHAT */}
        <header style={styles.topHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isMobile && (
              <button onClick={() => setSidebarOpen(true)} style={styles.btnMenuMobile}>
                ☰
              </button>
            )}
            <div>
              <h2 style={styles.activeChatTitle}>
                {chatActivo.tipo === 'general' ? '# Canal General' : `💬 ${chatActivo.nombre}`}
              </h2>
              <p style={styles.activeChatSub}>
                {chatActivo.tipo === 'general'
                  ? 'Espacio público de comunicación para todo el equipo'
                  : `Chat privado directo con ${chatActivo.nombre} (${chatActivo.cargo || 'Asociado'})`}
              </p>
            </div>
          </div>

          {/* INFORMACIÓN DEL USUARIO LOGUEADO */}
          <div style={styles.myProfileBadge}>
            <div style={styles.myAvatar}>
              {miNombre.charAt(0).toUpperCase()}
            </div>
            {!isMobile && (
              <div style={{ textAlign: 'right' }}>
                <div style={styles.myProfileName}>{miNombre}</div>
                <div style={styles.myProfileCargo}>{miCargo}</div>
                <div style={styles.myProfileEmail}>{miEmail}</div>
              </div>
            )}
          </div>
        </header>

        {/* CONTENEDOR DE MENSAJES */}
        <div style={styles.messagesContainer}>
          {mensajes.length === 0 ? (
            <div style={styles.emptyChatBox}>
              <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>💬</div>
              <h4 style={{ margin: 0, fontWeight: '600' }}>Sin mensajes aquí todavía</h4>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
                {chatActivo.tipo === 'general'
                  ? 'Sé el primero en enviar un mensaje al equipo.'
                  : `Inicia la conversación privada con ${chatActivo.nombre}.`}
              </p>
            </div>
          ) : (
            mensajes.map((msg, idx) => {
              // Determinar si el mensaje lo envié yo o lo envió otro asociado
              const remitenteCorreo = msg.remitenteEmail || msg.remitente;
              const esMio = remitenteCorreo && remitenteCorreo.toLowerCase() === miEmail.toLowerCase();
              
              const nombreMostrar = msg.remitenteNombre || msg.remitente || 'Asociado';
              const cargoMostrar = msg.remitenteCargo || 'Asociado';
              const tiempoMostrar = formatearFechaHora(msg.fechaHora || msg.fecha);

              return (
                <div
                  key={idx}
                  style={{
                    ...styles.messageRow,
                    justifyContent: esMio ? 'flex-end' : 'flex-start'
                  }}
                >
                  {!esMio && (
                    <div style={styles.senderAvatar}>
                      {nombreMostrar.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div
                    style={{
                      ...styles.messageBubble,
                      ...(esMio ? styles.messageBubbleMine : styles.messageBubbleOther)
                    }}
                  >
                    {/* CABECERA DEL MENSAJE: NOMBRE, CARGO Y FECHA/HORA DE CADA INTEGRANTE */}
                    <div style={styles.msgHeaderLine}>
                      <span style={esMio ? styles.msgNameMine : styles.msgNameOther}>
                        {nombreMostrar}
                      </span>
                      <span style={styles.msgCargoTag}>[{cargoMostrar}]</span>
                      <span style={styles.msgTimeTag}>{tiempoMostrar}</span>
                    </div>

                    {/* TEXTO DEL MENSAJE */}
                    {msg.texto && <div style={styles.msgBodyText}>{msg.texto}</div>}

                    {/* ARCHIVO ADJUNTO */}
                    {msg.archivo && (
                      <div style={{ marginTop: '8px' }}>
                        {msg.archivo.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                          <img
                            src={`http://localhost:4000/uploads/${msg.archivo}`}
                            alt="Imagen Adjunta"
                            style={styles.imageAttachment}
                            onClick={() => window.open(`http://localhost:4000/uploads/${msg.archivo}`, '_blank')}
                          />
                        ) : (
                          <a
                            href={`http://localhost:4000/uploads/${msg.archivo}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={styles.fileAttachmentBtn}
                          >
                            📁 Descargar documento adjunto
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={mensajesEndRef} />
        </div>

        {/* CAMPO INFERIOR PARA ESCRIBIR Y ADJUNTAR */}
        <footer style={styles.inputFooter}>
          {archivoAdjunto && (
            <div style={styles.fileSelectedBar}>
              <span>📎 Archivo preparado: {archivoAdjunto.name}</span>
              <button onClick={() => setArchivoAdjunto(null)} style={styles.btnRemoveFile}>
                ✕
              </button>
            </div>
          )}

          <form onSubmit={enviarMensaje} style={styles.sendForm}>
            <input
              type="file"
              id="chatFileInput"
              onChange={(e) => setArchivoAdjunto(e.target.files[0])}
              style={{ display: 'none' }}
            />

            <button
              type="button"
              onClick={() => document.getElementById('chatFileInput').click()}
              style={styles.btnAttachFile}
              title="Adjuntar archivo o imagen"
            >
              📎
            </button>

            <input
              type="text"
              placeholder={
                chatActivo.tipo === 'general'
                  ? 'Escribe un mensaje para #General...'
                  : `Mensaje privado para ${chatActivo.nombre}...`
              }
              value={textoMensaje}
              onChange={(e) => setTextoMensaje(e.target.value)}
              style={styles.mainTextInput}
            />

            <button
              type="submit"
              disabled={!textoMensaje.trim() && !archivoAdjunto}
              style={{
                ...styles.btnSubmitSend,
                ...((!textoMensaje.trim() && !archivoAdjunto) ? styles.btnSubmitDisabled : {})
              }}
            >
              Enviar ➔
            </button>
          </form>
        </footer>

      </main>
    </div>
  );
}

// ESTILOS DE INTERFAZ CORPORATIVA
const styles = {
  container: {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    backgroundColor: '#0f172a',
    overflow: 'hidden',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  sidebar: {
    width: '320px',
    minWidth: '320px',
    backgroundColor: '#1e293b',
    borderRight: '1px solid #334155',
    display: 'flex',
    flexDirection: 'column',
    padding: '16px',
    zIndex: 20
  },
  sidebarMobileClosed: {
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    transform: 'translateX(-100%)',
    transition: 'transform 0.3s ease'
  },
  sidebarMobileOpen: {
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    transform: 'translateX(0)',
    transition: 'transform 0.3s ease',
    boxShadow: '5px 0 20px rgba(0,0,0,0.5)'
  },
  sidebarHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: '14px',
    borderBottom: '1px solid #334155',
    marginBottom: '16px'
  },
  brandLogo: {
    fontSize: '1.6rem',
    backgroundColor: '#2563eb',
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  brandName: {
    margin: 0,
    color: '#f8fafc',
    fontSize: '1.05rem',
    fontWeight: '700'
  },
  onlineBadge: {
    color: '#22c55e',
    fontSize: '0.72rem',
    fontWeight: '600'
  },
  btnCloseSidebar: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    fontSize: '1.2rem',
    cursor: 'pointer'
  },
  sectionTitle: {
    color: '#64748b',
    fontSize: '0.68rem',
    fontWeight: '700',
    letterSpacing: '0.05em',
    marginBottom: '8px'
  },
  channelBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    borderRadius: '8px',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%'
  },
  channelBtnActive: {
    backgroundColor: '#2563eb',
    color: '#ffffff'
  },
  searchInput: {
    width: '100%',
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    color: '#f8fafc',
    padding: '8px 12px',
    borderRadius: '6px',
    outline: 'none',
    fontSize: '0.82rem',
    marginBottom: '8px',
    boxSizing: 'border-box'
  },
  userListScroll: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  emptyUsersNote: {
    fontSize: '0.78rem',
    color: '#64748b',
    textAlign: 'center',
    marginTop: '12px'
  },
  userCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 10px',
    borderRadius: '8px',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%'
  },
  userCardActive: {
    backgroundColor: '#334155',
    color: '#ffffff'
  },
  userAvatar: {
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    backgroundColor: '#0284c7',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.85rem',
    fontWeight: 'bold',
    flexShrink: 0
  },
  userInfoText: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  userNameText: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#f8fafc',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  userCargoText: {
    fontSize: '0.73rem',
    color: '#38bdf8',
    fontWeight: '500'
  },
  userEmailText: {
    fontSize: '0.68rem',
    color: '#64748b',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  sidebarFooter: {
    paddingTop: '12px',
    borderTop: '1px solid #334155',
    marginTop: 'auto'
  },
  btnBack: {
    width: '100%',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #475569',
    backgroundColor: '#0f172a',
    color: '#cbd5e1',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '0.85rem'
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#0f172a',
    height: '100vh'
  },
  topHeader: {
    padding: '12px 24px',
    backgroundColor: '#1e293b',
    borderBottom: '1px solid #334155',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  btnMenuMobile: {
    background: '#334155',
    border: 'none',
    color: '#fff',
    fontSize: '1.2rem',
    padding: '6px 12px',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  activeChatTitle: {
    margin: 0,
    color: '#f8fafc',
    fontSize: '1.15rem',
    fontWeight: '700'
  },
  activeChatSub: {
    margin: '2px 0 0 0',
    color: '#94a3b8',
    fontSize: '0.78rem'
  },
  myProfileBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#0f172a',
    padding: '6px 12px',
    borderRadius: '8px',
    border: '1px solid #334155'
  },
  myAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#2563eb',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '0.9rem'
  },
  myProfileName: {
    color: '#f8fafc',
    fontSize: '0.82rem',
    fontWeight: '700'
  },
  myProfileCargo: {
    color: '#38bdf8',
    fontSize: '0.73rem',
    fontWeight: '500'
  },
  myProfileEmail: {
    color: '#94a3b8',
    fontSize: '0.68rem'
  },
  messagesContainer: {
    flex: 1,
    padding: '20px 24px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    backgroundColor: '#0b0f19'
  },
  emptyChatBox: {
    margin: 'auto',
    textAlign: 'center',
    backgroundColor: '#1e293b',
    padding: '24px 32px',
    borderRadius: '12px',
    border: '1px solid #334155',
    color: '#f8fafc'
  },
  messageRow: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '8px'
  },
  senderAvatar: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    backgroundColor: '#334155',
    color: '#38bdf8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.8rem',
    fontWeight: 'bold',
    flexShrink: 0
  },
  messageBubble: {
    maxWidth: '75%',
    padding: '10px 14px',
    borderRadius: '12px'
  },
  messageBubbleMine: {
    backgroundColor: '#1d4ed8',
    color: '#ffffff',
    borderBottomRightRadius: '2px'
  },
  messageBubbleOther: {
    backgroundColor: '#1e293b',
    color: '#f8fafc',
    border: '1px solid #334155',
    borderBottomLeftRadius: '2px'
  },
  msgHeaderLine: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '6px',
    marginBottom: '4px',
    flexWrap: 'wrap'
  },
  msgNameMine: {
    fontSize: '0.78rem',
    fontWeight: '700',
    color: '#93c5fd'
  },
  msgNameOther: {
    fontSize: '0.78rem',
    fontWeight: '700',
    color: '#38bdf8'
  },
  msgCargoTag: {
    fontSize: '0.7rem',
    fontWeight: '600',
    opacity: 0.9,
    color: '#cbd5e1'
  },
  msgTimeTag: {
    fontSize: '0.65rem',
    opacity: 0.7,
    marginLeft: 'auto'
  },
  msgBodyText: {
    fontSize: '0.88rem',
    lineHeight: '1.4',
    wordBreak: 'break-word'
  },
  imageAttachment: {
    maxWidth: '100%',
    maxHeight: '200px',
    borderRadius: '8px',
    marginTop: '6px',
    cursor: 'pointer'
  },
  fileAttachmentBtn: {
    display: 'inline-block',
    padding: '6px 10px',
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: '#fff',
    borderRadius: '6px',
    textDecoration: 'none',
    fontSize: '0.8rem',
    marginTop: '6px'
  },
  inputFooter: {
    padding: '14px 24px',
    backgroundColor: '#1e293b',
    borderTop: '1px solid #334155',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  fileSelectedBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#334155',
    color: '#f8fafc',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '0.82rem'
  },
  btnRemoveFile: {
    background: 'none',
    border: 'none',
    color: '#ef4444',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  sendForm: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center'
  },
  btnAttachFile: {
    backgroundColor: '#334155',
    border: 'none',
    color: '#f8fafc',
    padding: '10px 14px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1.1rem'
  },
  mainTextInput: {
    flex: 1,
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    color: '#f8fafc',
    padding: '10px 14px',
    borderRadius: '8px',
    outline: 'none',
    fontSize: '0.88rem'
  },
  btnSubmitSend: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    padding: '10px 18px',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '0.88rem'
  },
  btnSubmitDisabled: {
    backgroundColor: '#334155',
    color: '#64748b',
    cursor: 'not-allowed'
  }
};