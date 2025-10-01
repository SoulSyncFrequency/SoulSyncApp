// OpenTelemetry basic Node SDK setup
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');

const exporter = new OTLPTraceExporter({
  url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://otel-collector:4318/v1/traces'
});

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || 'soulsync-backend'
  }),
  traceExporter: exporter,
  instrumentations: [ getNodeAutoInstrumentations() ]
});

sdk.start()
  .then(()=> console.log('OTel SDK started'))
  .catch((e)=> console.error('OTel SDK error', e));

process.on('SIGTERM', () => {
  sdk.shutdown().then(() => console.log('OTel SDK shutdown')).catch((e)=>console.error(e)).finally(()=>process.exit(0));
});
