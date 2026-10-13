const crypto = require('crypto');

// Resolve JWT Secret securely without hardcoded fallback in production
let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: JWT_SECRET environment variable must be explicitly set in production.');
  }
  // Generate cryptographically random ephemeral secret for dev/test per runtime
  JWT_SECRET = crypto.randomBytes(32).toString('hex');
  if (process.env.NODE_ENV !== 'test') {
    console.warn('[SECURITY WARNING] No JWT_SECRET set. Generated ephemeral 256-bit runtime key.');
  }
}

// Master service key for administrative API actions and role issuance
let ADMIN_SERVICE_KEY = process.env.ADMIN_SERVICE_KEY;
if (!ADMIN_SERVICE_KEY) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: ADMIN_SERVICE_KEY environment variable must be explicitly configured in production.');
  }
  // Generate cryptographically random ephemeral key for dev/test per runtime (never a static string)
  ADMIN_SERVICE_KEY = crypto.randomBytes(32).toString('hex');
  if (process.env.NODE_ENV !== 'test') {
    console.warn('[SECURITY WARNING] No ADMIN_SERVICE_KEY set. Generated ephemeral 256-bit runtime key.');
  }
}

/**
 * Standard base64url encoder/decoder
 */
function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

/**
 * Create a signed HS256 JWT
 */
function signToken(payload, expiresInSeconds = 86400) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const fullPayload = { ...payload, exp, iat: Math.floor(Date.now() / 1000) };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Verify and decode an HS256 JWT
 */
function verifyToken(token) {
  if (!token || typeof token !== 'string') {
    throw new Error('Missing or invalid token');
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Malformed token structure');
  }

  const [encodedHeader, encodedPayload, signature] = parts;

  const expectedSignature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const sigBuffer = Buffer.from(signature);
  const expBuffer = Buffer.from(expectedSignature);

  if (sigBuffer.length !== expBuffer.length || !crypto.timingSafeEqual(sigBuffer, expBuffer)) {
    throw new Error('Invalid token signature');
  }

  const payload = JSON.parse(base64UrlDecode(encodedPayload));
  const now = Math.floor(Date.now() / 1000);

  if (payload.exp && payload.exp < now) {
    throw new Error('Token has expired');
  }

  return payload;
}

/**
 * Roles hierarchy and definitions
 */
const ROLES = {
  DONOR: 'DONOR',
  LAB_TECH: 'LAB_TECH',
  MEDICAL_OFFICER: 'MEDICAL_OFFICER',
  HOSPITAL_ADMIN: 'HOSPITAL_ADMIN',
  BLOODBANK_ADMIN: 'BLOODBANK_ADMIN',
  DISASTER_ADMIN: 'DISASTER_ADMIN',
  AUDITOR: 'AUDITOR'
};

/**
 * Validates whether an incoming request possesses valid administrative credentials
 */
function verifyAdminCredentials(req) {
  const adminKey = req.headers['x-admin-key'] || req.headers['x-api-key'] || (req.body && req.body.adminApiKey);
  if (adminKey && adminKey === ADMIN_SERVICE_KEY) {
    return true;
  }
  // Check if caller provides a valid Bearer token with HOSPITAL_ADMIN role
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const decoded = verifyToken(authHeader.split(' ')[1]);
      if (decoded && (decoded.role === ROLES.HOSPITAL_ADMIN || decoded.role === ROLES.BLOODBANK_ADMIN)) {
        return true;
      }
    } catch (_) {
      // Invalid token
    }
  }
  return false;
}

/**
 * Authentication Middleware:
 * Verifies Bearer token from Authorization header
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    // Check if authorized admin service key is provided
    const apiKey = req.headers['x-api-key'] || req.headers['x-admin-key'];
    if (apiKey && apiKey === ADMIN_SERVICE_KEY) {
      req.user = { id: 'admin-service', role: ROLES.HOSPITAL_ADMIN, name: 'Service Administrator' };
      return next();
    }
    return res.status(401).json({
      error: 'Unauthorized: Authentication required',
      code: 'AUTH_TOKEN_MISSING',
      hint: 'Include Authorization: Bearer <token>'
    });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return res.status(401).json({
      error: 'Unauthorized: Invalid authorization header format (expected Bearer <token>)',
      code: 'AUTH_HEADER_INVALID'
    });
  }

  try {
    const decoded = verifyToken(parts[1]);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      error: `Unauthorized: ${err.message}`,
      code: 'AUTH_TOKEN_INVALID'
    });
  }
};

/**
 * Authorization Middleware:
 * Enforces Role-Based Access Control (RBAC)
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: User not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role) && req.user.role !== ROLES.HOSPITAL_ADMIN) {
      return res.status(403).json({
        error: `Forbidden: User role '${req.user.role}' lacks permission for this endpoint`,
        code: 'ACCESS_DENIED',
        requiredRoles: allowedRoles
      });
    }

    next();
  };
};

/**
 * Donor Profile Authorization:
 * Protects donor records so callers can only read records they own,
 * unless they are an authorized Medical Officer or Hospital Admin with clinical necessity.
 */
const requireDonorOrClinicalStaff = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized: Authentication required' });
  }

  const targetDid = req.params.did;
  const isOwner = req.user.did === targetDid || req.user.id === targetDid;
  const isClinicalStaff = [
    ROLES.MEDICAL_OFFICER,
    ROLES.HOSPITAL_ADMIN,
    ROLES.BLOODBANK_ADMIN,
    ROLES.AUDITOR
  ].includes(req.user.role);

  if (!isOwner && !isClinicalStaff) {
    return res.status(403).json({
      error: 'Forbidden: You do not have permission to access this donor record',
      code: 'DONOR_ACCESS_UNAUTHORIZED'
    });
  }

  next();
};

module.exports = {
  signToken,
  verifyToken,
  ROLES,
  ADMIN_SERVICE_KEY,
  verifyAdminCredentials,
  authenticate,
  requireRole,
  requireDonorOrClinicalStaff
};
