-- Row Level Security (RLS) policies for Project Aether: The Attention Wallet
-- These policies ensure users can only access their own data and parents can monitor their children

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quest_types ENABLE ROW LEVEL SECURITY;

-- Profiles table policies
-- Users can view and update their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Parents can view child profiles (this would require additional logic to link parent-child relationships)
-- For now, we'll implement basic self-access and extend later for family relationships
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Transactions table policies
-- Users can view their own transactions
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own transactions
CREATE POLICY "Users can insert own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Prevent users from updating or deleting transactions (immutable audit trail)
CREATE POLICY "Transactions are immutable" ON transactions
  FOR UPDATE USING (false);

CREATE POLICY "Transactions cannot be deleted" ON transactions
  FOR DELETE USING (false);

-- Quest types table policies
-- All authenticated users can view active quest types
CREATE POLICY "Users can view active quest types" ON quest_types
  FOR SELECT USING (is_active = true AND auth.role() = 'authenticated');

-- Only parents can manage quest types
CREATE POLICY "Parents can manage quest types" ON quest_types
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'parent'
    )
  );

-- Create additional helper functions for RLS
-- Function to check if user is a parent
CREATE OR REPLACE FUNCTION is_parent()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'parent'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is a child
CREATE OR REPLACE FUNCTION is_child()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'child'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create family relationships table for parent-child associations
-- This allows parents to monitor multiple children
CREATE TABLE IF NOT EXISTS family_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(parent_id, child_id),
  CHECK (parent_id != child_id)
);

-- Enable RLS on family relationships
ALTER TABLE family_relationships ENABLE ROW LEVEL SECURITY;

-- Family relationships policies
-- Parents can view their family relationships
CREATE POLICY "Parents can view family relationships" ON family_relationships
  FOR SELECT USING (auth.uid() = parent_id);

-- Parents can create family relationships
CREATE POLICY "Parents can create family relationships" ON family_relationships
  FOR INSERT WITH CHECK (
    auth.uid() = parent_id AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'parent'
    )
  );

-- Parents can delete family relationships
CREATE POLICY "Parents can delete family relationships" ON family_relationships
  FOR DELETE USING (auth.uid() = parent_id);

-- Enhanced policies for parent monitoring
-- Parents can view their children's profiles
CREATE POLICY "Parents can view children profiles" ON profiles
  FOR SELECT USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM family_relationships 
      WHERE parent_id = auth.uid() 
      AND child_id = profiles.id
    )
  );

-- Parents can view their children's transactions
CREATE POLICY "Parents can view children transactions" ON transactions
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM family_relationships 
      WHERE parent_id = auth.uid() 
      AND child_id = transactions.user_id
    )
  );

-- Create indexes for family relationships
CREATE INDEX IF NOT EXISTS idx_family_relationships_parent ON family_relationships(parent_id);
CREATE INDEX IF NOT EXISTS idx_family_relationships_child ON family_relationships(child_id);

-- Function to add child to parent's family
CREATE OR REPLACE FUNCTION add_child_to_family(parent_email TEXT, child_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  parent_user_id UUID;
  child_user_id UUID;
BEGIN
  -- Get parent user ID
  SELECT au.id INTO parent_user_id
  FROM auth.users au
  JOIN profiles p ON au.id = p.id
  WHERE au.email = parent_email AND p.role = 'parent';
  
  -- Get child user ID
  SELECT au.id INTO child_user_id
  FROM auth.users au
  JOIN profiles p ON au.id = p.id
  WHERE au.email = child_email AND p.role = 'child';
  
  -- Check if both users exist
  IF parent_user_id IS NULL OR child_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Insert family relationship
  INSERT INTO family_relationships (parent_id, child_id)
  VALUES (parent_user_id, child_user_id)
  ON CONFLICT (parent_id, child_id) DO NOTHING;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get children for a parent
CREATE OR REPLACE FUNCTION get_parent_children(parent_user_id UUID)
RETURNS TABLE (
  child_id UUID,
  child_role TEXT,
  child_balance INTEGER,
  child_total_earned INTEGER,
  child_total_spent INTEGER,
  child_created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.role,
    p.balance,
    p.total_earned,
    p.total_spent,
    p.created_at
  FROM profiles p
  JOIN family_relationships fr ON p.id = fr.child_id
  WHERE fr.parent_id = parent_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for parent dashboard data
CREATE OR REPLACE VIEW parent_dashboard_view AS
SELECT 
  fr.parent_id,
  p.id as child_id,
  p.balance as child_balance,
  p.total_earned as child_total_earned,
  p.total_spent as child_total_spent,
  COUNT(t.id) as transaction_count,
  MAX(t.timestamp) as last_activity
FROM family_relationships fr
JOIN profiles p ON fr.child_id = p.id
LEFT JOIN transactions t ON p.id = t.user_id
GROUP BY fr.parent_id, p.id, p.balance, p.total_earned, p.total_spent;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;