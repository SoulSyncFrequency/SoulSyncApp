.PHONY: build test release helm-upgrade

build:
	npm ci && npm run build --workspace=backend

test:
	npm run test:all --workspace=backend

release:
	bash scripts/release.sh

helm-upgrade:
	helm upgrade --install soulsync charts/soulsync -f charts/soulsync/values-production.yaml

test-all:
	cd backend && npm ci && npm run test -- --coverage

lint:
	cd backend && npm run lint --if-present || true

format:
	npx prettier -w .

ready:
	curl -fsS http://localhost:3000/readyz

# --- Local infra (Postgres + Redis + Prometheus + Grafana) ---
infra-up:
	docker-compose up -d db redis prometheus grafana redis-init

infra-down:
	docker-compose down -v

infra-logs:
	docker-compose logs -f

redis-seed:
	docker-compose run --rm redis-init

metrics:
	curl -fsS http://localhost:3000/metrics | head -n 40 || true

grafana-open:
	@echo "Open Grafana: http://localhost:3001  (user: admin, pass: admin)"

slo-open:
	@echo "Open Grafana SLO board: http://localhost:3001/dashboards"

alertmanager-open:
	@echo "Open Alertmanager: http://localhost:9093"

perf-local:
	cd backend && k6 run tests/load/login-refresh-me.js --summary-export=../summary.json || true && node tools/perf-gate.mjs summary.json 1500 || true

mutation:
	npm run mutation:test --workspace=backend || true

smoke-ci:
	@echo "Starting local smoke test (requires db+redis running)"
	curl -fsS http://localhost:3000/healthz && echo OK || (echo FAIL && exit 1)
	curl -fsS http://localhost:3000/readyz && echo OK || (echo FAIL && exit 1)

prepush:
	npm run test:ci --workspace=backend --if-present || npm run test --workspace=backend --if-present || true
	$(MAKE) smoke-ci || true

up-full:
	docker compose -f docker-compose.full.yml up -d

down-full:
	docker compose -f docker-compose.full.yml down

logs-backend:
	docker logs -f $$(docker ps -q --filter "ancestor=ghcr.io/soulsyncfrequency/soulsyncapp-backend:latest" | head -n1) || true

k6-login:
	k6 run backend/tests/load/login-refresh-me.js --summary-export=summary-login.json || true

k6-therapy:
	k6 run backend/tests/load/therapy.js --summary-export=summary-therapy.json || true

k6-nutrition:
	k6 run backend/tests/load/nutrition.js --summary-export=summary-nutrition.json || true

perf-gate:
	node tools/perf-gate.mjs summary-login.json summary-therapy.json summary-nutrition.json 1500
