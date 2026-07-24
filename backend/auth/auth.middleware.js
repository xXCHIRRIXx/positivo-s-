const { auth } = require('./firebase.config');

const verifyToken = async (req, res, next) => {
  const headerToken = req.headers.authorization;
  
  if (!headerToken || !headerToken.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado. Token no proporcionado.' });
  }

  const token = headerToken.split(' ')[1];

  try {
    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido o expirado.' });
  }
};

module.exports = verifyToken;