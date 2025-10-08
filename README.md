# Claude-Gemini Compatibility

Research and tools addressing compatibility between Claude Code's `claude.md` '@' processing and Gemini CLI implementation.

## Objective

Elevate the CLAUDE.md '@' compatibility issue from low priority by providing evidence-based research that documents differences, demonstrates impact, and builds community consensus.

## Structure

- `docs/at-file-inclusion-specification.md` - '@' file inclusion syntax specification
- `scripts/find-claude-md-examples.cjs` - GitHub search for real-world examples
- `integration-tests/claude-compatibility.test.js` - Compatibility test suite

## Core Differences

**File Boundaries**
- Claude: `--- File: /path/to/file.md ---`
- Gemini: `<!-- Imported from: ./file.md -->`

**Processing**
- Claude: Flat concatenation with deduplication
- Gemini: Hierarchical with in-place replacement

**Structure**
- Claude: No hierarchy presentation
- Gemini: Tree format preserves hierarchy

## Impact

**LLM Processing**
- Inconsistent file boundary recognition
- Variable content ordering affects context
- Different debugging approaches

**Migration Challenges**
- Existing CLAUDE.md files incompatible with Gemini CLI
- Manual conversion required
- Potential content structure issues

## Implementation Path

**Priority Elevation**
1. Specification document ✓
2. Real-world examples (in progress)
3. Impact demonstration ✓
4. Community engagement (next)

**Technical Solution**
- Configuration option for Claude-style processing
- Standardized file boundary markers
- Flat concatenation as default
- Migration tools for existing files

## Usage

**GitHub Search**
```bash
cd scripts && node find-claude-md-examples.cjs
```
or
```bash
npm run search
```

**Compatibility Tests**
```bash
cd integration-tests && node claude-compatibility.test.js
```
or
```bash
npm run test
```

**Specification Review**
See `docs/at-file-inclusion-specification.md` for detailed syntax analysis.

**Conventional Commits**
This project follows conventional commit standards. To enable commit message validation:

```bash
# Copy the commit-msg hook to enable validation
cp scripts/commit-msg .git/hooks/commit-msg

# To rewrite existing commit messages (use with caution):
./scripts/rewrite_msg.sh
```

Commit messages must:
- Start with types: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`, `perf:`, `ci:`, `build:`, `revert:`
- Have lowercase message body
- Be ≤60 characters for the first line

## Next Steps

1. Complete GitHub search for real-world examples
2. Quantify impact through analysis
3. Initiate community discussion
4. Develop migration guide
5. Propose implementation changes

## License

This work is released under [CC0 1.0 Universal](LICENSE) - dedicated to the public domain.

## References

- [Claude Code Documentation](https://docs.anthropic.com/claude/docs)
- [Gemini CLI Memory Import Processor](https://github.com/google-gemini/gemini-cli/blob/main/packages/core/src/utils/memoryImportProcessor.test.ts)
- [GEMINI.md Specification](https://github.com/google-gemini/gemini-cli/blob/main/docs/index.md)
- [Original PR Comment](https://github.com/google-gemini/gemini-cli/pull/2978#issuecomment-3119576329)
