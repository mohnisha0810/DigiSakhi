import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const testFile = path.join(rootDir, 'tests/qa_audit.test.ts');
const bundleOut = path.join(rootDir, '.tmp_test_bundle.mjs');

console.log('🔍 SafeSphere QA Test Runner: Compiling and bundling tests...');

try {
  // Use local esbuild to bundle TS test suite with dependencies
  const esbuildPath = path.join(rootDir, 'node_modules/.bin/esbuild');
  execSync(
    `"${esbuildPath}" "${testFile}" --bundle --platform=node --format=esm --define:import.meta.env="{}" --outfile="${bundleOut}"`,
    { stdio: 'inherit' }
  );

  console.log('🚀 Running SafeSphere Comprehensive Test Suite...\n');
  execSync(`node --test "${bundleOut}"`, { stdio: 'inherit' });
  console.log('\n✅ All SafeSphere QA tests completed successfully.');
} catch (err) {
  console.error('\n❌ QA test execution failed.');
  process.exit(1);
} finally {
  if (fs.existsSync(bundleOut)) {
    fs.unlinkSync(bundleOut);
  }
}
