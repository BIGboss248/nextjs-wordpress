SHELL = /bin/bash

.PHONY: help deploy-all deploy-wordpress deploy-nextjs patch-wordpress status logs down restart check-docker setup-network

# Color definitions
CLR_RESET   = \033[0m
CLR_BOLD    = \033[1m
CLR_RED     = \033[31m
CLR_GREEN   = \033[32m
CLR_YELLOW  = \033[33m
CLR_CYAN    = \033[36m

help:
	@echo -e "$(CLR_CYAN)$(CLR_BOLD)Production Stacks Orchestration (Next.js + WordPress)$(CLR_RESET)"
	@echo -e "  $(CLR_GREEN)make deploy-all$(CLR_RESET)        - Deploy both WordPress and Next.js stacks & auto-patch pdo_mysql"
	@echo -e "  $(CLR_GREEN)make deploy-wordpress$(CLR_RESET)  - Deploy WordPress + MySQL stack and patch pdo_mysql"
	@echo -e "  $(CLR_GREEN)make deploy-nextjs$(CLR_RESET)     - Deploy Next.js App Router standalone storefront"
	@echo -e "  $(CLR_GREEN)make patch-wordpress$(CLR_RESET)   - Install pdo_mysql in running WordPress container"
	@echo -e "  $(CLR_GREEN)make status$(CLR_RESET)            - Check status of both production stacks"
	@echo -e "  $(CLR_GREEN)make logs$(CLR_RESET)              - Follow logs of all production containers"
	@echo -e "  $(CLR_GREEN)make down$(CLR_RESET)              - Stop both production stacks"
	@echo -e "  $(CLR_GREEN)make restart$(CLR_RESET)           - Restart both production stacks"

check-docker:
	@if ! command -v docker >/dev/null 2>&1; then \
		echo -e "$(CLR_RED)[!] Docker is not installed or not in PATH.$(CLR_RESET)"; \
		exit 1; \
	fi

setup-network:
	@if ! docker network inspect my_network >/dev/null 2>&1 && ! sudo docker network inspect my_network >/dev/null 2>&1; then \
		echo -e "$(CLR_YELLOW)[*] Creating shared Docker network 'my_network'...$(CLR_RESET)"; \
		docker network create my_network 2>/dev/null || sudo docker network create my_network 2>/dev/null; \
	fi

# Patch WordPress container with pdo_mysql (for Persian WooCommerce / Laravel Capsule)
patch-wordpress: check-docker
	@echo -e "$(CLR_YELLOW)[*] Checking/Installing pdo_mysql extension inside WordPress container...$(CLR_RESET)"
	@WP_CONTAINER=$$(docker ps -q -f name=^/wordpress$$ 2>/dev/null || sudo docker ps -q -f name=^/wordpress$$ 2>/dev/null); \
	if [ -z "$$WP_CONTAINER" ]; then \
		echo -e "$(CLR_RED)[!] WordPress container is not running. Deploy it first with 'make deploy-wordpress'.$(CLR_RESET)"; \
		exit 1; \
	fi; \
	if docker exec "$$WP_CONTAINER" php -m 2>/dev/null | grep -q '^pdo_mysql$$' || sudo docker exec "$$WP_CONTAINER" php -m 2>/dev/null | grep -q '^pdo_mysql$$'; then \
		echo -e "$(CLR_GREEN)[✔] pdo_mysql extension is already active in WordPress container.$(CLR_RESET)"; \
	else \
		echo -e "$(CLR_YELLOW)[*] Installing pdo_mysql driver into official WordPress container...$(CLR_RESET)"; \
		(docker exec -u 0 "$$WP_CONTAINER" docker-php-ext-install pdo_mysql 2>/dev/null || sudo docker exec -u 0 "$$WP_CONTAINER" docker-php-ext-install pdo_mysql) && \
		(docker exec "$$WP_CONTAINER" apache2ctl graceful 2>/dev/null || sudo docker exec "$$WP_CONTAINER" apache2ctl graceful) && \
		echo -e "$(CLR_GREEN)[✔] pdo_mysql driver installed successfully and Apache reloaded.$(CLR_RESET)"; \
	fi

deploy-wordpress: check-docker setup-network
	@echo -e "$(CLR_CYAN)[*] Deploying WordPress backend stack...$(CLR_RESET)"
	@docker compose -f WordPress/docker-compose.yml up -d || sudo docker compose -f WordPress/docker-compose.yml up -d
	@echo -e "$(CLR_GREEN)[✔] WordPress container deployed. Waiting for health check...$(CLR_RESET)"
	@sleep 5
	@$(MAKE) --no-print-directory patch-wordpress

deploy-nextjs: check-docker setup-network
	@echo -e "$(CLR_CYAN)[*] Deploying Next.js storefront stack...$(CLR_RESET)"
	@docker compose -f docker-compose.yml up -d || sudo docker compose -f docker-compose.yml up -d
	@echo -e "$(CLR_GREEN)[✔] Next.js storefront deployed successfully.$(CLR_RESET)"

# Deploy complete production infrastructure
deploy-all: deploy-wordpress deploy-nextjs
	@echo -e "$(CLR_GREEN)$(CLR_BOLD)[✔] All production stacks deployed and WordPress container patched successfully.$(CLR_RESET)"

status: check-docker
	@echo -e "$(CLR_CYAN)[*] WordPress Stack:$(CLR_RESET)"
	@docker compose -f WordPress/docker-compose.yml ps 2>/dev/null || sudo docker compose -f WordPress/docker-compose.yml ps
	@echo -e "\n$(CLR_CYAN)[*] Next.js Stack:$(CLR_RESET)"
	@docker compose -f docker-compose.yml ps 2>/dev/null || sudo docker compose -f docker-compose.yml ps

logs: check-docker
	@docker compose -f WordPress/docker-compose.yml -f docker-compose.yml logs -f 2>/dev/null || sudo docker compose -f WordPress/docker-compose.yml -f docker-compose.yml logs -f

restart: check-docker
	@docker compose -f WordPress/docker-compose.yml restart 2>/dev/null || sudo docker compose -f WordPress/docker-compose.yml restart
	@docker compose -f docker-compose.yml restart 2>/dev/null || sudo docker compose -f docker-compose.yml restart
	@$(MAKE) --no-print-directory patch-wordpress

down: check-docker
	@docker compose -f docker-compose.yml down 2>/dev/null || sudo docker compose -f docker-compose.yml down
	@docker compose -f WordPress/docker-compose.yml down 2>/dev/null || sudo docker compose -f WordPress/docker-compose.yml down
	@echo -e "$(CLR_GREEN)[✔] Production stacks stopped.$(CLR_RESET)"

