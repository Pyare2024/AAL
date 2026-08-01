/**
 * Test Seed Factory with Unique Run ID Generation
 */
export function generateTestSeed(runId = `run_${Date.now()}`) {
  return {
    runId,
    internEmail: `test_intern_${runId}@apexlaunchpad.ai`,
    adminEmail: `test_admin_${runId}@apexlaunchpad.ai`,
    superAdminEmail: `test_superadmin_${runId}@apexlaunchpad.ai`,
    createInternPayload: {
      fullName: `Test Candidate ${runId}`,
      mobile: '+919876543210',
      accountStatus: 'pending',
    },
    createAdminPayload: {
      fullName: `Test Admin ${runId}`,
      mobile: '+919876543211',
      accountStatus: 'active',
    },
  };
}
