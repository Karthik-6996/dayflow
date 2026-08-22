// scripts/validate-schema.mjs
// ─────────────────────────────────────────────────────────────────
// Compares the shared schema contract (src/lib/schema.js) against
// the actual Supabase tables. Run this when integrating to catch
// column mismatches, missing fields, or schema drift.
//
// Usage:
//   1. Fill in SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY below
//   2. Ensure at least one row exists in each table (seed data)
//   3. Run:  node scripts/validate-schema.mjs
// ─────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js';
import { TABLES } from '../src/lib/schema.js';

// ──── CONFIGURATION ────────────────────────────────────────────

const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'YOUR_SERVICE_ROLE_KEY'; // bypasses RLS for inspection

// ──── VALIDATION ───────────────────────────────────────────────

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function validateSchema() {
  const issues = [];
  const warnings = [];

  console.log('╔══════════════════════════════════════════╗');
  console.log('║  Dayflow HRMS — Schema Validation        ║');
  console.log('╚══════════════════════════════════════════╝\n');

  for (const [table, spec] of Object.entries(TABLES)) {
    console.log(`Checking table: ${table}...`);

    const { data, error } = await supabase.from(table).select('*').limit(1);

    if (error) {
      issues.push(`❌ ${table}: query failed — ${error.message}`);
      continue;
    }

    if (!data || data.length === 0) {
      warnings.push(`⚠️  ${table}: empty — insert seed data to validate columns`);
      continue;
    }

    const actualColumns = Object.keys(data[0]);

    // Columns in contract but missing from DB
    const missing = spec.columns.filter(c => !actualColumns.includes(c));
    if (missing.length) {
      issues.push(`❌ ${table}: missing columns: ${missing.join(', ')}`);
    }

    // Columns in DB but not in contract (might be intentional, e.g., created_at)
    const extra = actualColumns.filter(c => !spec.columns.includes(c));
    if (extra.length) {
      warnings.push(`⚠️  ${table}: extra columns not in contract: ${extra.join(', ')}`);
    }

    // Validate enum values in existing data
    for (const [field, allowed] of Object.entries(spec.enums)) {
      const val = data[0][field];
      if (val !== undefined && val !== null && !allowed.includes(val)) {
        issues.push(`❌ ${table}.${field}: found value "${val}" — expected one of: ${allowed.join(', ')}`);
      }
    }

    if (missing.length === 0) {
      console.log(`  ✅ All expected columns present`);
    }
  }

  // ── Results ──
  console.log('\n══════════════════════════════════════════');

  if (warnings.length > 0) {
    console.log('\nWarnings:');
    warnings.forEach(w => console.log(`  ${w}`));
  }

  if (issues.length > 0) {
    console.log('\nErrors:');
    issues.forEach(i => console.log(`  ${i}`));
    console.log(`\n🚨 ${issues.length} issue(s) found — fix before integration!`);
    process.exit(1);
  } else {
    console.log('\n✅ Schema validation passed! Contract matches Supabase.');
  }
}

validateSchema();
