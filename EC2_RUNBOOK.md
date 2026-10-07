# Run Online Gallery from Docker Hub

This guide runs the private Docker Hub image on an EC2 instance. It does not build or push an image.

## EC2 Setup

- IAM role to access S3 bucket
- IAM role to access dockerhub PAT secret from secrets manager

## Log in and start the container

Retrieve the Docker Hub token from Secrets Manager and send it to Docker through standard input. This keeps it out of command history and process arguments.

```bash
TOKEN="$(aws secretsmanager get-secret-value \
  --secret-id online-gallery-dockerhub-pull \
  --query SecretString \
  --output text)"

printf '%s' "$TOKEN" | docker login \
  --username quoterlock \
  --password-stdin

unset TOKEN
```

Pull and run the image:

```bash
docker compose pull
docker compose up -d
```

The app is available on port `8080`:

## View live logs

Run these commands from the directory containing `docker-compose.yaml`.

```bash
# Follow application logs in real time.
docker compose logs --follow

# Show the last 100 lines, then keep following new entries.
docker compose logs --follow --tail 100

# Confirm the container is running and inspect published ports.
docker compose ps
```

## Deploy an updated image

After a newer `latest` image is pushed to Docker Hub, run:

```bash
docker compose pull
docker compose up -d
```

If you do not need to pull private images again immediately, remove the retained Docker login credential:

```bash
docker logout
```
