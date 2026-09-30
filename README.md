# Online Gallery

A small full-stack image gallery study project. Upload an image, give it a title, search the gallery, and delete images when they are no longer needed.

## Features

- Responsive photo-card grid
- Search photos by title
- Upload images with an immediate preview
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
- `InMemoryPhotoStorage` stores the associated image data separately by photo ID.

Images are held only in memory. Restarting the server clears the gallery.

## API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/photos` | List all photos |
| `GET` | `/api/photos/:id` | Get one photo, including its image data |
| `POST` | `/api/photos` | Create a photo with `title` and `imageUrl` |
| `DELETE` | `/api/photos/:id` | Delete a photo |

## Development

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

The port is configured in `server/.env`:

```env
PORT=3001
```

Copy `server/.env.example` when setting up another environment, then choose the required port.
