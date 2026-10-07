# Online Gallery

A small full-stack image gallery study project. Upload an image, give it a title, search the gallery, and delete images when they are no longer needed.

## Development

Use node from `.nvmrc`

```
nvm use
```

Install dependencies once for each application:

```bash
cd client
npm install

cd ../server
npm install
```

Start the API in one terminal:

```bash
cd server
npm start
```

Start the React client in another terminal:

```bash
cd client
npm start
```

Open `http://localhost:3000`. The client development server proxies API requests to `http://localhost:3001`.

## Production build and run

The server builds the client and then compiles itself. From the `server` directory:

```bash
npm run build
npm start
```

Open `http://localhost:3001`. Express serves the compiled React app from `client/build` and handles API requests under `/api/photos`.

The client production build disables source-map generation and the unused Create React App ESLint worker to keep memory use low on small servers.

The port is configured in `server/.env`:

```env
PORT=3001
```

Copy `server/.env.example` when setting up another environment, then choose the required port.

## Docker

Build from the repository root. The Dockerfile lives in `server/`, while the repository root remains the build context so both the React client and Express server are available to the build.

```bash
docker build --file server/Dockerfile --tag online-gallery:latest .
```

### Push the private Docker Hub image

Run these commands from your development machine or CI, not from the EC2 deployment instance.

```bash
docker login --username quoterlock
docker build --file server/Dockerfile --tag quoterlock/online-gallery:latest .
docker push quoterlock/online-gallery:latest
```

Use a version tag as well as `latest` when you need a reproducible deployment or rollback target:

```bash
docker build --file server/Dockerfile --tag quoterlock/online-gallery:v1.0.0 .
docker push quoterlock/online-gallery:v1.0.0
```

The image excludes `.env` files. Supply configuration at runtime; on EC2, use `docker-compose.yaml` to provide the non-secret `AWS_S3_*` settings and let the attached IAM role supply S3 credentials.

### Run the private Docker Hub image

Authenticate once on the host with a Docker Hub personal access token, then Compose can pull the private image. The token is not placed in this repository or the Compose file.

```bash
printf '%s' "$DOCKERHUB_TOKEN" | docker login --username quoterlock --password-stdin
docker compose pull
docker compose up --detach
```

`docker-compose.yaml` runs `quoterlock/online-gallery:latest`, publishes port `8080`, restarts it unless stopped explicitly, and provides its non-secret runtime configuration directly.

For the complete EC2 private-image deployment guide, see [EC2_DEPLOY_README.md](EC2_DEPLOY_README.md).

### S3-compatible image storage

Set `AWS_S3_BUCKET_NAME` to enable object storage. The server uploads image bytes as bucket objects under `AWS_S3_KEY_PREFIX` (default: `photos`) and serves them through the API, so the bucket can remain private. AWS credentials are supplied by the standard AWS SDK provider chain—use an IAM role in EC2 deployment.

```env
AWS_S3_BUCKET_NAME=online-gallery-images
AWS_S3_REGION=us-east-1
AWS_S3_KEY_PREFIX=photos
```

For local development, place your AWS credentials in the uncommitted `server/.env` file. The AWS SDK reads these standard names automatically. Do not configure them on EC2; its instance IAM role supplies temporary credentials instead.

```env
AWS_ACCESS_KEY_ID=your-local-access-key-id
AWS_SECRET_ACCESS_KEY=your-local-secret-access-key
# AWS_SESSION_TOKEN=your-session-token-if-using-temporary-credentials
```

For an S3-compatible provider such as MinIO, also set its endpoint and path-style setting:

```env
AWS_S3_ENDPOINT=http://localhost:9000
AWS_S3_FORCE_PATH_STYLE=true
```
