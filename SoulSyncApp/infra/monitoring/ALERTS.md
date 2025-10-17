# Alerting Setup

## Slack
- Set `SLACK_WEBHOOK_URL` as an environment variable for Alertmanager container.
- Default channel: `#alerts` (change in `infra/monitoring/alertmanager/alertmanager.yml`).

## Email
- Replace `devnull@example.com` with your on-call email.

## Alerts
- Configured rules in `infra/monitoring/prometheus/alerts.yml` (5xx rate, instance down, p95 latency).

## Multi-receiver Example
```yaml
route:
  receiver: default
receivers:
  - name: default
    email_configs:
      - to: oncall@example.com
    slack_configs:
      - api_url: ${SLACK_WEBHOOK_URL}
        channel: '#alerts'
        send_resolved: true
```
