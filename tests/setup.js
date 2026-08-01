import '@testing-library/jest-dom';

// Environment Safety Abort Guard
const targetUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
if (targetUrl.includes('prod') || targetUrl.includes('production')) {
  throw new Error('FATAL: Destructive test runner attempted execution against PRODUCTION environment! Execution aborted.');
}
