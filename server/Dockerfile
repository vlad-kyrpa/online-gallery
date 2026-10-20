# Builds the client bundle and TypeScript server from their locked dependencies.
FROM node:22-bookworm-slim AS build

WORKDIR /app

COPY client/package.json client/package-lock.json ./client/
COPY server/package.json server/package-lock.json ./server/

RUN npm ci --prefix client && npm ci --prefix server

COPY client ./client
COPY server ./server

RUN npm run build --prefix server

# Retrieves the RDS trust bundle used to verify the production database server.
RUN apt-get update \
  && apt-get install --yes --no-install-recommends ca-certificates curl \
  && curl --fail --silent --show-error --location \
    --output /tmp/rds-global-bundle.pem \
    https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem \
  && rm --recursive --force /var/lib/apt/lists/*

# Runs only compiled application files and production server dependencies.
FROM node:22-bookworm-slim AS runtime

WORKDIR /app/server

ENV NODE_ENV=production
ENV PORT=8080
ENV AWS_RDS_CA_CERTIFICATE_PATH=/app/certificates/rds-global-bundle.pem

COPY server/package.json server/package-lock.json ./

RUN npm ci --omit=dev && npm cache clean --force

COPY --chown=node:node --from=build /app/server/dist ./dist
COPY --chown=node:node --from=build /app/client/build ../client/build
COPY --chown=node:node --from=build /tmp/rds-global-bundle.pem /app/certificates/rds-global-bundle.pem
COPY --chown=node:node --from=build /app/server/drizzle ./drizzle

USER node

EXPOSE 8080

CMD ["node", "dist/index.js"]
