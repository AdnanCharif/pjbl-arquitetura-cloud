# Usada apenas no docker-compose local: em produção a Function roda na Vercel.
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
COPY api ./api
COPY lib ./lib
COPY scripts ./scripts
COPY index.html ./
USER node
EXPOSE 3003
ENV PORT=3003
CMD ["node", "scripts/local-server.js"]
