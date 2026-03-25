.PHONY: up down build build-labs logs clean reset-db help

# Default target
help:
	@echo ""
	@echo "  SkyPortal - Make Commands"
	@echo "  ─────────────────────────"
	@echo "  make up          Start all services"
	@echo "  make down        Stop all services"
	@echo "  make build       Build app images"
	@echo "  make build-labs  Build all lab Docker images"
	@echo "  make logs        Follow logs"
	@echo "  make clean       Remove containers and volumes"
	@echo "  make reset-db    Drop and recreate database"
	@echo "  make status      Show service status"
	@echo ""

up:
	docker compose up -d
	@echo "✅ SkyPortal running at http://localhost"

down:
	docker compose down

build:
	docker compose build

build-labs:
	@echo "🐳 Building lab images..."
	docker build -t skyportal/lab-sqli-01 ./labs/sqli-lab-01
	@echo "✅ Lab images built"

logs:
	docker compose logs -f

status:
	docker compose ps

clean:
	docker compose down -v --remove-orphans
	@echo "🗑️  Cleaned up containers and volumes"

reset-db:
	docker compose stop postgres
	docker volume rm skyportal_pgdata || true
	docker compose up -d postgres
	@echo "♻️  Database reset"

# Production deploy target
deploy: build build-labs up
	@echo "🚀 Deployment complete"

# Stop and cleanup expired lab containers
cleanup-labs:
	curl -X POST http://localhost:4000/api/admin/containers/cleanup \
		-H "Authorization: Bearer $(ADMIN_TOKEN)"
