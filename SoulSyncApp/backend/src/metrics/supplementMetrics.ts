
import { Counter, register } from 'prom-client'
export const supplementDoseCounter = new Counter({
  name: 'supplement_dose_total',
  help: 'Total logged supplement doses',
  labelNames: ['type']
})
