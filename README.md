# DriftHound MCP Server

An MCP (Model Context Protocol) server that enables Claude to discover and understand IaC drift from DriftHound.

## Features

- **list_projects_with_drift** - Find all projects that have drifting environments
- **list_environments** - List environments for a project with status filtering
- **get_drift_details** - Get full Terraform plan output for drift analysis
- **get_environment_info** - Get repository, branch, and directory for remediation

## Installation

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
      "command": "node",
      "args": ["/path/to/drifthound-mcp/dist/index.js"],
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
      "command": "node",
      "args": ["/path/to/drifthound-mcp/dist/index.js"],
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
