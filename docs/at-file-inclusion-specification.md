# '@' File Inclusion Specification

## Overview

This document specifies the '@' file inclusion syntax used in GEMINI.md files and similar documentation formats. The '@' syntax allows authors to include content from other files directly into their documentation, enabling modular and reusable content structures.

## Current Implementations

### Claude Code (`claude.md`)

Claude Code implements a flat, linear inclusion system where all referenced files are concatenated into a single document with clear file boundary markers.

**Key Characteristics:**
- **Format**: Flat concatenation with file boundary markers
- **File Boundaries**: Uses `--- File: {path} ---` and `--- End of File: {path} ---` markers
- **Ordering**: Files are included in order of first encounter, with duplicates removed
- **Hierarchy**: No explicit import tree structure presented to the LLM
- **Processing**: Simple text concatenation with path resolution

**Example Output:**
```
--- File: /path/to/main.md ---
# Main Document

@./components/header.md

Content here.

@./components/footer.md
--- End of File: /path/to/main.md ---

--- File: /path/to/components/header.md ---
# Header Component

This is the header content.
--- End of File: /path/to/components/header.md ---

--- File: /path/to/components/footer.md ---
# Footer Component

This is the footer content.
--- End of File: /path/to/components/footer.md ---
```

### Gemini CLI

Gemini CLI implements a hierarchical inclusion system that preserves the import structure and provides both tree and flat formats.

**Key Characteristics:**
- **Format**: Hierarchical with import tree tracking
- **File Boundaries**: Uses HTML comments `<!-- Imported from: {path} -->` and `<!-- End of import from: {path} -->`
- **Ordering**: Files are included in-place where they are referenced
- **Hierarchy**: Maintains explicit import tree structure for debugging
- **Processing**: Supports both tree and flat formats via configuration

**Example Output (Tree Format):**
```markdown
# Main Document

<!-- Imported from: ./components/header.md -->
# Header Component

This is the header content.
<!-- End of import from: ./components/header.md -->

Content here.

<!-- Imported from: ./components/footer.md -->
# Footer Component

This is the footer content.
<!-- End of import from: ./components/footer.md -->
```

**Example Output (Flat Format - Claude-style):**
```
--- File: /path/to/main.md ---
# Main Document

@./components/header.md

Content here.

@./components/footer.md
--- End of File: /path/to/main.md ---

--- File: /path/to/components/header.md ---
# Header Component

This is the header content.
--- End of File: /path/to/components/header.md ---

--- File: /path/to/components/footer.md ---
# Footer Component

This is the footer content.
--- End of File: /path/to/components/footer.md ---
```

## Syntax Specification

### Basic Syntax

The '@' inclusion syntax follows this pattern:
```
@<path>
```

Where `<path>` can be:
- **Relative path**: `./file.md`, `../file.md`, `./components/file.md`
- **Absolute path**: `/absolute/path/to/file.md`
- **File with spaces**: `@My\ Documents/file.txt` (escaped with backslash)

### Path Resolution Rules

1. **Relative paths** are resolved relative to the current file's directory
2. **Absolute paths** are resolved from the filesystem root
3. **Path traversal** is prevented for security
4. **URLs** are not supported (`file://`, `http://`, `https://`)

### Supported File Types

- `.md` - Markdown files
- `.txt` - Text files
- `.js` - JavaScript files
- `.ts` - TypeScript files
- `.json` - JSON files
- Any text-based file format

### Code Region Handling

'@' inclusions inside code blocks and inline code spans are ignored:

```markdown
# This will be processed: @./file.md

```javascript
// This will NOT be processed: @./file.js
```

`This will NOT be processed: @./file.md`
```

## Compatibility Issues

### Current Incompatibilities

1. **File Boundary Markers**: Different syntax for marking file boundaries
   - Claude: `--- File: {path} ---` / `--- End of File: {path} ---`
   - Gemini CLI: `<!-- Imported from: {path} -->` / `<!-- End of import from: {path} -->`

2. **Processing Order**: Different approaches to handling duplicate files
   - Claude: Deduplicates and orders by first encounter
   - Gemini CLI: Tree format includes in-place, flat format deduplicates

3. **Hierarchy Presentation**: Different approaches to showing import structure
   - Claude: No explicit hierarchy presented to LLM
   - Gemini CLI: Tree format preserves hierarchy, flat format matches Claude

### Impact on LLM Understanding

The differences in file boundary markers and processing order can affect how LLMs interpret the included content:

1. **File Identification**: LLMs may have different expectations about file boundaries
2. **Content Context**: The order and structure of included content may vary
3. **Debugging**: Different approaches to showing import relationships

## Real-World Examples

### Example 1: Component Documentation

**Claude Code Style:**
```markdown
# API Documentation

@./components/authentication.md
@./components/database.md
@./components/api-endpoints.md
```

**Gemini CLI Tree Style:**
```markdown
# API Documentation

<!-- Imported from: ./components/authentication.md -->
[authentication content]
<!-- End of import from: ./components/authentication.md -->

<!-- Imported from: ./components/database.md -->
[database content]
<!-- End of import from: ./components/database.md -->

<!-- Imported from: ./components/api-endpoints.md -->
[api endpoints content]
<!-- End of import from: ./components/api-endpoints.md -->
```

### Example 2: Nested Imports

**Claude Code Style:**
```
--- File: main.md ---
@./header.md
@./content.md
@./footer.md
--- End of File: main.md ---

--- File: header.md ---
@./shared/title.md
[header content]
--- End of File: header.md ---

--- File: shared/title.md ---
[title content]
--- End of File: shared/title.md ---
```

**Gemini CLI Tree Style:**
```markdown
<!-- Imported from: ./header.md -->
<!-- Imported from: ./shared/title.md -->
[title content]
<!-- End of import from: ./shared/title.md -->
[header content]
<!-- End of import from: ./header.md -->

<!-- Imported from: ./content.md -->
[content]
<!-- End of import from: ./content.md -->

<!-- Imported from: ./footer.md -->
[footer content]
<!-- End of import from: ./footer.md -->
```

## Recommendations

### For Standardization

1. **Adopt Claude-style markers**: Use `--- File: {path} ---` format for consistency
2. **Implement flat processing**: Default to flat concatenation with deduplication
3. **Preserve file order**: Include files in order of first encounter
4. **Maintain hierarchy option**: Keep tree format as an optional feature for debugging

### For Gemini CLI Implementation

1. **Add configuration option**: Allow users to choose between Claude-style and current tree-style
2. **Default to Claude-style**: Make flat format the default for better compatibility
3. **Preserve debugging features**: Keep import tree generation for development use
4. **Document differences**: Clearly explain the differences in documentation

### For Content Authors

1. **Use relative paths**: Prefer relative paths for better portability
2. **Avoid deep nesting**: Keep import chains shallow to avoid complexity
3. **Test compatibility**: Verify content works with both implementations
4. **Document structure**: Maintain clear documentation of import relationships

## Future Considerations

1. **Standardization**: Work towards a common specification across tools
2. **Performance**: Optimize processing for large numbers of imports
3. **Caching**: Implement caching for frequently imported files
4. **Validation**: Add schema validation for import structures
5. **Tooling**: Develop tools for analyzing and optimizing import structures

## References

- [Claude Code Documentation](https://docs.anthropic.com/claude/docs)
- [Gemini CLI Memory Import Processor](./memport.md)
- [GEMINI.md Specification](https://github.com/google/gemini-cli/blob/main/docs/core/index.md) 