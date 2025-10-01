import { z } from 'zod'
// Auto-inferred types from existing Zod schemas
import { TherapyRequestSchema, TherapyResponseSchema } from '../schemas/therapy'
import { ReportsDailySendNowRequestSchema, WebhookTestRequestSchema } from '../middleware/requestValidator'
import { AdminDashboardExportPdfQuerySchema, LogsQuerySchema, MetricsQuerySchema2, ReportsHistoryQuerySchema } from '../middleware/queryValidator'

export type TherapyRequest = z.infer<typeof TherapyRequestSchema>
export type TherapyResponse = z.infer<typeof TherapyResponseSchema>
export type ReportsDailySendNowRequest = z.infer<typeof ReportsDailySendNowRequestSchema>
export type WebhookTestRequest = z.infer<typeof WebhookTestRequestSchema>
export type AdminDashboardExportPdfQuery = z.infer<typeof AdminDashboardExportPdfQuerySchema>
export type LogsQuery = z.infer<typeof LogsQuerySchema>
export type MetricsQuery = z.infer<typeof MetricsQuerySchema2>
export type ReportsHistoryQuery = z.infer<typeof ReportsHistoryQuerySchema>

export type BillingRequest = z.infer<typeof BillingRequestSchema>
