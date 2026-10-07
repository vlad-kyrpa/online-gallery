# Online Gallery

A small full-stack image gallery study project. Upload an image, give it a title, search the gallery, and delete images when they are no longer needed.

## Features

- Responsive photo-card grid
- Search photos by title
- Upload images with an immediate preview
- Server-side image compression to WebP, capped at 512×512 pixels
- Delete photos
- Backend-powered list, create, delete, and get-by-ID operations

## Architecture

The React client is organized by responsibility:

- `client/src/api` contains HTTP calls.
- `client/src/components` contains shared UI elements.
- `client/src/features` contains gallery and upload views.
- `client/src/utils` contains file conversion utilities.
- `client/src/types.ts` contains shared client domain types.

The Express server has separate concerns:

- `PhotoService` coordinates use cases.
- `InMemoryPhotoIndex` keeps photo metadata (`id` and `title`) in a map.
- `InMemoryPhotoStorage` stores associated image data separately by photo ID for local development.
- `S3PhotoStorage` persists image objects in a private S3 or S3-compatible bucket when configured.

Without bucket configuration, images are held only in memory and restarting the server clears the gallery. Metadata is currently in-memory in every mode, so an S3-backed image becomes inaccessible from the gallery after a server restart until a persistent metadata index is added.

## API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/photos` | List all photos |
| `GET` | `/api/photos/:id` | Get one photo's metadata and image-asset URL |
| `GET` | `/api/photos/:id/image` | Get the image as its native binary asset |
| `POST` | `/api/photos` | Create a photo with `title` and `imageUrl` |
| `DELETE` | `/api/photos/:id` | Delete a photo |

## Development

Use Node.js 22 LTS. With `nvm`, run `nvm use` from the repository root; the required version is recorded in `.nvmrc`.

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
