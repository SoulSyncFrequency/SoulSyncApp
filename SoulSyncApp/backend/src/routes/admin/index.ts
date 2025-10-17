import { Router } from 'express'
import adminEditorRoutes from '../adminEditor'
import { requireAdmin } from '../../middleware/auth'

const router = Router()

// All admin routes require token
router.use(requireAdmin)

// Reuse existing adminEditor CRUD under / (entries, entry, delete)
router.use('/', adminEditorRoutes)

export default router
