# Builds the client bundle and TypeScript server from their locked dependencies.
FROM node:22-bookworm-slim AS build

WORKDIR /app

COPY client/package.json client/package-lock.json ./client/
COPY server/package.json server/package-lock.json ./server/

RUN npm ci --prefix client && npm ci --prefix server

COPY client ./client
COPY server ./server

RUN npm run build --prefix server

# Runs only compiled application files and production server dependencies.
FROM node:22-bookworm-slim AS runtime

WORKDIR /app/server

ENV NODE_ENV=production
ENV PORT=8080

COPY server/package.json server/package-lock.json ./

RUN npm ci --omit=dev && npm cache clean --force

COPY --chown=node:node --from=build /app/server/dist ./dist
COPY --chown=node:node --from=build /app/client/build ../client/build

USER node

EXPOSE 8080

CMD ["node", "dist/index.js"]
