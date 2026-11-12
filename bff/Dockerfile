# Imagem de produção do BFF (Backend for Frontend)
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY api ./api
COPY server ./server
USER node
EXPOSE 3000
ENV PORT=3000
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost:${PORT}/health || exit 1
CMD ["node", "api/server.js"]
