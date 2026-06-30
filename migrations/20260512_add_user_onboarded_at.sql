-- Add onboarded_at flag to users so profesor onboarding flow can be tracked
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarded_at TIMESTAMPTZ;
