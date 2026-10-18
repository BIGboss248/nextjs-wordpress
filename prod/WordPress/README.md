# WordPress Deployment with Traefik SSL

Production-ready Docker Compose deployment for WordPress and MySQL 8.0, preconfigured for automatic SSL certificate generation and reverse proxy routing via Traefik.

---

## Architecture & Features

- **Traefik Reverse Proxy & Auto-SSL**:
  - Automatic Let's Encrypt certificate resolution via Traefik (`myresolver` HTTP-01 or `cloudflare_resolver` DNS-01).
  - Automated HTTP (`:80`) to HTTPS (`:443`) redirection.
  - Response compression (`gzip`/`brotli`/`zstd`) enabled for static assets and HTML.
  - Connected to the shared bridge network `my_network`.
- **Stand-alone (No Redis)**: Clean WordPress + MySQL deployment without Redis overhead.
- **PHP Performance & Upload Tuning**:
  - Custom [uploads.ini](file:///d:/Scripts/Tool-box/WordPress/uploads.ini) mounted to `/usr/local/etc/php/conf.d/uploads.ini` (64 MB upload limit, 256 MB memory limit, 300 s execution timeout).
- **Core Optimizations via `WORDPRESS_CONFIG_EXTRA`**:
  - `FS_METHOD = direct`: Install and update themes/plugins directly without FTP prompts.
  - `WP_MEMORY_LIMIT = 256M` & `WP_MAX_MEMORY_LIMIT = 512M`.
  - `WP_POST_REVISIONS = 5`: Prevents database bloat from excessive revisions.
  - `DISALLOW_FILE_EDIT = true`: Hardens WordPress security by disabling dashboard file editing.
  - `FORCE_SSL_ADMIN = true`: Forces HTTPS across the admin dashboard.
- **Headless & WPGraphQL JWT Authentication**:
  - `GRAPHQL_JWT_AUTH_SECRET_KEY`: Automatically injected secret for `wp-graphql-jwt-authentication` (enabling stateless token signing for decoupled frontends like Next.js).
- **MySQL 8.0 Optimization**:
  - Native authentication plugin compatibility and `utf8mb4` charset/collation.
  - Health checks with `service_healthy` dependency ensuring WordPress does not boot before MySQL is ready.

---

## Configuration (`.env`)

Copy `.env.example` to `.env` (or edit existing `.env`) and configure the following variables:

```env
# ==========================================
# Domain & Traefik Routing Configuration
# ==========================================
WORDPRESS_DOMAIN=example.com
CERT_RESOLVER=myresolver

# ==========================================
# Database Configuration
# ==========================================
WORDPRESS_DB_HOST=wordpress_db:3306
WORDPRESS_DB_NAME=wordpress_db
WORDPRESS_DB_USER=wordpress_user
WORDPRESS_DB_PASSWORD=ChangeThisToAStrongPassword123!
MYSQL_ROOT_PASSWORD=ChangeThisToAStrongRootPassword123!

# ==========================================
# WordPress Settings & Optimizations
# ==========================================
WORDPRESS_TABLE_PREFIX=wp_
WORDPRESS_DEBUG=0
WORDPRESS_CONFIG_EXTRA=define('FS_METHOD', 'direct'); define('WP_MEMORY_LIMIT', '256M'); define('WP_MAX_MEMORY_LIMIT', '512M'); define('WP_POST_REVISIONS', 5); define('DISALLOW_FILE_EDIT', true); define('FORCE_SSL_ADMIN', true);

# ==========================================
# WordPress Authentication Keys & Salts
# ==========================================
# Generate random keys at: https://api.wordpress.org/secret-key/1.1/salt/
WORDPRESS_AUTH_KEY=put_your_unique_phrase_here
WORDPRESS_SECURE_AUTH_KEY=put_your_unique_phrase_here
WORDPRESS_LOGGED_IN_KEY=put_your_unique_phrase_here
WORDPRESS_NONCE_KEY=put_your_unique_phrase_here
WORDPRESS_AUTH_SALT=put_your_unique_phrase_here
WORDPRESS_SECURE_AUTH_SALT=put_your_unique_phrase_here
WORDPRESS_LOGGED_IN_SALT=put_your_unique_phrase_here
WORDPRESS_NONCE_SALT=put_your_unique_phrase_here

# ==========================================
# WPGraphQL & Headless JWT Authentication
# ==========================================
GRAPHQL_JWT_AUTH_SECRET_KEY=put_your_super_strong_graphql_jwt_secret_here
```

---

---

## Quick Start with Makefile (Automated & Interactive)

The included [Makefile](file:///d:/Scripts/Tool-box/WordPress/Makefile) automates initialization, generates cryptographically strong random database passwords, generates 8 unique WordPress security keys and salts, verifies Docker network dependencies, and configures `.env` interactively:

```bash
# Complete end-to-end interactive setup & container launch
make install-wordpress
```

### Available Makefile Commands

| Command | Description |
| :--- | :--- |
| `make setup-all` | Interactive setup for domain, cert resolver, DB user, passwords, salts, and JWT secret |
| `make install-wordpress` | Runs `setup-all` and launches containers in detached mode |
| `make setup-domain` | Configure WordPress domain name |
| `make setup-resolver` | Select TLS resolver (`myresolver` for Let's Encrypt or `cloudflare_resolver`) |
| `make setup-db-user` | Set database user (default: `wordpress_user`) |
| `make setup-db-passwords` | Auto-generate strong random passwords for DB user & MySQL root |
| `make setup-salts` | Auto-generate 8 cryptographically strong WordPress security keys & salts |
| `make setup-jwt-secret` | Auto-generate strong 64-char secret for WPGraphQL JWT Authentication |
| `make report` | Print a color-coded status box of all variables, networks, and containers |
| `make restart` | Recreate and restart containers |
| `make backup-db` | Generate a timestamped MySQL dump in `./backups/` |
| `make status` | Check status of WordPress and MySQL containers |
| `make logs` | Follow live container logs |
| `make down` | Stop and remove WordPress stack containers |

---

## Manual Getting Started

1. **Verify Traefik is running** on `my_network`:
   ```bash
   docker network ls | grep my_network
   ```

2. **Adjust `.env`** with your domain name and database passwords:
   - Generate unique WordPress salt keys from [WordPress Salt Generator](https://api.wordpress.org/secret-key/1.1/salt/) and paste them into `.env`.

3. **Start the containers**:
   ```bash
   docker compose up -d
   ```

4. **Verify Container Health**:
   ```bash
   docker compose ps
   ```

5. **Browse to your domain**:
   Navigate to `https://your-domain.com` to complete the initial WordPress installation wizard.

