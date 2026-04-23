-- Languages (en, te, hi) configurable per role for careers applications.
ALTER TABLE "career_job" ADD COLUMN "apply_language_codes_csv" TEXT NOT NULL DEFAULT 'en,te,hi';
