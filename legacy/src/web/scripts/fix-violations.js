#!/usr/bin/env node

/**
 * Automated Code Violation Fixes
 * Applies common fixes for ESLint and TypeScript violations
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function fixFile(filePath) {
  log(`Fixing: ${filePath}`, 'blue');
  
  let content = fs.readFileSync(filePath, 'utf8');
  let fixCount = 0;
  
  // Fix 1: Replace || with ?? for nullish coalescing
  const oldContent1 = content;
  content = content.replace(/(\w+(?:\.\w+)*)\s*\|\|\s*(['"`][^'"`]*['"`]|[\w.]+)/g, (match, left, right) => {
    // Only replace if it's a typical null/undefined check pattern
    if (left.includes('localStorage.getItem') || left.includes('getItem') || match.includes('null') || match.includes('undefined')) {
      return `${left} ?? ${right}`;
    }
    return match;
  });
  if (content !== oldContent1) {
    fixCount++;
    log('  ✓ Fixed nullish coalescing operators', 'green');
  }
  
  // Fix 2: Replace any types with proper types where obvious
  const oldContent2 = content;
  content = content.replace(/:\s*any(?=\s*[=,;)])/g, ': unknown');
  if (content !== oldContent2) {
    fixCount++;
    log('  ✓ Replaced any with unknown types', 'green');
  }
  
  // Fix 3: Fix unescaped entities
  const oldContent3 = content;
  content = content.replace(/'/g, '&apos;');
  content = content.replace(/"/g, '&quot;');
  if (content !== oldContent3) {
    fixCount++;
    log('  ✓ Fixed unescaped entities', 'green');
  }
  
  // Fix 4: Add void to ignored promises (simple cases)
  const oldContent4 = content;
  content = content.replace(/(\s+)(\w+\.\w+\([^)]*\));?\s*$/gm, (match, indent, promiseCall) => {
    if (promiseCall.includes('Async') || promiseCall.includes('fetch') || promiseCall.includes('then')) {
      return `${indent}void ${promiseCall};`;
    }
    return match;
  });
  if (content !== oldContent4) {
    fixCount++;
    log('  ✓ Added void to ignored promises', 'green');
  }
  
  // Fix 5: Replace console.log in services with proper logging
  const oldContent5 = content;
  if (filePath.includes('service')) {
    content = content.replace(/console\.log\(/g, '// console.log(');
    if (content !== oldContent5) {
      fixCount++;
      log('  ✓ Commented out console.log in services', 'green');
    }
  }
  
  // Write back if changes were made
  if (fixCount > 0) {
    fs.writeFileSync(filePath, content);
    log(`  → Applied ${fixCount} fixes`, 'yellow');
  } else {
    log('  → No automatic fixes available', 'yellow');
  }
  
  return fixCount;
}

function findTypeScriptFiles(dir) {
  const files = [];
  
  function scanDir(currentDir) {
    const entries = fs.readdirSync(currentDir);
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules, .next, coverage, etc.
        if (!['node_modules', '.next', 'coverage', 'stryker-tmp', 'reports'].includes(entry)) {
          scanDir(fullPath);
        }
      } else if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
        // Skip test files for now
        if (!entry.includes('.test.') && !entry.includes('.spec.')) {
          files.push(fullPath);
        }
      }
    }
  }
  
  scanDir(dir);
  return files;
}

function main() {
  log('🔧 Starting automated violation fixes...', 'blue');
  
  const srcDir = path.join(process.cwd(), 'src');
  const files = findTypeScriptFiles(srcDir);
  
  log(`Found ${files.length} TypeScript files to process`, 'blue');
  
  let totalFixes = 0;
  
  for (const file of files) {
    const fixes = fixFile(file);
    totalFixes += fixes;
  }
  
  log(`\n✅ Completed! Applied ${totalFixes} total fixes across ${files.length} files`, 'green');
  
  if (totalFixes > 0) {
    log('\n💡 Run "npm run lint:fix" to apply remaining ESLint auto-fixes', 'yellow');
    log('💡 Run "npm run format" to ensure consistent formatting', 'yellow');
  }
}

if (require.main === module) {
  main();
}

module.exports = { fixFile, findTypeScriptFiles };