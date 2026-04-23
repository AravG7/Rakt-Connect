FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .

EXPOSE 3001

# Extended start-period for Express + middleware initialization
# Grace period increased from 10s to 30s for reliable CI/CD integration tests

HEALTHCHECK --interval=5s --timeout=3s --start-period=30s --retries=5 \
  CMD wget -qO- --header="x-forwarded-proto: https" http://localhost:3001/health || exit 1

CMD ["node", "server.js"]
