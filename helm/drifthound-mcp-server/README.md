# drifthound-mcp-server Helm Chart

Deploys the [DriftHound MCP Server](https://github.com/drifthoundhq/mcp-server) on Kubernetes. The server runs in HTTP mode and exposes the MCP protocol over `POST /mcp`, plus `/healthz` and `/readyz` probes.

## Prerequisites

- Kubernetes 1.25+
- Helm 3.8+ (OCI registry support)

## Installation

### From the OCI registry

```bash
helm install drifthound oci://ghcr.io/drifthoundhq/charts/drifthound-mcp-server \
  --namespace drifthound \
  --create-namespace \
  --set drifthoundApiUrl=https://your-drifthound.example.com \
  --set drifthoundApiToken=your-api-token
```

### From source

```bash
helm install drifthound ./helm/drifthound-mcp-server \
  --namespace drifthound \
  --create-namespace \
  --set drifthoundApiUrl=https://your-drifthound.example.com \
  --set drifthoundApiToken=your-api-token
```

### Using an existing Secret

If you manage secrets externally (e.g. with External Secrets Operator or Vault), create a secret with the expected keys and reference it:

```bash
kubectl create secret generic drifthound-credentials \
  --from-literal=DRIFTHOUND_API_URL=https://your-drifthound.example.com \
  --from-literal=DRIFTHOUND_API_TOKEN=your-api-token

helm install drifthound oci://ghcr.io/drifthoundhq/charts/drifthound-mcp-server \
  --set existingSecret=drifthound-credentials
```

## Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `replicaCount` | Number of pod replicas | `1` |
| `image.repository` | Container image repository | `ghcr.io/drifthoundhq/mcp-server` |
| `image.tag` | Image tag (defaults to chart `appVersion`) | `""` |
| `image.pullPolicy` | Image pull policy | `IfNotPresent` |
| `imagePullSecrets` | Pull secrets for private registries | `[]` |
| `drifthoundApiUrl` | **Required.** Base URL of your DriftHound instance | `""` |
| `drifthoundApiToken` | **Required.** API token from the DriftHound admin UI | `""` |
| `existingSecret` | Use a pre-existing Secret instead of creating one | `""` |
| `service.type` | Kubernetes Service type | `ClusterIP` |
| `service.port` | Service port | `3000` |
| `resources.requests.cpu` | CPU request | `50m` |
| `resources.requests.memory` | Memory request | `64Mi` |
| `resources.limits.cpu` | CPU limit | `200m` |
| `resources.limits.memory` | Memory limit | `256Mi` |
| `serviceAccount.create` | Create a dedicated ServiceAccount | `true` |
| `serviceAccount.annotations` | Annotations on the ServiceAccount (e.g. IRSA) | `{}` |
| `nodeSelector` | Node selector constraints | `{}` |
| `tolerations` | Pod tolerations | `[]` |
| `affinity` | Pod affinity rules | `{}` |

## Connecting Claude Code to the deployed server

The server is reachable inside the cluster at:

```
http://<release-name>-drifthound-mcp-server.<namespace>.svc.cluster.local:3000/mcp
```

### From inside the cluster

Add to your Claude Code settings:

```json
{
  "mcpServers": {
    "drifthound": {
      "url": "http://drifthound-drifthound-mcp-server.drifthound.svc.cluster.local:3000/mcp"
    }
  }
}
```

### From a local machine (port-forward)

```bash
kubectl port-forward -n drifthound svc/drifthound-drifthound-mcp-server 3000:3000
```

Then in `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "drifthound": {
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

## Health endpoints

| Path | Purpose |
|------|---------|
| `GET /healthz` | Liveness — returns `200` if the process is alive |
| `GET /readyz` | Readiness — returns `200` if the DriftHound API (`/up`) is reachable, `503` otherwise |

## Upgrading

```bash
helm upgrade drifthound oci://ghcr.io/drifthoundhq/charts/drifthound-mcp-server \
  --namespace drifthound \
  --reuse-values
```

## Uninstalling

```bash
helm uninstall drifthound --namespace drifthound
```

Credentials stored in the chart-managed Secret are removed automatically. If you used `existingSecret`, the Secret is left untouched.
