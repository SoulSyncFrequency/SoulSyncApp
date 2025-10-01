import { logger } from '../utils/logger'
export default function AnalyticsPlaceholder() {
  return (
    <script>
      {`logger.log('Analytics placeholder loaded (replace with GA when ready)')`}
    </script>
  )
}
