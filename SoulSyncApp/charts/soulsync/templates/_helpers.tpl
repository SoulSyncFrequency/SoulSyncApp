{{- define "soulsync.name" -}}
soulsync-backend
{{- end -}}

{{- define "soulsync.fullname" -}}
{{- include "soulsync.name" . -}}
{{- end -}}
