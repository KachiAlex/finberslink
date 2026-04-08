/**
 * Practical Course Detail Page Functionality Test
 * Tests can be run manually or automated
 */

const fs = require('fs');
const path = require('path');

class CourseDetailPracticalTest {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      warnings: 0,
      details: []
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = type === 'success' ? 'PASS' : type === 'error' ? 'FAIL' : type === 'warning' ? 'WARN' : 'INFO';
    console.log(`[${timestamp}] ${prefix}: ${message}`);
    this.testResults.details.push({ timestamp, type, message });
  }

  async runAllTests() {
    this.log('Starting Course Detail Page Practical Tests');
    this.log('='.repeat(60));

    try {
      // Test 1: File Structure Verification
      await this.testFileStructure();
      
      // Test 2: Component Imports
      await this.testComponentImports();
      
      // Test 3: Syntax Validation
      await this.testSyntaxValidation();
      
      // Test 4: Required Elements Check
      await this.testRequiredElements();
      
      // Test 5: Tab Components Check
      await this.testTabComponents();
      
      // Test 6: Button and Link Elements
      await this.testButtonsAndLinks();
      
      // Test 7: Responsive Design Classes
      await this.testResponsiveClasses();
      
      // Test 8: Accessibility Features
      await this.testAccessibilityFeatures();
      
      // Test 9: Error Handling
      await this.testErrorHandling();
      
      // Test 10: Performance Considerations
      await this.testPerformanceConsiderations();
      
    } catch (error) {
      this.log(`Test suite error: ${error.message}`, 'error');
    }
    
    this.generateReport();
  }

  async testFileStructure() {
    this.log('Testing file structure...');
    
    const requiredFiles = [
      'src/app/courses/[courseId]/page.tsx',
      'src/features/course/components/course-overview-tab.tsx',
      'src/features/course/components/course-curriculum-tab.tsx',
      'src/features/course/components/course-reviews-tab.tsx',
      'src/features/course/components/course-resources-tab.tsx'
    ];

    for (const file of requiredFiles) {
      try {
        const filePath = path.join(__dirname, file);
        if (fs.existsSync(filePath)) {
          this.log(`File exists: ${file}`, 'success');
          this.testResults.passed++;
        } else {
          this.log(`File missing: ${file}`, 'error');
          this.testResults.failed++;
        }
      } catch (error) {
        this.log(`File check error for ${file}: ${error.message}`, 'error');
        this.testResults.failed++;
      }
    }
  }

  async testComponentImports() {
    this.log('Testing component imports...');
    
    const mainPagePath = path.join(__dirname, 'src/app/courses/[courseId]/page.tsx');
    
    try {
      if (fs.existsSync(mainPagePath)) {
        const content = fs.readFileSync(mainPagePath, 'utf8');
        
        const requiredImports = [
          'CourseOverviewTab',
          'CourseCurriculumTab', 
          'CourseReviewsTab',
          'CourseResourcesTab',
          'Tabs, TabsContent, TabsList, TabsTrigger'
        ];

        for (const importName of requiredImports) {
          if (content.includes(importName)) {
            this.log(`Import found: ${importName}`, 'success');
            this.testResults.passed++;
          } else {
            this.log(`Import missing: ${importName}`, 'error');
            this.testResults.failed++;
          }
        }
      } else {
        this.log('Main page file not found for import testing', 'error');
        this.testResults.failed++;
      }
    } catch (error) {
      this.log(`Import test error: ${error.message}`, 'error');
      this.testResults.failed++;
    }
  }

  async testSyntaxValidation() {
    this.log('Testing syntax validation...');
    
    const files = [
      'src/app/courses/[courseId]/page.tsx',
      'src/features/course/components/course-overview-tab.tsx',
      'src/features/course/components/course-curriculum-tab.tsx',
      'src/features/course/components/course-reviews-tab.tsx',
      'src/features/course/components/course-resources-tab.tsx'
    ];

    for (const file of files) {
      try {
        const filePath = path.join(__dirname, file);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          
          // Basic syntax checks
          const hasOpeningBraces = (content.match(/\{/g) || []).length;
          const hasClosingBraces = (content.match(/\}/g) || []).length;
          
          if (hasOpeningBraces === hasClosingBraces) {
            this.log(`Syntax valid: ${file}`, 'success');
            this.testResults.passed++;
          } else {
            this.log(`Syntax error in ${file}: Brace mismatch`, 'error');
            this.testResults.failed++;
          }
          
          // Check for TypeScript syntax
          if (file.endsWith('.tsx')) {
            if (content.includes('interface') || content.includes('type') || content.includes('React')) {
              this.log(`TypeScript syntax found in: ${file}`, 'success');
            } else {
              this.log(`TypeScript syntax minimal in: ${file}`, 'warning');
              this.testResults.warnings++;
            }
          }
        }
      } catch (error) {
        this.log(`Syntax validation error for ${file}: ${error.message}`, 'error');
        this.testResults.failed++;
      }
    }
  }

  async testRequiredElements() {
    this.log('Testing required page elements...');
    
    const mainPagePath = path.join(__dirname, 'src/app/courses/[courseId]/page.tsx');
    
    try {
      if (fs.existsSync(mainPagePath)) {
        const content = fs.readFileSync(mainPagePath, 'utf8');
        
        const requiredElements = [
          { name: 'Course Title', selector: 'text-4xl font-bold text-gray-900' },
          { name: 'Course Description', selector: 'text-lg text-gray-600' },
          { name: 'Progress Card', selector: 'border-gray-200 shadow-sm' },
          { name: 'Start Learning Button', selector: 'bg-blue-600 hover:bg-blue-700' },
          { name: 'Tab Navigation', selector: 'TabsList' },
          { name: 'Light Theme Background', selector: 'bg-gray-50' },
          { name: 'White Header Section', selector: 'bg-white border-b' }
        ];

        for (const element of requiredElements) {
          if (content.includes(element.selector)) {
            this.log(`Element found: ${element.name}`, 'success');
            this.testResults.passed++;
          } else {
            this.log(`Element missing: ${element.name}`, 'error');
            this.testResults.failed++;
          }
        }
      }
    } catch (error) {
      this.log(`Required elements test error: ${error.message}`, 'error');
      this.testResults.failed++;
    }
  }

  async testTabComponents() {
    this.log('Testing tab components...');
    
    const tabFiles = [
      { file: 'src/features/course/components/course-overview-tab.tsx', name: 'Overview' },
      { file: 'src/features/course/components/course-curriculum-tab.tsx', name: 'Curriculum' },
      { file: 'src/features/course/components/course-reviews-tab.tsx', name: 'Reviews' },
      { file: 'src/features/course/components/course-resources-tab.tsx', name: 'Resources' }
    ];

    for (const tab of tabFiles) {
      try {
        const filePath = path.join(__dirname, tab.file);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          
          // Check for component structure
          const hasExport = content.includes('export function');
          const hasProps = content.includes('interface') || content.includes('props');
          const hasReturn = content.includes('return (');
          
          if (hasExport && hasReturn) {
            this.log(`Tab component valid: ${tab.name}`, 'success');
            this.testResults.passed++;
          } else {
            this.log(`Tab component invalid: ${tab.name}`, 'error');
            this.testResults.failed++;
          }
          
          // Check for specific content
          if (tab.name === 'Overview') {
            const hasOverviewContent = content.includes('What You\'ll Learn') || content.includes('Key Skills');
            if (hasOverviewContent) {
              this.log(`Overview content found`, 'success');
              this.testResults.passed++;
            } else {
              this.log(`Overview content missing`, 'warning');
              this.testResults.warnings++;
            }
          }
        } else {
          this.log(`Tab file missing: ${tab.file}`, 'error');
          this.testResults.failed++;
        }
      } catch (error) {
        this.log(`Tab component test error for ${tab.name}: ${error.message}`, 'error');
        this.testResults.failed++;
      }
    }
  }

  async testButtonsAndLinks() {
    this.log('Testing buttons and links...');
    
    const mainPagePath = path.join(__dirname, 'src/app/courses/[courseId]/page.tsx');
    
    try {
      if (fs.existsSync(mainPagePath)) {
        const content = fs.readFileSync(mainPagePath, 'utf8');
        
        const buttonTests = [
          { name: 'Start Learning Button', pattern: /Start Learning|Continue Learning/ },
          { name: 'Share Button', pattern: /Share/ },
          { name: 'Download Button', pattern: /Download/ },
          { name: 'Certificate Button', pattern: /Certificate/ },
          { name: 'Tab Navigation Buttons', pattern: /TabsTrigger/ }
        ];

        for (const button of buttonTests) {
          if (button.pattern.test(content)) {
            this.log(`Button found: ${button.name}`, 'success');
            this.testResults.passed++;
          } else {
            this.log(`Button missing: ${button.name}`, 'error');
            this.testResults.failed++;
          }
        }
        
        // Check for Link components
        const linkCount = (content.match(/Link href=/g) || []).length;
        if (linkCount > 0) {
          this.log(`Navigation links found: ${linkCount}`, 'success');
          this.testResults.passed++;
        } else {
          this.log('Navigation links missing', 'warning');
          this.testResults.warnings++;
        }
      }
    } catch (error) {
      this.log(`Button test error: ${error.message}`, 'error');
      this.testResults.failed++;
    }
  }

  async testResponsiveClasses() {
    this.log('Testing responsive design classes...');
    
    const files = [
      'src/app/courses/[courseId]/page.tsx',
      'src/features/course/components/course-overview-tab.tsx',
      'src/features/course/components/course-curriculum-tab.tsx'
    ];

    const responsiveClasses = [
      'md:grid-cols-2',
      'md:grid-cols-3',
      'lg:grid-cols-3',
      'lg:col-span-2',
      'flex-wrap',
      'gap-4',
      'gap-6',
      'gap-8'
    ];

    for (const file of files) {
      try {
        const filePath = path.join(__dirname, file);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          
          let foundResponsiveClasses = 0;
          for (const cls of responsiveClasses) {
            if (content.includes(cls)) {
              foundResponsiveClasses++;
            }
          }
          
          if (foundResponsiveClasses >= 3) {
            this.log(`Responsive design good: ${path.basename(file)}`, 'success');
            this.testResults.passed++;
          } else {
            this.log(`Responsive design limited: ${path.basename(file)} (${foundResponsiveClasses} classes)`, 'warning');
            this.testResults.warnings++;
          }
        }
      } catch (error) {
        this.log(`Responsive test error: ${error.message}`, 'error');
        this.testResults.failed++;
      }
    }
  }

  async testAccessibilityFeatures() {
    this.log('Testing accessibility features...');
    
    const mainPagePath = path.join(__dirname, 'src/app/courses/[courseId]/page.tsx');
    
    try {
      if (fs.existsSync(mainPagePath)) {
        const content = fs.readFileSync(mainPagePath, 'utf8');
        
        const accessibilityFeatures = [
          { name: 'Semantic HTML5', pattern: /section|main|header|nav|article/ },
          { name: 'ARIA Labels', pattern: /aria-|role=/ },
          { name: 'Button Types', pattern: /button type=/ },
          { name: 'Alt Text Pattern', pattern: /alt=/ },
          { name: 'Heading Hierarchy', pattern: /h1|h2|h3|h4/ }
        ];

        for (const feature of accessibilityFeatures) {
          if (feature.pattern.test(content)) {
            this.log(`Accessibility feature found: ${feature.name}`, 'success');
            this.testResults.passed++;
          } else {
            this.log(`Accessibility feature missing: ${feature.name}`, 'warning');
            this.testResults.warnings++;
          }
        }
      }
    } catch (error) {
      this.log(`Accessibility test error: ${error.message}`, 'error');
      this.testResults.failed++;
    }
  }

  async testErrorHandling() {
    this.log('Testing error handling...');
    
    const files = [
      'src/app/courses/[courseId]/page.tsx',
      'src/features/course/components/course-overview-tab.tsx'
    ];

    for (const file of files) {
      try {
        const filePath = path.join(__dirname, file);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          
          const errorHandling = [
            { name: 'Try-Catch Blocks', pattern: /try\s*{|catch\s*\(/ },
            { name: 'Error Boundaries', pattern: /ErrorBoundary|componentDidCatch/ },
            { name: 'Null Checks', pattern: /\?\./ },
            { name: 'Default Values', pattern: /\|\||\??:/ }
          ];

          let foundErrorHandling = 0;
          for (const handling of errorHandling) {
            if (handling.pattern.test(content)) {
              foundErrorHandling++;
            }
          }

          if (foundErrorHandling >= 2) {
            this.log(`Error handling adequate: ${path.basename(file)}`, 'success');
            this.testResults.passed++;
          } else {
            this.log(`Error handling limited: ${path.basename(file)}`, 'warning');
            this.testResults.warnings++;
          }
        }
      } catch (error) {
        this.log(`Error handling test error: ${error.message}`, 'error');
        this.testResults.failed++;
      }
    }
  }

  async testPerformanceConsiderations() {
    this.log('Testing performance considerations...');
    
    const mainPagePath = path.join(__dirname, 'src/app/courses/[courseId]/page.tsx');
    
    try {
      if (fs.existsSync(mainPagePath)) {
        const content = fs.readFileSync(mainPagePath, 'utf8');
        
        const performanceFeatures = [
          { name: 'Dynamic Imports', pattern: /import\(|lazy\(/ },
          { name: 'Memoization', pattern: /useMemo|useCallback/ },
          { name: 'Loading States', pattern: /loading|isLoading/ },
          { name: 'Image Optimization', pattern: /next\/image|Image/ },
          { name: 'Code Splitting', pattern: /Suspense/ }
        ];

        for (const feature of performanceFeatures) {
          if (feature.pattern.test(content)) {
            this.log(`Performance feature found: ${feature.name}`, 'success');
            this.testResults.passed++;
          } else {
            this.log(`Performance feature missing: ${feature.name}`, 'warning');
            this.testResults.warnings++;
          }
        }
      }
    } catch (error) {
      this.log(`Performance test error: ${error.message}`, 'error');
      this.testResults.failed++;
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('COURSE DETAIL PAGE PRACTICAL TEST REPORT');
    console.log('='.repeat(80));
    
    const total = this.testResults.passed + this.testResults.failed + this.testResults.warnings;
    const successRate = total > 0 ? ((this.testResults.passed / total) * 100).toFixed(1) : 0;
    
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${this.testResults.passed}`);
    console.log(`Failed: ${this.testResults.failed}`);
    console.log(`Warnings: ${this.testResults.warnings}`);
    console.log(`Success Rate: ${successRate}%`);
    
    console.log('\nTest Summary:');
    console.log(`  File Structure: ${this.testResults.details.filter(d => d.message.includes('File')).length} tests`);
    console.log(`  Components: ${this.testResults.details.filter(d => d.message.includes('component')).length} tests`);
    console.log(`  Elements: ${this.testResults.details.filter(d => d.message.includes('Element')).length} tests`);
    console.log(`  Responsive: ${this.testResults.details.filter(d => d.message.includes('Responsive')).length} tests`);
    console.log(`  Accessibility: ${this.testResults.details.filter(d => d.message.includes('Accessibility')).length} tests`);
    
    if (this.testResults.failed === 0) {
      console.log('\nALL CRITICAL TESTS PASSED! Course detail page structure is correct.', 'success');
      if (this.testResults.warnings > 0) {
        console.log(`Some warnings (${this.testResults.warnings}) - review recommended.`, 'warning');
      }
    } else {
      console.log(`\n${this.testResults.failed} tests failed - please fix critical issues.`, 'error');
    }
    
    console.log('\nNext Steps:');
    console.log('1. Run manual testing in browser');
    console.log('2. Test all interactive elements');
    console.log('3. Verify responsive design on different devices');
    console.log('4. Check accessibility with screen reader');
    console.log('5. Test performance with Lighthouse');
    
    console.log('='.repeat(80));
    
    return this.testResults;
  }
}

// Manual testing checklist
function generateManualTestingChecklist() {
  console.log('\n' + '='.repeat(80));
  console.log('MANUAL TESTING CHECKLIST');
  console.log('='.repeat(80));
  
  const checklist = [
    {
      category: 'Page Load & Display',
      items: [
        'Page loads without errors',
        'Light theme displays correctly',
        'Course title and description visible',
        'Progress card shows correct percentage',
        'All images load properly'
      ]
    },
    {
      category: 'Tab Navigation',
      items: [
        'All 5 tabs are visible',
        'Tab switching works smoothly',
        'Active tab is highlighted',
        'Tab content loads correctly',
        'No broken layouts when switching tabs'
      ]
    },
    {
      category: 'Buttons & Links',
      items: [
        'Start Learning button navigates to first lesson',
        'Share button opens share dialog',
        'Download button works for resources',
        'Certificate button shows correct state',
        'All links are clickable'
      ]
    },
    {
      category: 'Content Sections',
      items: [
        'Overview tab shows course information',
        'Curriculum tab displays lessons',
        'Instructor tab shows profile',
        'Reviews tab shows ratings',
        'Resources tab displays downloadable files'
      ]
    },
    {
      category: 'Progress Tracking',
      items: [
        'Progress percentage is accurate',
        'Progress bar fills correctly',
        'Completed lessons count is right',
        'Time invested displays',
        'Certificate button state is correct'
      ]
    },
    {
      category: 'Responsive Design',
      items: [
        'Mobile layout works (375px width)',
        'Tablet layout works (768px width)',
        'Desktop layout works (1920px width)',
        'Text is readable on all sizes',
        'Buttons are touch-friendly on mobile'
      ]
    },
    {
      category: 'Interactive Features',
      items: [
        'Star ratings display correctly',
        'Helpful buttons work in reviews',
        'Search bar in resources works',
        'Filter buttons function',
        'Load more buttons work'
      ]
    },
    {
      category: 'Accessibility',
      items: [
        'Keyboard navigation works',
        'Screen reader reads content',
        'Focus indicators are visible',
        'Color contrast is adequate',
        'Alt text exists for images'
      ]
    }
  ];
  
  checklist.forEach(section => {
    console.log(`\n${section.category}:`);
    section.items.forEach((item, index) => {
      console.log(`  [ ] ${item}`);
    });
  });
  
  console.log('\n' + '='.repeat(80));
  console.log('Test each item and mark with [x] when complete');
  console.log('='.repeat(80));
}

// Run tests
async function runPracticalTests() {
  const tester = new CourseDetailPracticalTest();
  await tester.runAllTests();
  generateManualTestingChecklist();
  return tester.testResults;
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CourseDetailPracticalTest, runPracticalTests };
}

// Run if executed directly
if (require.main === module) {
  runPracticalTests().catch(console.error);
}
