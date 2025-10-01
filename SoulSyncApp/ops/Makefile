

sentry-test:
	# Requires ENABLE_TEST_ENDPOINTS=true and SENTRY_DSN set
	curl -s -i $${BASE_URL:-http://localhost:8080}/api/_test-error || true


lint:
	cd backend && npm run lint
	cd frontend && npm run lint

lint-fix:
	cd backend && npm run lint:fix || true
	cd frontend && npm run lint:fix || true


format:
	cd backend && npm run format
	cd frontend && npm run format

format-check:
	cd backend && npm run format:check
	cd frontend && npm run format:check
