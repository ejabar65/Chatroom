-- Add bio/description field to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add a check constraint to limit bio length
ALTER TABLE users ADD CONSTRAINT bio_length_check CHECK (char_length(bio) <= 500);
