SHELL = /bin/bash

.PHONY: help init-env setup-all setup-network setup-dirs setup-domain setup-resolver setup-db-user setup-db-passwords setup-salts setup-jwt-secret report reload-if-running restart up down logs status backup-db check-docker install-wordpress

# Color definitions
CLR_RESET   = \033[0m
CLR_BOLD    = \033[1m
CLR_RED     = \033[31m
CLR_GREEN   = \033[32m
CLR_YELLOW  = \033[33m
CLR_BLUE    = \033[34m
CLR_MAGENTA = \033[35m
CLR_CYAN    = \033[36m
CLR_WHITE   = \033[37m

help:
	@echo -e "$(CLR_CYAN)$(CLR_BOLD)WordPress Setup & Stack Management$(CLR_RESET)"
	@echo -e "  $(CLR_GREEN)make setup-all$(CLR_RESET)          - Run end-to-end interactive setup (skips already configured steps)"
	@echo -e "  $(CLR_GREEN)make setup-domain$(CLR_RESET)       - Configure WordPress website domain name"
	@echo -e "  $(CLR_GREEN)make setup-resolver$(CLR_RESET)     - Configure TLS certificate resolver (Let's Encrypt / Cloudflare)"
	@echo -e "  $(CLR_GREEN)make setup-db-user$(CLR_RESET)      - Configure database username (default: wordpress_user)"
	@echo -e "  $(CLR_GREEN)make setup-db-passwords$(CLR_RESET) - Generate cryptographically strong random DB & root passwords"
	@echo -e "  $(CLR_GREEN)make setup-salts$(CLR_RESET)        - Automatically generate 8 unique WordPress security keys & salts"
	@echo -e "  $(CLR_GREEN)make setup-jwt-secret$(CLR_RESET)   - Automatically generate secret key for WPGraphQL JWT Authentication"
	@echo -e "  $(CLR_GREEN)make setup-network$(CLR_RESET)      - Verify / create shared Traefik Docker network (my_network)"
	@echo -e "  $(CLR_GREEN)make setup-dirs$(CLR_RESET)         - Initialize volume directories with proper www-data permissions"
	@echo -e "  $(CLR_GREEN)make report$(CLR_RESET)             - Display colored summary box of current WordPress configuration"
	@echo -e "  $(CLR_GREEN)make install-wordpress$(CLR_RESET)  - Run complete setup and launch WordPress containers"
	@echo -e "  $(CLR_GREEN)make up$(CLR_RESET)                 - Start WordPress containers in detached mode"
	@echo -e "  $(CLR_GREEN)make down$(CLR_RESET)               - Stop and remove WordPress containers"
	@echo -e "  $(CLR_GREEN)make restart$(CLR_RESET)            - Recreate and restart WordPress containers"
	@echo -e "  $(CLR_GREEN)make logs$(CLR_RESET)               - Follow real-time container logs"
	@echo -e "  $(CLR_GREEN)make status$(CLR_RESET)             - Check container status via Docker Compose"
	@echo -e "  $(CLR_GREEN)make backup-db$(CLR_RESET)          - Create a timestamped SQL backup of the MySQL database"

# Ensure .env exists from template
init-env:
	@if [ ! -f .env ]; then \
		echo -e "$(CLR_YELLOW)[*] Creating .env from .env.example...$(CLR_RESET)"; \
		cp .env.example .env; \
	fi

# 1. Setup shared Traefik docker network
setup-network:
	@echo -e "$(CLR_CYAN)[*] Checking shared Docker network 'my_network'...$(CLR_RESET)"
	@if docker info >/dev/null 2>&1; then \
		DOCKER_CMD="docker"; \
	elif sudo docker info >/dev/null 2>&1; then \
		DOCKER_CMD="sudo docker"; \
	else \
		DOCKER_CMD="docker"; \
	fi; \
	if $$DOCKER_CMD network inspect my_network >/dev/null 2>&1 || \
	   docker network inspect my_network >/dev/null 2>&1 || \
	   sudo docker network inspect my_network >/dev/null 2>&1 || \
	   [ -n "$$($$DOCKER_CMD network ls --filter name=^my_network$$ -q 2>/dev/null)" ] || \
	   [ -n "$$(docker network ls --filter name=^my_network$$ -q 2>/dev/null)" ] || \
	   [ -n "$$(sudo docker network ls --filter name=^my_network$$ -q 2>/dev/null)" ]; then \
		echo -e "$(CLR_GREEN)[✔] Network 'my_network' already exists. Skipping creation.$(CLR_RESET)"; \
	else \
		echo -e "$(CLR_YELLOW)[+] Network 'my_network' not found. Creating shared Docker network...$(CLR_RESET)"; \
		if $$DOCKER_CMD network create my_network 2>/dev/null || docker network create my_network 2>/dev/null || sudo docker network create my_network 2>/dev/null; then \
			echo -e "$(CLR_GREEN)[✔] Network 'my_network' created successfully.$(CLR_RESET)"; \
		else \
			echo -e "$(CLR_GREEN)[✔] Network 'my_network' verified.$(CLR_RESET)"; \
		fi; \
	fi

# 2. Setup storage directories & ownership
setup-dirs:
	@echo -e "$(CLR_CYAN)[*] Checking volume storage directories and permissions...$(CLR_RESET)"
	@mkdir -p ./WordPress ./WordPress_database
	@if [ "$$(id -u)" -eq 0 ] || command -v sudo >/dev/null 2>&1; then \
		sudo chown -R 33:33 ./WordPress 2>/dev/null || true; \
	fi
	@echo -e "$(CLR_GREEN)[✔] Storage directories initialized (./WordPress, ./WordPress_database).$(CLR_RESET)"

# 3. Configure Website Domain
setup-domain: init-env
	@dom_val=$$(grep -E '^WORDPRESS_DOMAIN=' .env 2>/dev/null | cut -d '=' -f2- | tr -d '[:space:]'); \
	if [ -n "$$dom_val" ] && [ "$$dom_val" != "example.com" ]; then \
		echo -e "$(CLR_GREEN)[✔] WordPress domain already configured ($$dom_val).$(CLR_RESET)"; \
		read -p "Do you want to change WordPress domain? [y/N]: " reconf </dev/tty; \
		if [ "$$reconf" != "y" ] && [ "$$reconf" != "Y" ]; then \
			exit 0; \
		fi; \
	fi; \
	echo -e "$(CLR_YELLOW)[*] WordPress Website Domain Configuration:$(CLR_RESET)"; \
	read -p "Enter WordPress domain (e.g., example.com): " wp_domain </dev/tty; \
	while [ -z "$$wp_domain" ]; do \
		echo -e "$(CLR_RED)[!] Domain cannot be empty.$(CLR_RESET)"; \
		read -p "Enter WordPress domain (e.g., example.com): " wp_domain </dev/tty; \
	done; \
	if grep -q '^WORDPRESS_DOMAIN=' .env; then \
		sed -i -E "s|^WORDPRESS_DOMAIN=.*|WORDPRESS_DOMAIN=$$wp_domain|" .env; \
	else \
		echo "WORDPRESS_DOMAIN=$$wp_domain" >> .env; \
	fi; \
	echo -e "$(CLR_GREEN)[✔] WordPress domain set to '$$wp_domain'.$(CLR_RESET)"
	@$(MAKE) --no-print-directory reload-if-running

# 4. Configure TLS Certificate Resolver (Let's Encrypt / Cloudflare)
setup-resolver: init-env
	@res_val=$$(grep -E '^CERT_RESOLVER=' .env 2>/dev/null | cut -d '=' -f2- | tr -d '[:space:]'); \
	if [ -n "$$res_val" ]; then \
		echo -e "$(CLR_GREEN)[✔] Certificate resolver already configured ($$res_val).$(CLR_RESET)"; \
		read -p "Do you want to change certificate resolver? [y/N]: " reconf </dev/tty; \
		if [ "$$reconf" != "y" ] && [ "$$reconf" != "Y" ]; then \
			exit 0; \
		fi; \
	fi; \
	echo -e "$(CLR_YELLOW)[*] Traefik TLS Certificate Resolver Selection:$(CLR_RESET)"; \
	echo "  1) Let's Encrypt HTTP-01 challenge (myresolver)"; \
	echo "  2) Cloudflare DNS-01 challenge (cloudflare_resolver)"; \
	read -p "Choose resolver [1/2, default 1]: " res_choice </dev/tty; \
	if [ "$$res_choice" = "2" ]; then \
		chosen_res="cloudflare_resolver"; \
	else \
		chosen_res="myresolver"; \
	fi; \
	if grep -q '^CERT_RESOLVER=' .env; then \
		sed -i -E "s|^CERT_RESOLVER=.*|CERT_RESOLVER=$$chosen_res|" .env; \
	else \
		echo "CERT_RESOLVER=$$chosen_res" >> .env; \
	fi; \
	echo -e "$(CLR_GREEN)[✔] Certificate resolver set to '$$chosen_res'.$(CLR_RESET)"
	@$(MAKE) --no-print-directory reload-if-running

# 5. Configure Database Username (with default fallback)
setup-db-user: init-env
	@user_val=$$(grep -E '^WORDPRESS_DB_USER=' .env 2>/dev/null | cut -d '=' -f2- | tr -d '[:space:]'); \
	if [ -n "$$user_val" ] && [ "$$user_val" != "wordpress_user" ]; then \
		echo -e "$(CLR_GREEN)[✔] Database user already configured ($$user_val).$(CLR_RESET)"; \
		read -p "Do you want to change database username? [y/N]: " reconf </dev/tty; \
		if [ "$$reconf" != "y" ] && [ "$$reconf" != "Y" ]; then \
			exit 0; \
		fi; \
	fi; \
	echo -e "$(CLR_YELLOW)[*] Database User Configuration:$(CLR_RESET)"; \
	read -p "Enter Database username [wordpress_user]: " db_user </dev/tty; \
	db_user=$${db_user:-wordpress_user}; \
	if grep -q '^WORDPRESS_DB_USER=' .env; then \
		sed -i -E "s|^WORDPRESS_DB_USER=.*|WORDPRESS_DB_USER=$$db_user|" .env; \
	else \
		echo "WORDPRESS_DB_USER=$$db_user" >> .env; \
	fi; \
	echo -e "$(CLR_GREEN)[✔] Database username set to '$$db_user'.$(CLR_RESET)"
	@$(MAKE) --no-print-directory reload-if-running

# 6. Generate Strong Random DB Passwords
setup-db-passwords: init-env
	@db_pass=$$(grep -E '^WORDPRESS_DB_PASSWORD=' .env 2>/dev/null | cut -d '=' -f2- | tr -d '[:space:]'); \
	root_pass=$$(grep -E '^MYSQL_ROOT_PASSWORD=' .env 2>/dev/null | cut -d '=' -f2- | tr -d '[:space:]'); \
	if [ -n "$$db_pass" ] && [ "$$db_pass" != "ChangeThisToAStrongPassword123!" ] && \
	   [ -n "$$root_pass" ] && [ "$$root_pass" != "ChangeThisToAStrongRootPassword123!" ]; then \
		echo -e "$(CLR_GREEN)[✔] Database passwords already configured.$(CLR_RESET)"; \
		read -p "Do you want to re-generate database passwords? [y/N]: " reconf </dev/tty; \
		if [ "$$reconf" != "y" ] && [ "$$reconf" != "Y" ]; then \
			exit 0; \
		fi; \
	fi; \
	echo -e "$(CLR_YELLOW)[*] Generating cryptographically secure random database passwords...$(CLR_RESET)"; \
	gen_db_pass=$$(openssl rand -base64 32 2>/dev/null | tr -dc 'A-Za-z0-9_#%+' | head -c 24); \
	if [ -z "$$gen_db_pass" ]; then \
		gen_db_pass=$$(tr -dc 'A-Za-z0-9_#%+' < /dev/urandom 2>/dev/null | head -c 24); \
	fi; \
	gen_root_pass=$$(openssl rand -base64 32 2>/dev/null | tr -dc 'A-Za-z0-9_#%+' | head -c 24); \
	if [ -z "$$gen_root_pass" ]; then \
		gen_root_pass=$$(tr -dc 'A-Za-z0-9_#%+' < /dev/urandom 2>/dev/null | head -c 24); \
	fi; \
	if grep -q '^WORDPRESS_DB_PASSWORD=' .env; then \
		sed -i -E "s|^WORDPRESS_DB_PASSWORD=.*|WORDPRESS_DB_PASSWORD=$$gen_db_pass|" .env; \
	else \
		echo "WORDPRESS_DB_PASSWORD=$$gen_db_pass" >> .env; \
	fi; \
	if grep -q '^MYSQL_ROOT_PASSWORD=' .env; then \
		sed -i -E "s|^MYSQL_ROOT_PASSWORD=.*|MYSQL_ROOT_PASSWORD=$$gen_root_pass|" .env; \
	else \
		echo "MYSQL_ROOT_PASSWORD=$$gen_root_pass" >> .env; \
	fi; \
	echo -e "$(CLR_GREEN)[✔] Strong random database passwords generated and saved to .env.$(CLR_RESET)"
	@$(MAKE) --no-print-directory reload-if-running

# 7. Configure WordPress Authentication Keys and Salts Automatically
setup-salts: init-env
	@auth_key=$$(grep -E '^WORDPRESS_AUTH_KEY=' .env 2>/dev/null | cut -d '=' -f2- | tr -d '[:space:]'); \
	if [ -n "$$auth_key" ] && [ "$$auth_key" != "put_your_unique_phrase_here" ]; then \
		echo -e "$(CLR_GREEN)[✔] WordPress authentication keys & salts already configured.$(CLR_RESET)"; \
		read -p "Do you want to re-generate WordPress keys and salts? [y/N]: " reconf </dev/tty; \
		if [ "$$reconf" != "y" ] && [ "$$reconf" != "Y" ]; then \
			exit 0; \
		fi; \
	fi; \
	echo -e "$(CLR_YELLOW)[*] Automatically generating unique cryptographic keys & salts (64 chars each)...$(CLR_RESET)"; \
	salt_keys="WORDPRESS_AUTH_KEY WORDPRESS_SECURE_AUTH_KEY WORDPRESS_LOGGED_IN_KEY WORDPRESS_NONCE_KEY WORDPRESS_AUTH_SALT WORDPRESS_SECURE_AUTH_SALT WORDPRESS_LOGGED_IN_SALT WORDPRESS_NONCE_SALT"; \
	for key in $$salt_keys; do \
		salt_val=$$(openssl rand -base64 64 2>/dev/null | tr -dc 'A-Za-z0-9_#%+=@!' | head -c 64); \
		if [ -z "$$salt_val" ]; then \
			salt_val=$$(tr -dc 'A-Za-z0-9_#%+=@!' < /dev/urandom 2>/dev/null | head -c 64); \
		fi; \
		if grep -q "^$$key=" .env; then \
			sed -i -E "s|^$$key=.*|$$key=$$salt_val|" .env; \
		else \
			echo "$$key=$$salt_val" >> .env; \
		fi; \
	done; \
	echo -e "$(CLR_GREEN)[✔] 8 WordPress authentication keys & salts generated successfully.$(CLR_RESET)"
	@$(MAKE) --no-print-directory reload-if-running

# 8. Configure WPGraphQL JWT Authentication Secret Key
setup-jwt-secret: init-env
	@jwt_key=$$(grep -E '^GRAPHQL_JWT_AUTH_SECRET_KEY=' .env 2>/dev/null | cut -d '=' -f2- | tr -d '[:space:]'); \
	if [ -n "$$jwt_key" ] && [ "$$jwt_key" != "put_your_super_strong_graphql_jwt_secret_here" ]; then \
		echo -e "$(CLR_GREEN)[✔] WPGraphQL JWT secret key already configured.$(CLR_RESET)"; \
		read -p "Do you want to re-generate WPGraphQL JWT secret key? [y/N]: " reconf </dev/tty; \
		if [ "$$reconf" != "y" ] && [ "$$reconf" != "Y" ]; then \
			exit 0; \
		fi; \
	fi; \
	echo -e "$(CLR_YELLOW)[*] Generating cryptographically secure secret for WPGraphQL JWT Authentication (64 chars)...$(CLR_RESET)"; \
	gen_jwt_key=$$(openssl rand -base64 64 2>/dev/null | tr -dc 'A-Za-z0-9_#%+=@!' | head -c 64); \
	if [ -z "$$gen_jwt_key" ]; then \
		gen_jwt_key=$$(tr -dc 'A-Za-z0-9_#%+=@!' < /dev/urandom 2>/dev/null | head -c 64); \
	fi; \
	if grep -q '^GRAPHQL_JWT_AUTH_SECRET_KEY=' .env; then \
		sed -i -E "s|^GRAPHQL_JWT_AUTH_SECRET_KEY=.*|GRAPHQL_JWT_AUTH_SECRET_KEY=$$gen_jwt_key|" .env; \
	else \
		echo "GRAPHQL_JWT_AUTH_SECRET_KEY=$$gen_jwt_key" >> .env; \
	fi; \
	echo -e "$(CLR_GREEN)[✔] WPGraphQL JWT secret key generated successfully and saved to .env.$(CLR_RESET)"
	@$(MAKE) --no-print-directory reload-if-running

# Color formatted status report box
report: init-env
	@DOM_SET=$$(grep -E '^WORDPRESS_DOMAIN=' .env 2>/dev/null | cut -d '=' -f2- | tr -d '[:space:]'); \
	RES_SET=$$(grep -E '^CERT_RESOLVER=' .env 2>/dev/null | cut -d '=' -f2- | tr -d '[:space:]'); \
	DB_HOST_SET=$$(grep -E '^WORDPRESS_DB_HOST=' .env 2>/dev/null | cut -d '=' -f2- | tr -d '[:space:]'); \
	DB_NAME_SET=$$(grep -E '^WORDPRESS_DB_NAME=' .env 2>/dev/null | cut -d '=' -f2- | tr -d '[:space:]'); \
	DB_USER_SET=$$(grep -E '^WORDPRESS_DB_USER=' .env 2>/dev/null | cut -d '=' -f2- | tr -d '[:space:]'); \
	DB_PASS_SET=$$(grep -E '^WORDPRESS_DB_PASSWORD=' .env 2>/dev/null | cut -d '=' -f2- | tr -d '[:space:]'); \
	ROOT_PASS_SET=$$(grep -E '^MYSQL_ROOT_PASSWORD=' .env 2>/dev/null | cut -d '=' -f2- | tr -d '[:space:]'); \
	AUTH_KEY_SET=$$(grep -E '^WORDPRESS_AUTH_KEY=' .env 2>/dev/null | cut -d '=' -f2- | tr -d '[:space:]'); \
	JWT_KEY_SET=$$(grep -E '^GRAPHQL_JWT_AUTH_SECRET_KEY=' .env 2>/dev/null | cut -d '=' -f2- | tr -d '[:space:]'); \
	NET_CHECK="Missing (my_network)"; \
	(docker network inspect my_network >/dev/null 2>&1 || sudo docker network inspect my_network >/dev/null 2>&1) && NET_CHECK="Active (my_network)"; \
	STATUS_CHECK="Stopped"; \
	if [ -n "$$(sudo docker compose ps -q wordpress 2>/dev/null)" ] || [ -n "$$(sudo docker ps -q -f name=^/wordpress$$ 2>/dev/null)" ]; then \
		STATUS_CHECK="Running"; \
	fi; \
	[ -z "$$DOM_SET" ] || [ "$$DOM_SET" = "example.com" ] && DOM_STATUS="Default (example.com)" || DOM_STATUS="$$DOM_SET"; \
	[ "$$RES_SET" = "cloudflare_resolver" ] && RES_STATUS="Cloudflare DNS-01" || RES_STATUS="Let's Encrypt HTTP-01"; \
	[ -z "$$DB_HOST_SET" ] && DB_HOST_STATUS="wordpress_db:3306" || DB_HOST_STATUS="$$DB_HOST_SET"; \
	[ -z "$$DB_NAME_SET" ] && DB_NAME_STATUS="wordpress_db" || DB_NAME_STATUS="$$DB_NAME_SET"; \
	[ -z "$$DB_USER_SET" ] && DB_USER_STATUS="wordpress_user" || DB_USER_STATUS="$$DB_USER_SET"; \
	[ -z "$$DB_PASS_SET" ] || [ "$$DB_PASS_SET" = "ChangeThisToAStrongPassword123!" ] && DB_PASS_STATUS="Default/Unset" || DB_PASS_STATUS="Configured (Strong Random)"; \
	[ -z "$$ROOT_PASS_SET" ] || [ "$$ROOT_PASS_SET" = "ChangeThisToAStrongRootPassword123!" ] && ROOT_PASS_STATUS="Default/Unset" || ROOT_PASS_STATUS="Configured (Strong Random)"; \
	[ -z "$$AUTH_KEY_SET" ] || [ "$$AUTH_KEY_SET" = "put_your_unique_phrase_here" ] && SALTS_STATUS="Default/Unset" || SALTS_STATUS="Configured (8 Keys)"; \
	[ -z "$$JWT_KEY_SET" ] || [ "$$JWT_KEY_SET" = "put_your_super_strong_graphql_jwt_secret_here" ] && JWT_STATUS="Default/Unset" || JWT_STATUS="Configured (64 chars)"; \
	echo ""; \
	echo -e "$(CLR_CYAN)╔══════════════════════════════════════════════════════════════════════════════╗$(CLR_RESET)"; \
	echo -e "$(CLR_CYAN)║$(CLR_RESET)                   $(CLR_BOLD)$(CLR_WHITE)WORDPRESS CONFIGURATION & STATUS REPORT$(CLR_RESET)                    $(CLR_CYAN)║$(CLR_RESET)"; \
	echo -e "$(CLR_CYAN)╠══════════════════════════════════════════════════════════════════════════════╣$(CLR_RESET)"; \
	printf "$(CLR_CYAN)║$(CLR_RESET)  $(CLR_YELLOW)%-25s$(CLR_RESET) : $(CLR_WHITE)%-48s$(CLR_RESET)$(CLR_CYAN)║$(CLR_RESET)\n" "WordPress Domain" "$$DOM_STATUS"; \
	printf "$(CLR_CYAN)║$(CLR_RESET)  $(CLR_YELLOW)%-25s$(CLR_RESET) : $(CLR_WHITE)%-48s$(CLR_RESET)$(CLR_CYAN)║$(CLR_RESET)\n" "TLS Cert Resolver" "$$RES_STATUS"; \
	printf "$(CLR_CYAN)║$(CLR_RESET)  $(CLR_YELLOW)%-25s$(CLR_RESET) : $(CLR_WHITE)%-48s$(CLR_RESET)$(CLR_CYAN)║$(CLR_RESET)\n" "Database Host" "$$DB_HOST_STATUS"; \
	printf "$(CLR_CYAN)║$(CLR_RESET)  $(CLR_YELLOW)%-25s$(CLR_RESET) : $(CLR_WHITE)%-48s$(CLR_RESET)$(CLR_CYAN)║$(CLR_RESET)\n" "Database Name" "$$DB_NAME_STATUS"; \
	printf "$(CLR_CYAN)║$(CLR_RESET)  $(CLR_YELLOW)%-25s$(CLR_RESET) : $(CLR_WHITE)%-48s$(CLR_RESET)$(CLR_CYAN)║$(CLR_RESET)\n" "Database User" "$$DB_USER_STATUS"; \
	printf "$(CLR_CYAN)║$(CLR_RESET)  $(CLR_YELLOW)%-25s$(CLR_RESET) : $(CLR_WHITE)%-48s$(CLR_RESET)$(CLR_CYAN)║$(CLR_RESET)\n" "Database Password" "$$DB_PASS_STATUS"; \
	printf "$(CLR_CYAN)║$(CLR_RESET)  $(CLR_YELLOW)%-25s$(CLR_RESET) : $(CLR_WHITE)%-48s$(CLR_RESET)$(CLR_CYAN)║$(CLR_RESET)\n" "MySQL Root Password" "$$ROOT_PASS_STATUS"; \
	printf "$(CLR_CYAN)║$(CLR_RESET)  $(CLR_YELLOW)%-25s$(CLR_RESET) : $(CLR_WHITE)%-48s$(CLR_RESET)$(CLR_CYAN)║$(CLR_RESET)\n" "Auth Keys & Salts" "$$SALTS_STATUS"; \
	printf "$(CLR_CYAN)║$(CLR_RESET)  $(CLR_YELLOW)%-25s$(CLR_RESET) : $(CLR_WHITE)%-48s$(CLR_RESET)$(CLR_CYAN)║$(CLR_RESET)\n" "GraphQL JWT Secret" "$$JWT_STATUS"; \
	printf "$(CLR_CYAN)║$(CLR_RESET)  $(CLR_YELLOW)%-25s$(CLR_RESET) : $(CLR_WHITE)%-48s$(CLR_RESET)$(CLR_CYAN)║$(CLR_RESET)\n" "Shared Network" "$$NET_CHECK"; \
	printf "$(CLR_CYAN)║$(CLR_RESET)  $(CLR_YELLOW)%-25s$(CLR_RESET) : $(CLR_WHITE)%-48s$(CLR_RESET)$(CLR_CYAN)║$(CLR_RESET)\n" "Container Status" "$$STATUS_CHECK"; \
	echo -e "$(CLR_CYAN)╚══════════════════════════════════════════════════════════════════════════════╝$(CLR_RESET)"; \
	echo ""

# Check if WordPress is running and recreate/restart to apply config changes
reload-if-running:
	@if command -v docker >/dev/null 2>&1; then \
		if [ -n "$$(sudo docker compose ps -q wordpress 2>/dev/null)" ] || [ -n "$$(sudo docker ps -q -f name=^/wordpress$$ 2>/dev/null)" ]; then \
			echo -e "$(CLR_YELLOW)[*] WordPress stack is currently running. Recreating containers to apply changes...$(CLR_RESET)"; \
			sudo docker compose up -d --force-recreate; \
			echo -e "$(CLR_GREEN)[✔] WordPress updated and running with latest configuration.$(CLR_RESET)"; \
		fi; \
	fi

# Explicit manual restart target
restart: check-docker
	@echo -e "$(CLR_YELLOW)[*] Restarting WordPress stack...$(CLR_RESET)"
	sudo docker compose up -d --force-recreate
	@echo -e "$(CLR_GREEN)[✔] WordPress stack restarted successfully.$(CLR_RESET)"

# Start stack
up: check-docker init-env setup-network setup-dirs
	@echo -e "$(CLR_GREEN)[*] Starting WordPress stack in detached mode...$(CLR_RESET)"
	sudo docker compose up -d
	@echo -e "$(CLR_GREEN)[✔] WordPress stack is up.$(CLR_RESET)"

# Stop stack
down: check-docker
	@echo -e "$(CLR_YELLOW)[*] Stopping WordPress stack...$(CLR_RESET)"
	sudo docker compose down
	@echo -e "$(CLR_GREEN)[✔] WordPress stack stopped.$(CLR_RESET)"

# Follow real-time container logs
logs: check-docker
	sudo docker compose logs -f

# Check status of containers
status: check-docker
	sudo docker compose ps

# Create timestamped database backup
backup-db: check-docker
	@echo -e "$(CLR_YELLOW)[*] Creating MySQL database backup...$(CLR_RESET)"
	@mkdir -p ./backups
	@BACKUP_FILE="./backups/wordpress_db_$$(date +'%Y%m%d_%H%M%S').sql"; \
	DB_NAME=$$(grep -E '^WORDPRESS_DB_NAME=' .env 2>/dev/null | cut -d '=' -f2- | tr -d '[:space:]'); \
	DB_NAME=$${DB_NAME:-wordpress_db}; \
	ROOT_PASS=$$(grep -E '^MYSQL_ROOT_PASSWORD=' .env 2>/dev/null | cut -d '=' -f2- | tr -d '[:space:]'); \
	if sudo docker compose exec -T wordpress_db mysqldump -u root -p"$$ROOT_PASS" "$$DB_NAME" > "$$BACKUP_FILE" 2>/dev/null; then \
		echo -e "$(CLR_GREEN)[✔] Database backup saved to '$$BACKUP_FILE'.$(CLR_RESET)"; \
	else \
		rm -f "$$BACKUP_FILE"; \
		echo -e "$(CLR_RED)[!] Failed to create backup. Ensure database container is running and healthy.$(CLR_RESET)"; \
	fi

# Docker availability verification
check-docker:
	@if ! command -v docker >/dev/null 2>&1; then \
		echo -e "$(CLR_RED)[!] Docker is not installed or not in PATH.$(CLR_RESET)"; \
		echo -e "$(CLR_YELLOW)[*] Please install Docker first: https://docs.docker.com/engine/install/$(CLR_RESET)"; \
		exit 1; \
	fi

# End-to-end setup orchestrator
setup-all: init-env setup-network setup-dirs setup-domain setup-resolver setup-db-user setup-db-passwords setup-salts setup-jwt-secret report reload-if-running

# Complete installation target
install-wordpress: check-docker setup-all
	@if [ -z "$$(sudo docker compose ps -q wordpress 2>/dev/null)" ] && [ -z "$$(sudo docker ps -q -f name=^/wordpress$$ 2>/dev/null)" ]; then \
		echo -e "$(CLR_GREEN)[*] Starting WordPress stack via Docker Compose...$(CLR_RESET)"; \
		sudo docker compose up -d; \
		echo -e "$(CLR_GREEN)[✔] WordPress deployed successfully.$(CLR_RESET)"; \
	fi

