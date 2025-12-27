# Database Setup for Project Aether: The Attention Wallet

This directory contains the SQL scripts needed to set up the Supabase database for the Attention Wallet application.

## Files

- `schema.sql` - Creates the main database tables, indexes, triggers, and functions
- `rls_policies.sql` - Sets up Row Level Security policies for data access control
- `README.md` - This file with setup instructions

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be fully initialized
3. Go to Settings > API to get your project URL and anon key
4. Update your `.env` file with the correct values:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_project_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

### 2. Run the Database Scripts

#### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `schema.sql` into a new query
4. Click "Run" to execute the schema creation
5. Copy and paste the contents of `rls_policies.sql` into a new query
6. Click "Run" to execute the RLS policies

#### Option B: Using Supabase CLI

1. Install the Supabase CLI: `npm install -g supabase`
2. Login to Supabase: `supabase login`
3. Link your project: `supabase link --project-ref your-project-ref`
4. Run the migrations:
   ```bash
   supabase db reset
   psql -h your-db-host -U postgres -d postgres -f schema.sql
   psql -h your-db-host -U postgres -d postgres -f rls_policies.sql
   ```

### 3. Verify the Setup

After running the scripts, you should have the following tables in your database:

- `profiles` - User profiles with role and token balance information
- `transactions` - All token earning and spending transactions
- `quest_types` - Configurable quest types for earning tokens
- `family_relationships` - Links between parent and child accounts

### 4. Test the Setup

You can test the setup by:

1. Creating a test user through your app's signup flow
2. Checking that a profile is automatically created
3. Verifying that RLS policies prevent unauthorized access
4. Testing transaction creation and balance updates

## Database Schema Overview

### Tables

#### profiles
- Stores user information including role (parent/child) and token balances
- Automatically created when a user signs up
- Balance is updated automatically via triggers when transactions are created

#### transactions
- Immutable audit trail of all token operations
- Includes proof images for earning transactions
- Automatically updates profile balances via triggers

#### quest_types
- Configurable tasks that children can complete to earn tokens
- Includes AI verification prompts for image analysis
- Can be managed by parents

#### family_relationships
- Links parent accounts to child accounts
- Enables parents to monitor multiple children
- Required for parent dashboard functionality

### Security Features

- **Row Level Security (RLS)**: Ensures users can only access their own data
- **Parent Monitoring**: Parents can view their children's data through family relationships
- **Immutable Transactions**: Prevents tampering with transaction history
- **Balance Validation**: Prevents spending more tokens than available
- **Role-based Access**: Different permissions for parents and children

### Triggers and Functions

- **Auto Profile Creation**: Creates profile when user signs up
- **Balance Updates**: Automatically updates balances when transactions are created
- **Spend Validation**: Prevents overdraft by validating balance before spend transactions
- **Timestamp Updates**: Automatically updates `updated_at` fields

## Troubleshooting

### Common Issues

1. **Permission Denied**: Make sure RLS policies are correctly applied
2. **Foreign Key Violations**: Ensure users exist in auth.users before creating profiles
3. **Balance Inconsistencies**: Check that triggers are properly installed
4. **Connection Issues**: Verify your Supabase URL and keys are correct

### Debugging Queries

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Check RLS policies
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- Check triggers
SELECT * FROM information_schema.triggers WHERE trigger_schema = 'public';

-- View profile balances
SELECT id, role, balance, total_earned, total_spent FROM profiles;

-- View recent transactions
SELECT * FROM transactions ORDER BY timestamp DESC LIMIT 10;
```

## Migration Notes

If you need to update the schema in the future:

1. Create new migration files with incremental changes
2. Test migrations on a development database first
3. Backup production data before applying migrations
4. Use Supabase's migration system for version control

## Security Considerations

- Never expose your service role key in client-side code
- Use the anon key for client connections
- Regularly review and audit RLS policies
- Monitor for unusual transaction patterns
- Keep Supabase and dependencies updated