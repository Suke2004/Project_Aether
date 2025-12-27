-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
-- Stores user profile information including role and token balances
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('parent', 'child')),
  balance INTEGER DEFAULT 0 CHECK (balance >= 0),
  total_earned INTEGER DEFAULT 0 CHECK (total_earned >= 0),
  total_spent INTEGER DEFAULT 0 CHECK (total_spent >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create transactions table
-- Stores all token earning and spending transactions
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount > 0),
  type TEXT NOT NULL CHECK (type IN ('earn', 'spend')),
  description TEXT NOT NULL,
  proof_image_url TEXT,
  app_name TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create quest_types table
-- Stores configurable quest types that children can complete
CREATE TABLE IF NOT EXISTS quest_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  token_reward INTEGER NOT NULL CHECK (token_reward > 0),
  verification_prompt TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_quest_types_active ON quest_types(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at timestamps
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quest_types_updated_at 
  BEFORE UPDATE ON quest_types 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically create profile after user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, balance, total_earned, total_spent)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'child'),
    0,
    0,
    0
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update profile balance after transaction
CREATE OR REPLACE FUNCTION update_profile_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'earn' THEN
    UPDATE profiles 
    SET 
      balance = balance + NEW.amount,
      total_earned = total_earned + NEW.amount,
      updated_at = NOW()
    WHERE id = NEW.user_id;
  ELSIF NEW.type = 'spend' THEN
    UPDATE profiles 
    SET 
      balance = balance - NEW.amount,
      total_spent = total_spent + NEW.amount,
      updated_at = NOW()
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update balance after transaction
CREATE TRIGGER on_transaction_created
  AFTER INSERT ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_profile_balance();

-- Create function to validate transaction amount against balance for spend transactions
CREATE OR REPLACE FUNCTION validate_spend_transaction()
RETURNS TRIGGER AS $$
DECLARE
  current_balance INTEGER;
BEGIN
  IF NEW.type = 'spend' THEN
    SELECT balance INTO current_balance 
    FROM profiles 
    WHERE id = NEW.user_id;
    
    IF current_balance < NEW.amount THEN
      RAISE EXCEPTION 'Insufficient balance. Current balance: %, Required: %', current_balance, NEW.amount;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to validate spend transactions
CREATE TRIGGER validate_spend_before_insert
  BEFORE INSERT ON transactions
  FOR EACH ROW EXECUTE FUNCTION validate_spend_transaction();

-- Insert default quest types
INSERT INTO quest_types (name, description, token_reward, verification_prompt, is_active) VALUES
  ('Clean Room', 'Take a photo of your clean and organized bedroom', 25, 'Analyze this image to verify that a bedroom is clean and organized. Look for made bed, organized items, clean surfaces, and no clutter on the floor.', true),
  ('Make Bed', 'Take a photo of your neatly made bed', 10, 'Analyze this image to verify that a bed is properly made with sheets pulled tight, pillows arranged neatly, and blankets/comforter smoothed out.', true),
  ('Do Dishes', 'Take a photo of clean dishes in the drying rack or dishwasher', 20, 'Analyze this image to verify that dishes have been washed and are either in a drying rack, dishwasher, or put away clean. Look for clean, soap-free dishes.', true),
  ('Take Out Trash', 'Take a photo of the empty trash can with a new bag', 15, 'Analyze this image to verify that trash has been taken out. Look for an empty trash can with a fresh garbage bag installed.', true),
  ('Homework Complete', 'Take a photo of your completed homework assignment', 30, 'Analyze this image to verify that homework or study materials are visible and appear to show completed work, such as filled-out worksheets, written assignments, or study notes.', true),
  ('Exercise Activity', 'Take a photo showing you completed 15+ minutes of physical activity', 35, 'Analyze this image to verify evidence of physical activity such as exercise equipment being used, sports gear, workout clothes, or outdoor activity setup.', true),
  ('Read for 30 Minutes', 'Take a photo of yourself with the book you just finished reading', 40, 'Analyze this image to verify reading activity. Look for a person with an open book, reading materials, or evidence of reading time such as bookmarks or reading notes.', true),
  ('Help with Cooking', 'Take a photo of the meal you helped prepare', 25, 'Analyze this image to verify cooking or meal preparation activity. Look for prepared food, cooking utensils being used, or ingredients that have been prepared.', true)
ON CONFLICT DO NOTHING;