# monitarr-web

<!-- TODO: Add screenshot after first build -->

Beautiful self-hosted monitoring dashboard for your \*arr stack.

## Features

- Unified dashboard for Sonarr, Radarr, Lidarr, and Prowlarr
- Real-time download queue monitoring
- Activity history across all services
- Terminal-inspired UI with system status readout
- Light, Dark, and OLED themes
- Single Docker container deployment
- Optional basic auth protection

## Quick Start

1. Copy the `docker-compose.yml` to your server
2. Fill in your API keys for each \*arr service
3. Start the container:

```bash
docker compose up -d
```

Open `http://your-server:3000` in your browser.

## Configuration

| Variable | Description | Default |
| --- | --- | --- |
| `SONARR_URL` | Sonarr instance URL | `http://sonarr:8989` |
| `SONARR_API_KEY` | Sonarr API key | |
| `RADARR_URL` | Radarr instance URL | `http://radarr:7878` |
| `RADARR_API_KEY` | Radarr API key | |
| `LIDARR_URL` | Lidarr instance URL | `http://lidarr:8686` |
| `LIDARR_API_KEY` | Lidarr API key | |
| `PROWLARR_URL` | Prowlarr instance URL | `http://prowlarr:9696` |
| `PROWLARR_API_KEY` | Prowlarr API key | |
| `AUTH_ENABLED` | Enable basic auth | `false` |
| `AUTH_PASSWORD` | Password for basic auth | |

## Reverse Proxy

### Caddy

```
monitarr.example.com {
    reverse_proxy monitarr:3000
}
```

### Nginx Proxy Manager

Create a new proxy host:

- **Domain:** `monitarr.example.com`
- **Forward Hostname:** `monitarr`
- **Forward Port:** `3000`
- Enable **Websockets Support**
- Request a new SSL certificate under the SSL tab

## Security

Monitarr acts as a server-side proxy to your \*arr services. API keys are stored as environment variables and never sent to the browser. All requests from the frontend are routed through the Next.js API layer, keeping your credentials on the server.

Enable `AUTH_ENABLED=true` and set `AUTH_PASSWORD` for basic password protection. For advanced authentication, place Monitarr behind an auth proxy like Authelia or Authentik.

## Development

```bash
git clone https://github.com/joshuakaisar/monitarr-web.git
cd monitarr-web
npm install
cp .env.example .env
# Fill in your API keys in .env
npm run dev
```

Or use Docker:

```bash
docker compose -f docker-compose.dev.yml up
```

## Tech Stack

- [Next.js 16](https://nextjs.org) with App Router
- [TypeScript](https://www.typescriptlang.org)
- [Tailwind CSS v4](https://tailwindcss.com)
- [TanStack Query](https://tanstack.com/query)
- [Zustand](https://zustand.docs.pmnd.rs)
- [Heroicons](https://heroicons.com) & [Lucide](https://lucide.dev)
- [shadcn/ui](https://ui.shadcn.com)

## License

[MIT](LICENSE)
