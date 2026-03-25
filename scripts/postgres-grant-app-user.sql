-- Fix Prisma P1010: User was denied access on database ... public
--
-- Prerequisites (run in psql as superuser if missing):
--   CREATE USER doddapanenigroup WITH PASSWORD 'same_password_as_in_DATABASE_URL';
--   CREATE DATABASE doddapaneni_group OWNER doddapanenigroup;
--
-- Then run this file as superuser, e.g.:
--   psql -U postgres -h localhost -d postgres -v ON_ERROR_STOP=1 -f scripts/postgres-grant-app-user.sql
--
-- PostgreSQL 15+ restricts schema public for non-owners; grants below allow Prisma db push / migrate.

GRANT CONNECT ON DATABASE doddapaneni_group TO doddapanenigroup;

\c doddapaneni_group

GRANT USAGE, CREATE ON SCHEMA public TO doddapanenigroup;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO doddapanenigroup;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO doddapanenigroup;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO doddapanenigroup;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO doddapanenigroup;
