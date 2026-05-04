# DriftHound MCP Server

An MCP (Model Context Protocol) server that enables Claude to discover and understand IaC drift from DriftHound.

## Features

- **list_projects_with_drift** - Find all projects that have drifting environments
- **list_environments** - List environments for a project with status filtering
- **get_drift_details** - Get full Terraform plan output for drift analysis
- **get_environment_info** - Get repository, branch, and directory for remediation

## Installation

### GitHub Packages (recommended)

The package is published to GitHub Packages. Because GitHub Packages requires authentication even for public packages, you need a GitHub personal access token with the `read:packages` scope.

1. Add the following to your `~/.npmrc`:

```
@drifthoundhq:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_PAT
```

2. Use `npx` directly in your MCP client config — no global install needed (see below).

### From source

```bash
npm install
npm run build
```

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DRIFTHOUND_API_URL` | Yes | Base URL of your DriftHound instance |
| `DRIFTHOUND_API_TOKEN` | Yes | API token from DriftHound admin UI |

### Claude Code Configuration

Add to your Claude Code settings (`~/.claude/settings.json`):

```json
{
  "mcpServers": {
    "drifthound": {
      "command": "npx",
      "args": ["-y", "@drifthoundhq/mcp-server"],
      "env": {
        "DRIFTHOUND_API_URL": "https://drifthound.example.com",
        "DRIFTHOUND_API_TOKEN": "your-api-token"
      }
    }
  }
}
```

### Claude Desktop Configuration

Add to your Claude Desktop config (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "drifthound": {
      "command": "npx",
      "args": ["-y", "@drifthoundhq/mcp-server"],
      "env": {
        "DRIFTHOUND_API_URL": "https://drifthound.example.com",
        "DRIFTHOUND_API_TOKEN": "your-api-token"
      }
    }
  }
}
```

## Usage

Once configured, Claude can use these tools to discover and understand drift:

### Discover Drift

```
Claude, what projects have drift?
```

Claude will use `list_projects_with_drift` to find projects needing attention.

### Investigate a Project

```
Show me the drifting environments in the EKS project
```

Claude will use `list_environments` with `status=drift` filter.

### Analyze Drift Details

```
What's causing drift in eks/production?
```

Claude will use `get_drift_details` to get the full Terraform plan output.

### Get Remediation Info

```
Where can I find the code to fix eks/production drift?
```

Claude will use `get_environment_info` to get the repository URL and directory.

## Kubernetes Deployment

A Docker image is published to `ghcr.io/drifthoundhq/mcp-server` on every release. The server runs in HTTP mode when the `PORT` environment variable is set, exposing the MCP protocol at `/mcp`.

The quickest way to deploy on Kubernetes is via the Helm chart published to the OCI registry:

```bash
helm install drifthound oci://ghcr.io/drifthoundhq/charts/drifthound-mcp-server \
  --namespace drifthound \
  --create-namespace \
  --set drifthoundApiUrl=https://your-drifthound.example.com \
  --set drifthoundApiToken=your-api-token
```

Once running, point Claude Code at the in-cluster endpoint:

```json
{
  "mcpServers": {
    "drifthound": {
      "url": "http://drifthound-drifthound-mcp-server.drifthound.svc.cluster.local:3000/mcp"
    }
  }
}
```

See the [Helm chart README](helm/drifthound-mcp-server/README.md) for the full configuration reference, external secret support, and port-forward instructions for local access.

## Development

```bash
# Run in development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## API Requirements

This MCP server requires DriftHound to have the read API endpoints enabled:

- `GET /api/v1/projects` - List projects
- `GET /api/v1/projects/:key` - Get project details
- `GET /api/v1/projects/:key/environments` - List environments
- `GET /api/v1/projects/:key/environments/:key` - Get environment details
- `GET /api/v1/projects/:key/environments/:key/drift` - Get latest drift check

## License

MIT
