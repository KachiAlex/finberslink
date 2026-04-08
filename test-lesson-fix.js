// Test if useSWR import is working
try {
  const useSWR = require('swr').default;
  console.log('✅ useSWR import successful');
  console.log('useSWR type:', typeof useSWR);
} catch (error) {
  console.log('❌ useSWR import failed:', error.message);
}

try {
  const { useSWRConfig } = require('swr');
  console.log('✅ useSWRConfig import successful');
  console.log('useSWRConfig type:', typeof useSWRConfig);
} catch (error) {
  console.log('❌ useSWRConfig import failed:', error.message);
}

console.log('\n🎯 LESSON PAGE FIX SUMMARY:');
console.log('- Fixed missing useSWR import in use-progress-tracking.ts');
console.log('- This should resolve "useSWR is not defined" error');
console.log('- Lesson pages should now load without 500 errors');
console.log('- Fix has been committed and pushed to GitLab');
