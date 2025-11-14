-- Create increment function for updating counts
CREATE OR REPLACE FUNCTION increment(
  table_name text,
  row_id uuid,
  column_name text
)
RETURNS void AS $$
BEGIN
  EXECUTE format('UPDATE %I SET %I = COALESCE(%I, 0) + 1 WHERE id = $1', table_name, column_name, column_name)
  USING row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create decrement function for updating counts
CREATE OR REPLACE FUNCTION decrement(
  table_name text,
  row_id uuid,
  column_name text
)
RETURNS void AS $$
BEGIN
  EXECUTE format('UPDATE %I SET %I = GREATEST(COALESCE(%I, 0) - 1, 0) WHERE id = $1', table_name, column_name, column_name)
  USING row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
