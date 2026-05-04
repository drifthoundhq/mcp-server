{{/*
Expand the name of the chart.
*/}}
{{- define "drifthound-mcp-server.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "drifthound-mcp-server.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart label.
*/}}
{{- define "drifthound-mcp-server.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels.
*/}}
{{- define "drifthound-mcp-server.labels" -}}
helm.sh/chart: {{ include "drifthound-mcp-server.chart" . }}
{{ include "drifthound-mcp-server.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels.
*/}}
{{- define "drifthound-mcp-server.selectorLabels" -}}
app.kubernetes.io/name: {{ include "drifthound-mcp-server.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
ServiceAccount name.
*/}}
{{- define "drifthound-mcp-server.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "drifthound-mcp-server.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Secret name for API credentials.
*/}}
{{- define "drifthound-mcp-server.secretName" -}}
{{- if .Values.existingSecret }}
{{- .Values.existingSecret }}
{{- else }}
{{- include "drifthound-mcp-server.fullname" . }}
{{- end }}
{{- end }}
