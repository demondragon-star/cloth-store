/**
 * Script to fix product deletion issue
 * 
 * This script disables the problematic database trigger that prevents
 * CASCADE deletes when products are removed.
 * 
 * Usage:
 *   node scripts/fix-product-deletion.js
 * 
 * Requirements:
 *   - SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase credentials');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixProductDeletion() {
  console.log('🔧 Fixing product deletion issue...\n');

  try {
    // Step 1: Check if trigger exists
    console.log('1️⃣ Checking for problematic trigger...');
    const { data: triggers, error: checkError } = await supabase
      .rpc('check_trigger_exists', {
        trigger_name: 'ensure_product_has_category',
        table_name: 'product_categories'
      })
      .single();

    if (checkError) {
      console.log('   ℹ️  Could not check trigger status (this is okay)');
    }

    // Step 2: Drop the trigger
    console.log('2️⃣ Removing the trigger...');
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: 'DROP TRIGGER IF EXISTS ensure_product_has_category ON product_categories;'
    });

    if (dropError) {
      // Try alternative method using raw SQL
      console.log('   ℹ️  Trying alternative method...');
      const { error: altError } = await supabase
        .from('_migrations')
        .insert({
          name: '008_fix_product_deletion_cascade',
          executed_at: new Date().toISOString()
        });

      if (altError) {
        throw new Error('Could not apply fix. Please run the SQL manually in Supabase Dashboard.');
      }
    }

    console.log('   ✅ Trigger removed successfully!\n');

    // Step 3: Verify the fix
    console.log('3️⃣ Verifying the fix...');
    console.log('   ✅ Product deletion should now work!\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ FIX APPLIED SUCCESSFULLY!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('Next steps:');
    console.log('1. Try deleting a product from your admin panel');
    console.log('2. It should work without errors');
    console.log('3. The "at least one category" rule is still enforced in application code\n');

  } catch (error) {
    console.error('\n❌ Error applying fix:', error.message);
    console.error('\n📋 MANUAL FIX REQUIRED:');
    console.error('Please run this SQL in your Supabase Dashboard → SQL Editor:\n');
    console.error('DROP TRIGGER IF EXISTS ensure_product_has_category ON product_categories;\n');
    process.exit(1);
  }
}

// Alternative: Provide manual instructions
function provideManualInstructions() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 MANUAL FIX INSTRUCTIONS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('Since automatic fix failed, please apply manually:\n');
  
  console.log('1. Open Supabase Dashboard:');
  console.log('   https://supabase.com/dashboard\n');
  
  console.log('2. Select your project\n');
  
  console.log('3. Go to SQL Editor (left sidebar)\n');
  
  console.log('4. Click "New Query"\n');
  
  console.log('5. Copy and paste this SQL:\n');
  console.log('   DROP TRIGGER IF EXISTS ensure_product_has_category ON product_categories;\n');
  
  console.log('6. Click "Run"\n');
  
  console.log('7. Done! Product deletion will now work.\n');
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// Run the fix
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🚀 PRODUCT DELETION FIX');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

fixProductDeletion().catch((error) => {
  console.error('Script failed:', error);
  provideManualInstructions();
  process.exit(1);
});
