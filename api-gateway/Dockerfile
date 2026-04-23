FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .

EXPOSE 3001

# Extended start-period to allow middleware initialization
# Includes: enforceSSL, stqcMiddleware, auditLogger, express startup
HEALTHCHECK --interval=5s --timeout=3s --start-period=30s --retries=5 \
  CMD wget -qO- --header="x-forwarded-proto: https" http://localhost:3001/health || exit 1

CMD ["node", "server.js"]
