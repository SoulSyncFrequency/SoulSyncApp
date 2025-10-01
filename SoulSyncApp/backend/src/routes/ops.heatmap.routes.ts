
import { Router } from 'express'

const router = Router()
router.get('/ops/heatmap', (req, res) => {
  const url = process.env.GRAFANA_DASH_URL
  if (url) return res.redirect(302, url)
  return res.sendFile('ops_heatmap.html', { root: 'public' })
})

export default router
