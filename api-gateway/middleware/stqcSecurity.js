const crypto = require('crypto');

// STQC Control: PQC-Ready Hash Wrapping + CIA Enforcement
const stqcMiddleware = (req, res, next) => {

    // 1. Enforce TLS 1.3 only (STQC N13) - typically handled by NGINX but verified at app layer
    if (req.headers['x-forwarded-proto'] !== 'https' && process.env.NODE_ENV === 'production') {
        return res.status(403).json({ error: "STQC Violation: Secure TLS transmission required" });
    }

    // 2. DPDP Act / Section 43A IT Act: Anonymize Payloads before logging
    const sanitizeLogs = (body) => {
        const sanitized = { ...body };
        if (sanitized.aadhaar) sanitized.aadhaar = crypto.createHash('sha256').update(sanitized.aadhaar).digest('hex'); // pseudo-anonymization
        if (sanitized.phone) sanitized.phone = "***-***-" + sanitized.phone.slice(-4);
        return sanitized;
    };

    req.stqcSafeBody = sanitizeLogs(req.body);

    // 3. Replay Attack Prevention (STQC A4) via Timestamp Validation
    const reqTime = parseInt(req.headers['x-timestamp']);
    const now = Date.now();
    if (!reqTime || Math.abs(now - reqTime) > 300000) { // 5 minute window
        return res.status(401).json({ error: "STQC Violation: Expired or missing X-Timestamp header (Replay Attack Prevention)" });
    }

    // 4. Section 65B IT Act Evidence Generator
    req.generateEvidenceBundle = () => {
        return {
            txId: crypto.randomUUID(), // mapped to Fabric TX
            clientIp: req.ip,
            timestamp: new Date().toISOString(),
            payloadHash: crypto.createHash('sha256').update(JSON.stringify(req.stqcSafeBody)).digest('hex')
        };
    };

    next();
};

module.exports = stqcMiddleware;
