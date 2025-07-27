/**
 * Test file to demonstrate differences between Claude Code and Gemini CLI '@' processing
 * This helps identify compatibility issues and validate the specification
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock file structure for testing
const TEST_FILES = {
  'main.md': `# Main Document

This is the main content.

@./components/header.md

More content here.

@./components/footer.md

@./shared/config.md
`,

  'components/header.md': `# Header Component

@./shared/title.md

This is the header content.
`,

  'components/footer.md': `# Footer Component

This is the footer content.

@./shared/links.md
`,

  'shared/title.md': `# Project Title

This is the shared title content.
`,

  'shared/config.md': `# Configuration

This is the configuration content.
`,

  'shared/links.md': `# Links

- [Home](./main.md)
- [Header](./components/header.md)
`,

  // Test case with circular imports
  'circular-a.md': `# Circular A

@./circular-b.md

Content A
`,

  'circular-b.md': `# Circular B

@./circular-a.md

Content B
`,

  // Test case with duplicate imports
  'duplicate-test.md': `# Duplicate Test

@./shared/config.md

Content here.

@./shared/config.md

More content.
`,

  // Test case with nested imports
  'nested-test.md': `# Nested Test

@./deep/nested/file.md
`,

  'deep/nested/file.md': `# Deep Nested File

@../../shared/config.md

Deep content.
`
};

// Expected Claude Code output format
function generateClaudeStyleOutput(files, processedFiles) {
  const output = [];
  
  for (const filePath of processedFiles) {
    const content = files[filePath];
    output.push(`--- File: ${filePath} ---`);
    output.push(content.trim());
    output.push(`--- End of File: ${filePath} ---`);
  }
  
  return output.join('\n\n');
}

// Expected Gemini CLI tree format output
function generateGeminiTreeOutput(files, processedFiles, importMap) {
  const output = [];
  
  for (const filePath of processedFiles) {
    const content = files[filePath];
    const lines = content.split('\n');
    const processedLines = [];
    
    for (const line of lines) {
      const atMatch = line.match(/@([^\s]+)/);
      if (atMatch) {
        const importPath = atMatch[1];
        const fullImportPath = path.resolve(path.dirname(filePath), importPath);
        
        if (importMap[fullImportPath]) {
          processedLines.push(`<!-- Imported from: ${importPath} -->`);
          processedLines.push(importMap[fullImportPath].trim());
          processedLines.push(`<!-- End of import from: ${importPath} -->`);
        } else {
          processedLines.push(`<!-- Import failed: ${importPath} -->`);
        }
      } else {
        processedLines.push(line);
      }
    }
    
    output.push(processedLines.join('\n'));
  }
  
  return output.join('\n\n');
}

// Test cases demonstrating differences
const TEST_CASES = [
  {
    name: 'Basic Import Structure',
    description: 'Simple import structure with no nesting',
    files: ['main.md', 'components/header.md', 'components/footer.md', 'shared/config.md'],
    expectedClaude: 'Flat concatenation with file boundaries',
    expectedGemini: 'In-place replacement with HTML comments'
  },
  {
    name: 'Nested Imports',
    description: 'Imports that contain other imports',
    files: ['main.md', 'components/header.md', 'shared/title.md', 'shared/config.md'],
    expectedClaude: 'All files flattened in order of first encounter',
    expectedGemini: 'Nested structure preserved with hierarchy'
  },
  {
    name: 'Duplicate Imports',
    description: 'Same file imported multiple times',
    files: ['duplicate-test.md', 'shared/config.md'],
    expectedClaude: 'Duplicate removed, only included once',
    expectedGemini: 'Each import processed separately'
  },
  {
    name: 'Circular Imports',
    description: 'Files that import each other',
    files: ['circular-a.md', 'circular-b.md'],
    expectedClaude: 'Circular detection prevents infinite loop',
    expectedGemini: 'Circular detection with error comments'
  }
];

async function runCompatibilityTests() {
  console.log('Running Claude vs Gemini CLI Compatibility Tests\n');
  
  // Create test directory structure
  const testDir = path.join(__dirname, 'claude-compatibility-test');
  await fs.mkdir(testDir, { recursive: true });
  await fs.mkdir(path.join(testDir, 'components'), { recursive: true });
  await fs.mkdir(path.join(testDir, 'shared'), { recursive: true });
  await fs.mkdir(path.join(testDir, 'deep', 'nested'), { recursive: true });
  
  // Write test files
  for (const [filePath, content] of Object.entries(TEST_FILES)) {
    const fullPath = path.join(testDir, filePath);
    await fs.writeFile(fullPath, content);
  }
  
  console.log('Test files created in:', testDir);
  
  // Run test cases
  for (const testCase of TEST_CASES) {
    console.log(`\nTest Case: ${testCase.name}`);
    console.log(`   Description: ${testCase.description}`);
    console.log(`   Files: ${testCase.files.join(', ')}`);
    
    // Generate expected outputs
    const processedFiles = testCase.files;
    const claudeOutput = generateClaudeStyleOutput(TEST_FILES, processedFiles);
    const geminiOutput = generateGeminiTreeOutput(TEST_FILES, processedFiles, TEST_FILES);
    
    // Save outputs for comparison
    const claudePath = path.join(testDir, `${testCase.name.toLowerCase().replace(/\s+/g, '-')}-claude.md`);
    const geminiPath = path.join(testDir, `${testCase.name.toLowerCase().replace(/\s+/g, '-')}-gemini.md`);
    
    await fs.writeFile(claudePath, claudeOutput);
    await fs.writeFile(geminiPath, geminiOutput);
    
    console.log(`   Claude output: ${claudePath}`);
    console.log(`   Gemini output: ${geminiPath}`);
    
    // Analyze differences
    const claudeLines = claudeOutput.split('\n').length;
    const geminiLines = geminiOutput.split('\n').length;
    const claudeSize = Buffer.byteLength(claudeOutput, 'utf8');
    const geminiSize = Buffer.byteLength(geminiOutput, 'utf8');
    
    console.log(`   Claude: ${claudeLines} lines, ${claudeSize} bytes`);
    console.log(`   Gemini: ${geminiLines} lines, ${geminiSize} bytes`);
    console.log(`   Difference: ${Math.abs(claudeLines - geminiLines)} lines, ${Math.abs(claudeSize - geminiSize)} bytes`);
  }
  
  // Generate compatibility report
  const report = {
    timestamp: new Date().toISOString(),
    testCases: TEST_CASES.length,
    totalFiles: Object.keys(TEST_FILES).length,
    differences: [
      'File boundary markers (Claude: --- File: --- vs Gemini: <!-- Imported from: -->)',
      'Processing order (Claude: flat vs Gemini: hierarchical)',
      'Duplicate handling (Claude: deduplicates vs Gemini: processes each)',
      'Hierarchy presentation (Claude: none vs Gemini: explicit)'
    ],
    recommendations: [
      'Implement Claude-style flat processing as default option',
      'Add configuration to switch between processing modes',
      'Standardize file boundary markers across implementations',
      'Create migration tools for existing CLAUDE.md files'
    ]
  };
  
  const reportPath = path.join(testDir, 'compatibility-report.json');
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`\nCompatibility report saved to: ${reportPath}`);
  
  // Create example CLAUDE.md file for testing
  const exampleClaudeMd = `# Example CLAUDE.md

This is an example CLAUDE.md file that demonstrates '@' inclusion syntax.

## Components

@./components/header.md

## Configuration

@./shared/config.md

## Footer

@./components/footer.md

This file would be processed differently by Claude Code vs Gemini CLI.
`;

  const examplePath = path.join(testDir, 'example-CLAUDE.md');
  await fs.writeFile(examplePath, exampleClaudeMd);
  
  console.log(`\nExample CLAUDE.md created: ${examplePath}`);
  console.log('\nCompatibility tests completed!');
  console.log('\nNext steps:');
  console.log('   1. Test the generated files with actual Claude Code and Gemini CLI');
  console.log('   2. Compare the outputs to identify specific compatibility issues');
  console.log('   3. Use the findings to prioritize implementation changes');
  console.log('   4. Create migration guides for existing CLAUDE.md files');
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runCompatibilityTests().catch(console.error);
}

export {
  TEST_FILES,
  TEST_CASES,
  generateClaudeStyleOutput,
  generateGeminiTreeOutput,
  runCompatibilityTests
}; 