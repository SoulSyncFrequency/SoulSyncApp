# Simple Makefile for local dev convenience

up:
	docker compose up --build

down:
	docker compose down

logs:
	docker compose logs -f

ps:
	docker compose ps

rebuild:
	docker compose build --no-cache

clean:
	docker compose down -v --remove-orphans
	rm -rf sftp/*
