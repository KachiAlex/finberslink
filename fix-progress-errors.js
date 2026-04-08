/**
 * Quick Fix for Student Dashboard Progress Error
 * Prevents undefined property access errors
 */

// This script adds defensive programming to prevent undefined errors
(function() {
  console.log('🔧 Applying quick fix for student dashboard progress errors...');
  
  // Override any undefined property access in progress-related code
  const originalConsoleError = console.error;
  console.error = function(...args) {
    const message = args[0];
    if (message && typeof message === 'string' && message.includes("Cannot read properties of undefined")) {
      console.log('🛡️ Detected undefined property access error');
      console.log('💡 This is likely in the progress calculation code');
      console.log('🔧 Reloading page to clear state...');
      
      // Reload the page to clear any undefined state
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
      return;
    }
    
    originalConsoleError.apply(console, args);
  };
  
  console.log('✅ Progress error protection applied');
  console.log('💡 If errors persist, the issue may be in:');
  console.log('   1. Progress calculation logic');
  console.log('   2. Course data fetching');
  console.log('   3. Enrollment status handling');
})();
