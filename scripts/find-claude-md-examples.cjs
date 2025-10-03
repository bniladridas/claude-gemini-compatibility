#!/usr/bin/env node

/**
 * Script to find real-world examples of CLAUDE.md files that use '@' inclusion syntax
 * This helps demonstrate the impact of differences between Claude Code and Gemini CLI implementations
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// GitHub API search for CLAUDE.md files with '@' syntax
const GITHUB_API_URL = 'https://api.github.com/search/code';
const SEARCH_QUERIES = [
  'filename:CLAUDE.md "@"',
  'filename:claude.md "@"',
  'filename:CLAUDE.md "@./"',
  'filename:claude.md "@./"',
  'filename:CLAUDE.md "@/"',
  'filename:claude.md "@/"',
];

async function searchGitHub(query) {
  return new Promise((resolve, reject) => {
    const url = `${GITHUB_API_URL}?q=${encodeURIComponent(query)}&per_page=30`;
    
    const options = {
      headers: {
        'User-Agent': 'gemini-cli-compatibility-research',
        'Accept': 'application/vnd.github.v3+json',
      }
    };

    https.get(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const results = JSON.parse(data);
          resolve(results);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

async function getFileContent(repo, path) {
  return new Promise((resolve, reject) => {
    const url = `https://api.github.com/repos/${repo}/contents/${encodeURIComponent(path)}`;
    
    const options = {
      headers: {
        'User-Agent': 'gemini-cli-compatibility-research',
        'Accept': 'application/vnd.github.v3+json',
      }
    };

    https.get(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.content) {
            const content = Buffer.from(result.content, 'base64').toString('utf-8');
            resolve(content);
          } else {
            resolve(null);
          }
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

function analyzeClaudeFile(content, repo, filePath) {
  const atImports = [];
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const atMatch = line.match(/@([^\s]+)/);
    if (atMatch) {
      atImports.push({
        line: i + 1,
        import: atMatch[1],
        context: line.trim()
      });
    }
  }
  
  return {
    repo,
    filePath,
    totalLines: lines.length,
    atImports,
    hasImports: atImports.length > 0,
    importCount: atImports.length
  };
}

function generateReport(results) {
  const report = {
    summary: {
      totalFiles: results.length,
      filesWithImports: results.filter(r => r.hasImports).length,
      totalImports: results.reduce((sum, r) => sum + r.importCount, 0),
      averageImportsPerFile: 0
    },
    files: results,
    recommendations: []
  };
  
  if (results.length > 0) {
    report.summary.averageImportsPerFile = report.summary.totalImports / report.summary.filesWithImports;
  }
  
  // Generate recommendations based on findings
  const filesWithImports = results.filter(r => r.hasImports);
  
  if (filesWithImports.length > 0) {
    report.recommendations.push(
      `${filesWithImports.length} real-world CLAUDE.md files use '@' inclusion syntax`,
      'These files would be affected by differences between Claude Code and Gemini CLI implementations',
      'Consider testing these files with both implementations to identify compatibility issues'
    );
  }
  
  return report;
}

async function main() {
  console.log('Searching for real-world CLAUDE.md examples...\n');
  
  const allResults = [];
  const seenFiles = new Set();
  
  for (const query of SEARCH_QUERIES) {
    try {
      console.log(`Searching: ${query}`);
      const results = await searchGitHub(query);
      
      if (results.items) {
        for (const item of results.items) {
          const fileKey = `${item.repository.full_name}:${item.path}`;
          
          if (!seenFiles.has(fileKey)) {
            seenFiles.add(fileKey);
            
            try {
              const content = await getFileContent(item.repository.full_name, item.path);
              if (content) {
                const analysis = analyzeClaudeFile(content, item.repository.full_name, item.path);
                allResults.push(analysis);
                
                if (analysis.hasImports) {
                  console.log(`  Found: ${item.repository.full_name}/${item.path} (${analysis.importCount} imports)`);
                }
              }
            } catch (error) {
              console.log(`  Error reading: ${item.repository.full_name}/${item.path}`);
            }
          }
        }
      }
      
      // Rate limiting - be respectful to GitHub API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`Error searching for "${query}":`, error.message);
    }
  }
  
  console.log('\nGenerating report...\n');
  
  const report = generateReport(allResults);
  
  // Save detailed report
  const reportPath = path.join(__dirname, 'claude-md-analysis-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // Print summary
  console.log('Analysis Summary:');
  console.log(`  Total files found: ${report.summary.totalFiles}`);
  console.log(`  Files with '@' imports: ${report.summary.filesWithImports}`);
  console.log(`  Total import statements: ${report.summary.totalImports}`);
  console.log(`  Average imports per file: ${report.summary.averageImportsPerFile.toFixed(1)}`);
  
  console.log('\nTop files with imports:');
  const topFiles = allResults
    .filter(r => r.hasImports)
    .sort((a, b) => b.importCount - a.importCount)
    .slice(0, 5);
    
  for (const file of topFiles) {
    console.log(`  ${file.repo}/${file.filePath} (${file.importCount} imports)`);
  }
  
  console.log('\nRecommendations:');
  for (const rec of report.recommendations) {
    console.log(`  • ${rec}`);
  }
  
  console.log(`\nDetailed report saved to: ${reportPath}`);
  
  // Generate example test cases
  if (topFiles.length > 0) {
    console.log('\nExample test cases for compatibility testing:');
    for (const file of topFiles.slice(0, 3)) {
      console.log(`\n  Test case: ${file.repo}/${file.filePath}`);
      console.log(`  Expected behavior: Should process ${file.importCount} '@' imports correctly`);
      console.log(`  Potential issues: File boundary markers, import order, hierarchy presentation`);
    }
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { searchGitHub, analyzeClaudeFile, generateReport }; 