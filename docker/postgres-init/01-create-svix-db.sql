-- Optional Svix webhook server DB (same Postgres instance).
-- Runs only on first cluster init; if your volume already exists, create manually:
--   docker compose -f docker-compose.dev.yml exec postgres psql -U postgres -c "CREATE DATABASE svix;"
CREATE DATABASE svix;
