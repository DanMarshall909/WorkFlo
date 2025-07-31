"use strict";
/**
 * TypeScript/Jest test generator that consumes acceptance criteria parser output
 * Supports both new file generation and AST-based insertion into existing files
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTests = generateTests;
exports.createParseResult = createParseResult;
exports.generateAndInsertTests = generateAndInsertTests;
const ts_morph_1 = require("ts-morph");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Generates TypeScript/Jest test files from acceptance criteria parser output
 */
function generateTests(parseResult, _options = {}) {
    // Future: use testFramework and style options when supporting multiple frameworks
    const { criteria, issueNumber, issueTitle } = parseResult;
    if (criteria.length === 0) {
        throw new Error('No acceptance criteria found to generate tests for');
    }
    const issueRef = issueNumber ? `#${issueNumber}` : 'Unknown Issue';
    const title = issueTitle || 'Acceptance criteria tests';
    return generateTestContent(issueRef, title, criteria);
}
/**
 * Generates test content with proper Jest structure and @group annotations
 */
function generateTestContent(issueRef, title, criteria) {
    const issueGroup = issueRef.toLowerCase().replace('#', 'issue-').replace(/\s+/g, '-');
    let content = `/**
 * @group ${issueGroup}
 * @group generator
 * @group unit
 */
describe('${issueRef}: ${title}', () => {
`;
    criteria.forEach((criterion) => {
        const acGroup = criterion.id ? criterion.id.toLowerCase() : `ac-${criterion.index}`;
        const cleanText = criterion.cleanText || criterion.text;
        content += `  /**
   * @group ${acGroup}
   */
  describe('${criterion.id || `AC-${criterion.index}`}: ${cleanText}', () => {
    it('should ${cleanText.toLowerCase()}', () => {
      // Given
      
      // When
      
      // Then
      throw new Error('Not implemented');
    });
  });

`;
    });
    content += '});\n';
    return content;
}
/**
 * Convert simple acceptance criteria array to structured ParseResult format
 */
function createParseResult(criteria, issueNumber, issueTitle) {
    const structuredCriteria = criteria.map((text, index) => {
        // Extract AC-N prefix if present
        const acMatch = text.match(/^(AC-\d+):\s*(.+)$/);
        return {
            index: index + 1,
            id: acMatch ? acMatch[1] : undefined,
            text: text,
            cleanText: acMatch ? acMatch[2] : text,
            checked: false,
            raw: `- [ ] ${text}`
        };
    });
    return {
        criteria: structuredCriteria,
        total: criteria.length,
        completed: 0,
        issueNumber,
        issueTitle
    };
}
/**
 * Generate and insert tests using AST-based manipulation
 */
function generateAndInsertTests(parseResult, insertionOptions, generatorOptions = {}) {
    const { strategy, targetFile, marker, createFileIfMissing = true } = insertionOptions;
    switch (strategy) {
        case 'new-file':
            return createNewTestFile(parseResult, { ...generatorOptions, outputPath: targetFile });
        case 'insert-before-end':
            if (!targetFile)
                throw new Error('Target file required for insert-before-end strategy');
            return insertBeforeEnd(parseResult, targetFile, generatorOptions, createFileIfMissing);
        case 'insert-at-marker':
            if (!targetFile || !marker)
                throw new Error('Target file and marker required for insert-at-marker strategy');
            return insertAtMarker(parseResult, targetFile, marker, generatorOptions, createFileIfMissing);
        case 'insert-new-describe':
            if (!targetFile)
                throw new Error('Target file required for insert-new-describe strategy');
            return insertNewDescribeBlock(parseResult, targetFile, generatorOptions, createFileIfMissing);
        default:
            throw new Error(`Unknown insertion strategy: ${strategy}`);
    }
}
/**
 * Create a new test file (existing functionality)
 */
function createNewTestFile(parseResult, options) {
    const testCode = generateTests(parseResult, options);
    const fileName = options.outputPath || `tests/issue-${parseResult.issueNumber || 'unknown'}.test.ts`;
    // Ensure directory exists
    const dir = path.dirname(fileName);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(fileName, testCode);
    return fileName;
}
/**
 * Insert tests before the end of the last describe block using AST
 */
function insertBeforeEnd(parseResult, targetFile, options, createFileIfMissing) {
    if (!fs.existsSync(targetFile)) {
        if (createFileIfMissing) {
            return createNewTestFile({ ...parseResult }, { ...options, outputPath: targetFile });
        }
        throw new Error(`Target file ${targetFile} does not exist`);
    }
    const project = new ts_morph_1.Project();
    const sourceFile = project.addSourceFileAtPath(targetFile);
    // Find the outermost describe block
    const describeBlocks = sourceFile.getDescendantsOfKind(ts_morph_1.SyntaxKind.CallExpression)
        .filter(call => {
        const expression = call.getExpression();
        return expression.getKind() === ts_morph_1.SyntaxKind.Identifier &&
            expression.getText() === 'describe';
    });
    if (describeBlocks.length === 0) {
        throw new Error('No describe blocks found in target file');
    }
    // Get the outermost describe block (first one that's not nested)
    const outermostDescribe = describeBlocks.find(block => {
        return !describeBlocks.some(otherBlock => otherBlock !== block && otherBlock.getStart() < block.getStart() && otherBlock.getEnd() > block.getEnd());
    });
    if (!outermostDescribe) {
        throw new Error('Could not find outermost describe block');
    }
    // Generate individual test blocks for each criterion
    const testBlocks = parseResult.criteria.map(criterion => generateSingleTestBlock(criterion)).join('\n\n');
    // Find the block statement of the describe
    const blockStatement = outermostDescribe.getArguments()[1];
    if (blockStatement && blockStatement.getKind() === ts_morph_1.SyntaxKind.ArrowFunction) {
        const arrowFunc = blockStatement.asKindOrThrow(ts_morph_1.SyntaxKind.ArrowFunction);
        const body = arrowFunc.getBody();
        if (body && body.getKind() === ts_morph_1.SyntaxKind.Block) {
            const block = body.asKindOrThrow(ts_morph_1.SyntaxKind.Block);
            // Insert before the end of the block
            sourceFile.insertText(block.getEnd() - 1, `\n${testBlocks}\n`);
        }
    }
    sourceFile.saveSync();
    return targetFile;
}
/**
 * Insert tests at a specific marker comment
 */
function insertAtMarker(parseResult, targetFile, marker, _options, createFileIfMissing) {
    if (!fs.existsSync(targetFile)) {
        if (createFileIfMissing) {
            const templateContent = `/**
 * Generated test file
 */
describe('Tests', () => {
  // ${marker}
});`;
            fs.writeFileSync(targetFile, templateContent);
        }
        else {
            throw new Error(`Target file ${targetFile} does not exist`);
        }
    }
    // Read the file content and use string replacement as fallback
    const content = fs.readFileSync(targetFile, 'utf8');
    if (!content.includes(marker)) {
        throw new Error(`Marker "${marker}" not found in target file`);
    }
    // Generate test blocks
    const testBlocks = parseResult.criteria.map(criterion => generateSingleTestBlock(criterion)).join('\n\n');
    // Replace the marker with tests + marker
    const updatedContent = content.replace(`// ${marker}`, `${testBlocks}\n\n  // ${marker}`);
    fs.writeFileSync(targetFile, updatedContent);
    return targetFile;
}
/**
 * Insert a new top-level describe block for the issue
 */
function insertNewDescribeBlock(parseResult, targetFile, options, createFileIfMissing) {
    if (!fs.existsSync(targetFile)) {
        if (createFileIfMissing) {
            return createNewTestFile({ ...parseResult }, { ...options, outputPath: targetFile });
        }
        throw new Error(`Target file ${targetFile} does not exist`);
    }
    const project = new ts_morph_1.Project();
    const sourceFile = project.addSourceFileAtPath(targetFile);
    // Generate the complete describe block for this issue
    const testContent = generateTests(parseResult, options);
    // Add at the end of the file
    sourceFile.addStatements(testContent);
    sourceFile.saveSync();
    return targetFile;
}
/**
 * Generate a single test block for one acceptance criterion
 */
function generateSingleTestBlock(criterion) {
    const acGroup = criterion.id ? criterion.id.toLowerCase() : `ac-${criterion.index}`;
    const cleanText = criterion.cleanText || criterion.text;
    return `  /**
   * @group ${acGroup}
   */
  describe('${criterion.id || `AC-${criterion.index}`}: ${cleanText}', () => {
    it('should ${cleanText.toLowerCase()}', () => {
      // Given
      
      // When
      
      // Then
      throw new Error('Not implemented');
    });
  });`;
}
//# sourceMappingURL=test-generator.js.map