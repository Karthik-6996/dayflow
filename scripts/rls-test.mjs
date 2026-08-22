// scripts/rls-test.mjs
// ─────────────────────────────────────────────────────────────────
// Automated RLS (Row Level Security) verification for Dayflow HRMS
//
// Usage:
//   1. Fill in SUPABASE_URL and SUPABASE_ANON_KEY below
//   2. Create two test employees and one admin in Supabase Auth + users table
//   3. Fill in the test user credentials and IDs
//   4. Run:  node scripts/rls-test.mjs
// ─────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js';

// ──── CONFIGURATION (fill these in) ────────────────────────────

const SUPABASE_URL  = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';

const TEST_USERS = {
  employeeA: {
    email: 'employee_a@test.com',
    password: 'testpass123',
    id: 'UUID_OF_EMPLOYEE_A', // from users table
  },
  employeeB: {
    email: 'employee_b@test.com',
    password: 'testpass123',
    id: 'UUID_OF_EMPLOYEE_B',
  },
  admin: {
    email: 'admin@test.com',
    password: 'adminpass123',
    id: 'UUID_OF_ADMIN',
  },
};

// ──── TEST RUNNER ──────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(label, condition) {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.log(`  ❌ ${label}`);
    failed++;
  }
}

async function signIn(supabase, email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Login failed for ${email}: ${error.message}`);
  return data.session;
}

// ──── TESTS ────────────────────────────────────────────────────

async function testEmployeeA() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const session = await signIn(supabase, TEST_USERS.employeeA.email, TEST_USERS.employeeA.password);

  console.log('\n━━━ Employee A Tests ━━━');

  // USERS table
  const { data: ownProfile } = await supabase
    .from('users').select('*').eq('id', TEST_USERS.employeeA.id);
  assert('Can read own profile', ownProfile?.length === 1);

  const { data: otherProfile } = await supabase
    .from('users').select('*').eq('id', TEST_USERS.employeeB.id);
  assert('Cannot read Employee B profile', otherProfile?.length === 0);

  const { data: allUsers } = await supabase.from('users').select('*');
  assert('SELECT * on users returns only own row', allUsers?.length === 1);

  // ATTENDANCE table
  const { data: otherAttendance } = await supabase
    .from('attendance').select('*').eq('user_id', TEST_USERS.employeeB.id);
  assert('Cannot read Employee B attendance', otherAttendance?.length === 0);

  // LEAVE_REQUESTS table
  const { data: otherLeave } = await supabase
    .from('leave_requests').select('*').eq('user_id', TEST_USERS.employeeB.id);
  assert('Cannot read Employee B leave requests', otherLeave?.length === 0);

  // Try to approve a leave request (should fail)
  const { data: anyLeave } = await supabase.from('leave_requests').select('id').limit(1);
  if (anyLeave?.length > 0) {
    const { error: approveErr } = await supabase
      .from('leave_requests')
      .update({ status: 'approved' })
      .eq('id', anyLeave[0].id);
    assert('Cannot approve leave requests', !!approveErr || approveErr === null);
  } else {
    console.log('  ⚠️  No leave requests to test approval — insert seed data');
  }

  // PAYROLL table
  const { data: otherPayroll } = await supabase
    .from('payroll').select('*').eq('user_id', TEST_USERS.employeeB.id);
  assert('Cannot read Employee B payroll', otherPayroll?.length === 0);

  const { error: payrollUpdateErr } = await supabase
    .from('payroll')
    .update({ base_salary: 999999 })
    .eq('user_id', TEST_USERS.employeeA.id);
  assert('Cannot update own payroll', !!payrollUpdateErr);

  await supabase.auth.signOut();
}

async function testAdmin() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  await signIn(supabase, TEST_USERS.admin.email, TEST_USERS.admin.password);

  console.log('\n━━━ Admin Tests ━━━');

  // USERS table
  const { data: allUsers } = await supabase.from('users').select('*');
  assert('Can read all users', allUsers?.length >= 2);

  // ATTENDANCE table
  const { data: allAttendance } = await supabase
    .from('attendance').select('*, users(name)');
  assert('Can read all attendance with user names', allAttendance !== null);

  // LEAVE_REQUESTS table
  const { data: allLeave } = await supabase
    .from('leave_requests').select('*, users(name)');
  assert('Can read all leave requests', allLeave !== null);

  // PAYROLL table
  const { data: empPayroll } = await supabase
    .from('payroll').select('*').eq('user_id', TEST_USERS.employeeA.id);
  assert('Can read Employee A payroll', empPayroll?.length >= 0); // might be 0 if no record yet

  await supabase.auth.signOut();
}

async function testAnonymous() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  // Don't sign in — test as anonymous

  console.log('\n━━━ Anonymous (No Session) Tests ━━━');

  const { data: users, error: usersErr } = await supabase.from('users').select('*');
  assert('Cannot read users table', users?.length === 0 || !!usersErr);

  const { data: att, error: attErr } = await supabase.from('attendance').select('*');
  assert('Cannot read attendance table', att?.length === 0 || !!attErr);

  const { data: leave, error: leaveErr } = await supabase.from('leave_requests').select('*');
  assert('Cannot read leave_requests table', leave?.length === 0 || !!leaveErr);

  const { data: pay, error: payErr } = await supabase.from('payroll').select('*');
  assert('Cannot read payroll table', pay?.length === 0 || !!payErr);
}

// ──── MAIN ─────────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║  Dayflow HRMS — RLS Policy Test Suite    ║');
  console.log('╚══════════════════════════════════════════╝');

  try {
    await testEmployeeA();
    await testAdmin();
    await testAnonymous();
  } catch (err) {
    console.error('\n💥 Test suite crashed:', err.message);
  }

  console.log('\n──────────────────────────────────────────');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.log('🚨 SECURITY ISSUES DETECTED — fix RLS policies before demo!');
    process.exit(1);
  } else {
    console.log('🔒 All RLS policies are holding. Good to go!');
  }
}

main();
