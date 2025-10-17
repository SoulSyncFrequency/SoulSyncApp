import { context, trace, diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api'
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { SimpleSpanProcessor, BatchSpanProcessor } from '@opentelemetry/sdk-trace-base'
import { Resource } from '@opentelemetry/resources'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'

const ENABLED = process.env.OTEL_ENABLE === 'on'
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR)

let provider: NodeTracerProvider | null = null

if (ENABLED){
  const res = new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || 'soulsync-api',
    [SemanticResourceAttributes.SERVICE_VERSION]: process.env.OTEL_SERVICE_VERSION || '0.0.0'
  })
  provider = new NodeTracerProvider({ resource: res })
  const url = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces'
  const exporter = new OTLPTraceExporter({ url })
  const proc = process.env.OTEL_SIMPLE === 'on' ? new SimpleSpanProcessor(exporter) : new BatchSpanProcessor(exporter)
  provider.addSpanProcessor(proc)
  provider.register()
}

export const tracer = trace.getTracer('soulsync')
export function startSpan(name: string){
  const span = tracer.startSpan(name)
  const ctx = trace.setSpan(context.active(), span)
  return { span, ctx }
}
