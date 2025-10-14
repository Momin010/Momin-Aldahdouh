import type { ConsoleMessage } from '../types';

export interface ValidationError {
  type: 'syntax' | 'runtime' | 'logic';
  message: string;
  line?: number;
  column?: number;
  code?: string;
}

/**
 * Validates JavaScript code for common errors
 */
export function validateJavaScriptCode(code: string): ValidationError[] {
  const errors: ValidationError[] = [];

  // Syntax validation using Function constructor (safe way to check syntax)
  try {
    // Wrap in a function to avoid global scope issues
    new Function('"use strict";\n' + code);
  } catch (error: any) {
    errors.push({
      type: 'syntax',
      message: error.message,
      line: extractLineNumber(error.message),
      column: extractColumnNumber(error.message),
      code: extractErrorCode(error.message)
    });
  }

  // Check for common runtime error patterns
  const lines = code.split('\n');

  lines.forEach((line, index) => {
    const lineNumber = index + 1;

    // Check for undefined function calls
    const functionCallRegex = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g;
    let match;
    while ((match = functionCallRegex.exec(line)) !== null) {
      const functionName = match[1];
      // Skip common built-in functions and likely defined functions
      const skipFunctions = [
        'console', 'alert', 'prompt', 'confirm', 'setTimeout', 'setInterval',
        'clearTimeout', 'clearInterval', 'parseInt', 'parseFloat', 'isNaN',
        'encodeURIComponent', 'decodeURIComponent', 'JSON', 'Math', 'Date',
        'Array', 'Object', 'String', 'Number', 'Boolean', 'RegExp',
        'document', 'window', 'navigator', 'location', 'history',
        'addEventListener', 'removeEventListener', 'querySelector', 'querySelectorAll',
        'getElementById', 'getElementsByClassName', 'getElementsByTagName',
        'createElement', 'appendChild', 'removeChild', 'innerHTML', 'textContent',
        'classList', 'style', 'setAttribute', 'getAttribute', 'removeAttribute',
        'fetch', 'XMLHttpRequest', 'localStorage', 'sessionStorage'
      ];

      if (!skipFunctions.includes(functionName) && !isFunctionDefined(code, functionName)) {
        errors.push({
          type: 'runtime',
          message: `Potentially undefined function: ${functionName}`,
          line: lineNumber,
          code: line.trim()
        });
      }
    }

    // Check for date method calls on non-date objects
    if (line.includes('.getFullYear()') || line.includes('.getMonth()') || line.includes('.getDate()')) {
      const dateVarRegex = /(\w+)\.(getFullYear|getMonth|getDate|getTime|getHours|getMinutes|getSeconds)\(\)/g;
      const dateMatch = dateVarRegex.exec(line);
      if (dateMatch) {
        const varName = dateMatch[1];
        if (!isLikelyDateVariable(code, varName)) {
          errors.push({
            type: 'runtime',
            message: `Variable '${varName}' may not be a Date object but is used with Date methods`,
            line: lineNumber,
            code: line.trim()
          });
        }
      }
    }

    // Check for missing semicolons in critical places
    if (line.trim().match(/^(var|let|const|function|if|for|while|return)\s/) && !line.trim().endsWith(';') && !line.trim().endsWith('{') && !line.trim().endsWith(',')) {
      // This is a heuristic, not perfect
    }
  });

  return errors;
}

/**
 * Checks if a function is defined in the code
 */
function isFunctionDefined(code: string, functionName: string): boolean {
  const functionRegex = new RegExp(`\\bfunction\\s+${functionName}\\b|\\b${functionName}\\s*=\\s*function|\\bconst\\s+${functionName}\\s*=|\\blet\\s+${functionName}\\s*=|\\bvar\\s+${functionName}\\s*=`, 'g');
  return functionRegex.test(code);
}

/**
 * Checks if a variable is likely a Date object
 */
function isLikelyDateVariable(code: string, varName: string): boolean {
  const dateCreationRegex = new RegExp(`\\b${varName}\\s*=\\s*new\\s+Date|\\b${varName}\\s*=\\s*Date\\.now|\\b${varName}\\s*=\\s*Date\\.parse`, 'g');
  return dateCreationRegex.test(code);
}

/**
 * Extracts line number from error message
 */
function extractLineNumber(message: string): number | undefined {
  const match = message.match(/line (\d+)/i) || message.match(/:(\d+):/);
  return match ? parseInt(match[1], 10) : undefined;
}

/**
 * Extracts column number from error message
 */
function extractColumnNumber(message: string): number | undefined {
  const match = message.match(/column (\d+)/i) || message.match(/:(\d+):(\d+)/);
  return match ? parseInt(match[2] || match[1], 10) : undefined;
}

/**
 * Extracts error code from error message
 */
function extractErrorCode(message: string): string | undefined {
  const match = message.match(/'(.*?)'/);
  return match ? match[1] : undefined;
}

/**
 * Converts validation errors to console messages
 */
export function validationErrorsToConsoleMessages(errors: ValidationError[]): ConsoleMessage[] {
  return errors.map(error => ({
    level: 'error' as const,
    payload: [`${error.type.toUpperCase()}: ${error.message}${error.line ? ` (line ${error.line})` : ''}${error.code ? ` in: ${error.code}` : ''}`]
  }));
}

/**
 * Extracts JavaScript code from HTML content
 */
export function extractJavaScriptFromHtml(html: string): string[] {
  const scripts: string[] = [];

  // Extract content from <script> tags
  const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = scriptRegex.exec(html)) !== null) {
    const scriptContent = match[1].trim();
    if (scriptContent) {
      scripts.push(scriptContent);
    }
  }

  // Also extract inline event handlers and onclick attributes
  const eventHandlerRegex = /\bon\w+="([^"]*)"/gi;
  while ((match = eventHandlerRegex.exec(html)) !== null) {
    const handlerCode = match[1];
    if (handlerCode) {
      scripts.push(handlerCode);
    }
  }

  return scripts;
}

/**
 * Validates HTML content for common issues
 */
export function validateHtmlContent(html: string): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check for unclosed tags
  const tagStack: string[] = [];
  const selfClosingTags = ['br', 'hr', 'img', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr'];

  const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;
  let match;

  while ((match = tagRegex.exec(html)) !== null) {
    const tag = match[0];
    const tagName = match[1];

    if (tag.startsWith('</')) {
      // Closing tag
      const expectedTag = tagStack.pop();
      if (expectedTag !== tagName) {
        errors.push({
          type: 'logic',
          message: `Mismatched closing tag: expected </${expectedTag}>, found </${tagName}>`,
          code: tag
        });
      }
    } else if (!tag.endsWith('/>') && !selfClosingTags.includes(tagName.toLowerCase())) {
      // Opening tag
      tagStack.push(tagName);
    }
  }

  if (tagStack.length > 0) {
    errors.push({
      type: 'logic',
      message: `Unclosed tags: ${tagStack.join(', ')}`,
      code: tagStack.map(tag => `<${tag}>`).join('')
    });
  }

  return errors;
}

/**
 * Validates the preview HTML that users actually see
 */
export function validatePreviewHtml(html: string): ValidationError[] {
  const errors: ValidationError[] = [];

  // First validate HTML structure
  errors.push(...validateHtmlContent(html));

  // Extract and validate JavaScript code from the HTML
  const scripts = extractJavaScriptFromHtml(html);

  scripts.forEach((script, index) => {
    try {
      // Try to parse the JavaScript
      new Function('"use strict";\n' + script);
    } catch (error: any) {
      errors.push({
        type: 'syntax',
        message: `JavaScript syntax error in script ${index + 1}: ${error.message}`,
        line: extractLineNumber(error.message),
        column: extractColumnNumber(error.message),
        code: script.substring(0, 100) + (script.length > 100 ? '...' : '')
      });
    }

    // Check for common runtime issues in the script
    const scriptErrors = validateJavaScriptCode(script);
    errors.push(...scriptErrors.map(error => ({
      ...error,
      message: `Script ${index + 1}: ${error.message}`
    })));
  });

  return errors;
}