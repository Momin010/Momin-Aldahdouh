// Additional tools for targeted modifications (used alongside original MODIFY_CODE system)

// Tool definitions for targeted modifications
export interface ModificationTool {
  description: string;
  parameters: {
    path: string;
    old: string;
    new: string;
  };
}

export const editTool: ModificationTool = {
  description: `
  Replace a specific string of text that appears exactly once in a file with new text.
  Use this tool when making targeted modifications to existing files.

  IMPORTANT: You MUST know the file's current contents before using this tool.
  Use the 'view' tool first to read the file if you're not sure.

  The 'old' and 'new' parameters must be less than 1024 characters each.
  `,
  parameters: {
    path: 'The absolute path to the file to edit.',
    old: 'The exact fragment of text to replace. Must be unique in the file.',
    new: 'The new fragment of text to replace it with.'
  }
};

export const viewTool: ModificationTool = {
  description: `
  Read the contents of a file or list a directory. Use this tool when you need to understand
  the current structure of a file before making changes.

  The file contents are returned as a string with 1-indexed line numbers.
  `,
  parameters: {
    path: 'The absolute path to the file to read.',
    old: 'Optional line range to view (1-indexed, -1 for end).',
    new: ''
  }
};

export const createTool: ModificationTool = {
  description: `
  Create a new file with the specified content. Use this tool when you need to create
  entirely new files rather than modifying existing ones.
  `,
  parameters: {
    path: 'The absolute path to the file to create.',
    old: 'The full content of the file to create.',
    new: ''
  }
};

export const listDirTool: ModificationTool = {
  description: `
  List the contents of a directory. Use this tool to understand the project structure
  and see what files and folders exist.
  `,
  parameters: {
    path: 'The absolute path to the directory to list.',
    old: '',
    new: ''
  }
};

export const searchTool: ModificationTool = {
  description: `
  Search for text across files in the project. Use this tool to find specific code patterns,
  function names, or text that you need to modify.
  `,
  parameters: {
    path: 'The text to search for.',
    old: 'File pattern to include (e.g., "*.tsx").',
    new: ''
  }
};

// Additional tools for targeted modifications
export const MODIFICATION_TOOLS = {
  edit: editTool,
  view: viewTool,
  create: createTool,
  list_dir: listDirTool,
  search: searchTool,
};

// Tool execution functions for targeted modifications
export async function executeEditTool(args: { path: string; old: string; new: string }) {
  // This would read the file, find the old text, and replace it with new text
  // For now, return a success message
  return {
    success: true,
    message: `Edited file ${args.path} by replacing text fragment`,
    changes: [{
      filePath: args.path,
      action: 'update' as const,
      content: `// File edited by tool - replaced text fragment\n// Original: ${args.old.substring(0, 50)}...\n// New: ${args.new.substring(0, 50)}...`
    }]
  };
}

export async function executeViewTool(args: { path: string; view_range?: number[] | null }) {
  // This would read the file content
  // For now, return a mock response
  return {
    success: true,
    content: `// File content for ${args.path}\n// This is a mock response\n// In a real implementation, this would read the actual file`,
    path: args.path
  };
}

export async function executeCreateTool(args: { path: string; content: string }) {
  // This would create a new file
  return {
    success: true,
    message: `Created file ${args.path}`,
    changes: [{
      filePath: args.path,
      action: 'create' as const,
      content: args.content
    }]
  };
}

export async function executeListDirTool(args: { path: string }) {
  // This would list directory contents
  return {
    success: true,
    contents: [
      { name: 'src', type: 'directory' },
      { name: 'package.json', type: 'file' },
      { name: 'README.md', type: 'file' }
    ]
  };
}

export async function executeSearchTool(args: { query: string; include_pattern?: string }) {
  // This would search for text in files
  return {
    success: true,
    results: [
      { file: 'src/App.tsx', line: 10, content: `// Found: ${args.query}` },
      { file: 'src/components/Header.tsx', line: 5, content: `// Found: ${args.query}` }
    ]
  };
}