#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { spawn } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs/promises";
import ignore from "ignore";

// Create server instance
const server = new McpServer({
  name: "filesystem",
  version: "1.0.0",
  capabilities: {
    resources: {
      subscribe: true,
      listChanged: true,
    },
    tools: {
      listChanged: true,
    },
    prompts: {
      listChanged: true,
    },
  },
});

// Helper function to execute shell commands safely
async function executeCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      ...options,
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr, code });
      } else {
        reject(new Error(`Command failed with code ${code}: ${stderr}`));
      }
    });

    child.on("error", (error) => {
      reject(error);
    });
  });
}

// Token estimation utility (rough approximation: ~4 chars per token)
function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

// Paginate text content by token limit
function paginateByTokens(content, maxTokensPerPage = 15000) {
  const lines = content.split("\n");
  const pages = [];
  let currentPage = [];
  let currentTokenCount = 0;

  for (const line of lines) {
    const lineTokens = estimateTokens(line + "\n");

    if (
      currentTokenCount + lineTokens > maxTokensPerPage &&
      currentPage.length > 0
    ) {
      pages.push({
        content: currentPage.join("\n"),
        tokenCount: currentTokenCount,
      });
      currentPage = [line];
      currentTokenCount = lineTokens;
    } else {
      currentPage.push(line);
      currentTokenCount += lineTokens;
    }
  }

  if (currentPage.length > 0) {
    pages.push({
      content: currentPage.join("\n"),
      tokenCount: currentTokenCount,
    });
  }

  return pages;
}

// ============================================================================
// SHARED STATE TRACKER - Tracks LAST READ FILE ONLY
// ============================================================================
const fileReadTracker = {
  lastReadFile: null, // Only stores the most recently read file path
  lastReadContent: null, // Content hash for verification

  markAsRead(filePath, content) {
    const contentHash = this.hashContent(content);
    this.lastReadFile = filePath;
    this.lastReadContent = {
      contentHash: contentHash,
      size: content.length,
      timestamp: Date.now(),
    };
  },

  isLastReadFile(filePath) {
    return this.lastReadFile === filePath;
  },

  getLastReadFile() {
    return this.lastReadFile;
  },

  getLastReadInfo() {
    if (!this.lastReadFile) return null;
    return {
      path: this.lastReadFile,
      ...this.lastReadContent,
    };
  },

  hashContent(content) {
    // Simple hash for content verification
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  },

  clear() {
    this.lastReadFile = null;
    this.lastReadContent = null;
  },
};

// ============================================================================
// READ_FILE TOOL - Tracks when files are read
// ============================================================================
server.registerTool(
  "read_file",
  {
    description: `**Purpose:**  
Retrieve and inspect the full content of a file. Always use \`read_file\` to establish ground truth and avoid destructive or incorrect changes. 

**Parameters:**  
- \`file_path\` (string, required):  
  The exact path to the file, relative to the project root. Must be a valid, accessible file.  
  Example: \`"src/utils/helpers.ts"\`  

- \`page\` (number, optional, default=1):  
  Page number to retrieve. Pagination starts at 1. Use to navigate large files. 

**Note:** The system handles pagination automatically. If the response indicates more content exists, use incremental \`page\` values to continue reading.`,

    inputSchema: {
      file_path: z
        .string()
        .describe("The exact path to the file you want to read"),
      page: z
        .number()
        .optional()
        .default(1)
        .describe("Page number for large files (starts at 1)"),
    },
  },
  async ({ file_path, page }) => {
    try {
      const MAX_TOKENS_PER_PAGE = 10000;
      const content = await fs.readFile(file_path, "utf8");
      const stats = await fs.stat(file_path);

      // 🔑 TRACK THIS FILE AS THE LAST READ FILE
      fileReadTracker.markAsRead(file_path, content);

      // Paginate if content is large
      const pages = paginateByTokens(content, MAX_TOKENS_PER_PAGE);

      if (pages.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `\x1b[0;33mFile is empty:\x1b[0m ${file_path}\n\x1b[0;32m✓ File marked as LAST READ - ready for update_file\x1b[0m`,
            },
          ],
        };
      }

      const requestedPage = Math.max(1, Math.min(page, pages.length));
      const pageData = pages[requestedPage - 1];

      let response = `\x1b[0;32mFile:\x1b[0m ${file_path}\n`;
      response += `\x1b[0;32mSize:\x1b[0m ${stats.size} bytes\n`;
      response += `\x1b[0;32mModified:\x1b[0m ${stats.mtime.toISOString()}\n`;
      response += `\x1b[0;32m✓ File marked as LAST READ - ready for update_file\x1b[0m\n`;

      if (pages.length > 1) {
        response += `Page ${requestedPage} of ${pages.length} (${pageData.tokenCount} tokens)\n`;
        response += `Total size: ~${pages.reduce(
          (sum, p) => sum + p.tokenCount,
          0
        )} tokens\n`;
        response += `Use page parameter (1-${pages.length}) to see other parts.\n`;
      }

      response += `\n${"=".repeat(60)}\n`;
      response += pageData.content;

      return {
        content: [
          {
            type: "text",
            text: response,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error reading file: ${error.message}`,
          },
        ],
      };
    }
  }
);

// ============================================================================
// UPDATE_FILE TOOL - Enforces last-read-file rule
// ============================================================================
server.registerTool(
  "update_file",
  {
    description: `**Purpose:**  
Modify file contents using precise update operations. This tool supports multiple strategies—from exact text replacement to line-level edits—enabling surgical changes without requiring full file rewrites. 

** CRITICAL SAFETY RULE - ENFORCED BY SYSTEM:**  
This tool will **REJECT** any update attempt if the target file is NOT the last file read with \`read_file\`.  

**Update Types:** 

1. **"replace"** – Find and replace exact text  
   - Required: \`old_string\` (must match *exactly*, including spaces and line breaks)  
   - Required: \`new_string\`  
   - Optional: \`global\` (default \`false\`) — \`true\` = replace all, \`false\` = first match only  
   - Optional: \`case_sensitive\` (default \`true\`)  

2. **"regex"** – Match and replace using regular expressions  
   - Required: \`pattern\` (as a string, e.g., \`"version:\\\\s*\\\\d+\\\\.\\\\d+"\`)  
   - Required: \`new_string\`  
   - Optional: \`global\` (default \`false\`)  

3. **"line"** – Replace entire line by number  
   - Required: \`line_number\` (1-based indexing)  
   - Required: \`new_string\`  
   - Line numbers may shift after prior updates in the same call

4. **"insert"** – Insert new line *after* specified line  
   - Required: \`line_number\` (use \`0\` to insert at beginning)  
   - Required: \`new_string\`  

5. **"append"** – Add text to end of file  
   - Required: \`new_string\` only  
   - Safe for logs, footers, metadata

6. **"prepend"** – Add text to start of file  
   - Required: \`new_string\` only  
   - Ideal for license headers, shebangs

**Parameters:**  
- \`file_path\` (string, required):  
  Full path to target file. Example: \`"src/config/app.json"\`  

- \`updates\` (array, required):  
  List of update operations applied **in order**. Later updates can depend on earlier ones.  
  Each object must include \`type\` and relevant fields. 

- \`create_backup\` (boolean, optional, default \`true\`):  
  Automatically creates a \`.bak\` copy before changes. Never disable unless certain. 

- \`dry_run\` (boolean, optional, default \`false\`):  
  Simulate changes without writing. Returns what *would* change. Use for testing. 

**Note:**  
- Updates are applied sequentially. A \`line\` update may affect subsequent line numbers.  
- If \`dry_run\` returns changes, review them before setting \`dry_run: false\`.  
- Backups are saved as \`<filename>.bak\` and can be restored manually if needed.`,

    inputSchema: {
      file_path: z.string().describe("Path to the file to update"),
      updates: z
        .array(
          z.object({
            type: z
              .enum(["replace", "regex", "line", "insert", "append", "prepend"])
              .describe(
                "Type of update: 'replace' for exact text, 'regex' for pattern matching, 'line' for specific line numbers, 'insert' for adding at line, 'append' for end of file, 'prepend' for beginning"
              ),
            old_string: z
              .string()
              .optional()
              .describe(
                "For 'replace': exact text to find and replace. Must match exactly including whitespace"
              ),
            new_string: z
              .string()
              .describe("New text to insert or replace with"),
            pattern: z
              .string()
              .optional()
              .describe("For 'regex': regular expression pattern to match"),
            line_number: z
              .number()
              .optional()
              .describe(
                "For 'line': line number to replace (1-based). For 'insert': line number to insert after"
              ),
            global: z
              .boolean()
              .optional()
              .default(false)
              .describe(
                "For 'replace' and 'regex': replace all occurrences, not just first"
              ),
            case_sensitive: z
              .boolean()
              .optional()
              .default(true)
              .describe("For 'replace': whether to match case exactly"),
          })
        )
        .describe("Array of updates to apply in sequence"),
      create_backup: z
        .boolean()
        .optional()
        .default(true)
        .describe("Create a .bak backup file before updating"),
      dry_run: z
        .boolean()
        .optional()
        .default(false)
        .describe("Preview changes without actually modifying the file"),
    },
  },
  async ({ file_path, updates, create_backup, dry_run }) => {
    try {
      // ============================================================================
      //  ENFORCE LAST-READ-FILE RULE
      // ============================================================================
      if (!fileReadTracker.isLastReadFile(file_path)) {
        const lastReadInfo = fileReadTracker.getLastReadInfo();
        let errorMsg = `🚫 BLOCKED: Target file is not the last file read!\n\n`;
        errorMsg += `Attempting to update: ${file_path}\n`;

        if (lastReadInfo) {
          errorMsg += `Last file read was: ${lastReadInfo.path}\n\n`;
        } else {
          errorMsg += `No file has been read yet in this session.\n\n`;
        }

        errorMsg += `🔧 Action Required:\n`;
        errorMsg += `You must call read_file on "${file_path}" immediately before calling update_file.\n\n`;
        errorMsg += `Correct sequence:\n`;
        errorMsg += `1. read_file("${file_path}")\n`;
        errorMsg += `2. update_file("${file_path}", ...)\n\n`;
        errorMsg += `Example:\n`;
        errorMsg += `{\n`;
        errorMsg += `  "tool": "read_file",\n`;
        errorMsg += `  "file_path": "${file_path}"\n`;
        errorMsg += `}\n`;

        return {
          content: [
            {
              type: "text",
              text: errorMsg,
            },
          ],
          isError: true,
        };
      }

      // ============================================================================
      // Proceed with update logic
      // ============================================================================

      // Read current file content
      let content;
      let fileExists = true;
      try {
        content = await fs.readFile(file_path, "utf8");
      } catch (error) {
        if (error.code === "ENOENT") {
          fileExists = false;
          content = "";
        } else {
          throw error;
        }
      }

      const originalContent = content;
      let changeLog = [];

      // ============================================================================
      // Separate updates by type to avoid line number conflicts
      // ============================================================================
      const textOps = updates.filter((u) =>
        ["replace", "regex", "append", "prepend"].includes(u.type)
      );
      const lineOps = updates.filter((u) =>
        ["line", "insert"].includes(u.type)
      );

      // Validate line operations for duplicates
      if (lineOps.length > 1) {
        const lineNumbers = lineOps
          .map((u) => u.line_number)
          .filter((n) => n !== undefined)
          .sort((a, b) => a - b);
        const hasDuplicates = lineNumbers.some(
          (num, i) => num === lineNumbers[i + 1]
        );

        if (hasDuplicates) {
          changeLog.push(
            "⚠️  WARNING: Multiple operations on same line number - results may be unexpected"
          );
        }
      }

      // ============================================================================
      // PHASE 1: Process text operations (order-independent)
      // ============================================================================
      for (const update of textOps) {
        let beforeChange = content;

        switch (update.type) {
          case "replace":
            if (!update.old_string) {
              throw new Error("'replace' type requires 'old_string' field");
            }

            if (update.global) {
              // Replace all occurrences
              if (update.case_sensitive) {
                const occurrences = (
                  content.match(
                    new RegExp(
                      update.old_string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
                      "g"
                    )
                  ) || []
                ).length;
                content = content
                  .split(update.old_string)
                  .join(update.new_string);
                if (occurrences > 0) {
                  changeLog.push(
                    `\x1b[0;32m✓ Replaced ${occurrences} occurrences of text (exact match)\x1b[0m`
                  );
                }
              } else {
                const regex = new RegExp(
                  update.old_string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
                  "gi"
                );
                const occurrences = (content.match(regex) || []).length;
                content = content.replace(regex, update.new_string);
                if (occurrences > 0) {
                  changeLog.push(
                    `\x1b[0;32m✓ Replaced ${occurrences} occurrences of text (case-insensitive)\x1b[0m`
                  );
                }
              }
            } else {
              // Replace first occurrence
              if (update.case_sensitive) {
                if (content.includes(update.old_string)) {
                  content = content.replace(
                    update.old_string,
                    update.new_string
                  );
                  changeLog.push(
                    `\x1b[0;32m✓ Replaced first occurrence of text (exact match)\x1b[0m`
                  );
                } else {
                  changeLog.push(
                    `⚠ Text not found: "${update.old_string.substring(
                      0,
                      50
                    )}..."`
                  );
                }
              } else {
                const regex = new RegExp(
                  update.old_string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
                  "i"
                );
                if (regex.test(content)) {
                  content = content.replace(regex, update.new_string);
                  changeLog.push(
                    `\x1b[0;32m✓ Replaced first occurrence of text (case-insensitive)\x1b[0m`
                  );
                } else {
                  changeLog.push(
                    `⚠ Text not found (case-insensitive): "${update.old_string.substring(
                      0,
                      50
                    )}..."`
                  );
                }
              }
            }

            if (content === beforeChange) {
              changeLog[changeLog.length - 1] =
                changeLog[changeLog.length - 1] || `⚠ No changes made`;
            }
            break;

          case "regex":
            if (!update.pattern) {
              throw new Error("'regex' type requires 'pattern' field");
            }

            const regexFlags = update.global ? "gm" : "m";
            const regex = new RegExp(update.pattern, regexFlags);
            const matches = content.match(regex);

            if (matches) {
              content = content.replace(regex, update.new_string);
              changeLog.push(
                `\x1b[0;32m✓ Regex replaced ${matches.length} match(es): /${update.pattern}/\x1b[0m`
              );
            } else {
              changeLog.push(`⚠ No matches for regex: /${update.pattern}/`);
            }
            break;

          case "append":
            content =
              content +
              (content.endsWith("\n") ? "" : "\n") +
              update.new_string;
            changeLog.push(
              `\x1b[0;32m✓ Appended ${update.new_string.length} characters to end of file\x1b[0m`
            );
            break;

          case "prepend":
            content =
              update.new_string +
              (update.new_string.endsWith("\n") ? "" : "\n") +
              content;
            changeLog.push(
              `\x1b[0;32m✓ Prepended ${update.new_string.length} characters to beginning of file\x1b[0m`
            );
            break;

          default:
            changeLog.push(`⚠ Unknown update type: ${update.type}`);
        }
      }

      // ============================================================================
      // PHASE 2: Process line operations in DESCENDING order (bottom to top)
      // ============================================================================
      const sortedLineOps = lineOps.sort((a, b) => {
        const lineA = a.line_number ?? Infinity;
        const lineB = b.line_number ?? Infinity;
        return lineB - lineA; // Descending order
      });

      for (const update of sortedLineOps) {
        let beforeChange = content;

        switch (update.type) {
          case "line":
            if (update.line_number === undefined) {
              throw new Error("'line' type requires 'line_number' field");
            }

            const lineArray = content.split("\n");
            if (
              update.line_number > 0 &&
              update.line_number <= lineArray.length
            ) {
              const oldLine = lineArray[update.line_number - 1];
              lineArray[update.line_number - 1] = update.new_string;
              content = lineArray.join("\n");
              changeLog.push(
                `\x1b[0;32m✓ Replaced line ${
                  update.line_number
                }: "${oldLine.substring(
                  0,
                  50
                )}..." → "${update.new_string.substring(0, 50)}..."\x1b[0m`
              );
            } else {
              changeLog.push(
                `⚠ Line ${update.line_number} out of range (file has ${lineArray.length} lines)`
              );
            }
            break;

          case "insert":
            if (update.line_number === undefined) {
              throw new Error("'insert' type requires 'line_number' field");
            }

            const insertArray = content.split("\n");
            if (
              update.line_number >= 0 &&
              update.line_number <= insertArray.length
            ) {
              insertArray.splice(update.line_number, 0, update.new_string);
              content = insertArray.join("\n");
              changeLog.push(
                `\x1b[0;32m✓ Inserted text at line ${
                  update.line_number + 1
                }\x1b[0m`
              );
            } else {
              changeLog.push(
                `⚠ Line ${update.line_number} out of range for insertion`
              );
            }
            break;

          default:
            changeLog.push(`⚠ Unknown update type: ${update.type}`);
        }

        if (content === beforeChange) {
          changeLog[changeLog.length - 1] =
            changeLog[changeLog.length - 1] ||
            `⚠ No changes made for update type: ${update.type}`;
        }
      }

      // ============================================================================
      // Generate diff summary
      // ============================================================================
      const originalLines = originalContent.split("\n");
      const newLines = content.split("\n");
      const linesAdded = newLines.length - originalLines.length;
      const charactersChanged = Math.abs(
        content.length - originalContent.length
      );

      let response = "";

      if (dry_run) {
        response += "DRY RUN MODE - No files were modified\n\n";
      }

      response += `\x1b[0;32mFile:\x1b[0m ${file_path}\n`;
      response += `\x1b[0;32mStatus:\x1b[0m ${
        fileExists ? "Updated" : "Would be created"
      }\n`;
      response += `\x1b[0;32m✓ Last-read verification passed\x1b[0m\n\n`;

      response += `\x1b[0;32mChanges Applied:\x1b[0m\n${"-".repeat(50)}\n`;
      changeLog.forEach((log) => (response += `${log}\n`));

      response += `\n\x1b[0;32mSummary:\x1b[0m\n${"-".repeat(50)}\n`;
      response += `\x1b[0;32m• Original size:\x1b[0m ${originalContent.length} characters\n`;
      response += `\x1b[0;32m• New size:\x1b[0m ${content.length} characters\n`;
      response += `\x1b[0;32m• Lines changed:\x1b[0m ${
        linesAdded > 0 ? "+" : ""
      }${linesAdded}\n`;
      response += `\x1b[0;32m• Characters changed:\x1b[0m ${charactersChanged}\n`;

      if (!dry_run) {
        // Create backup if requested and file exists
        if (create_backup && fileExists) {
          await fs.writeFile(`${file_path}.bak`, originalContent);
          response += `\n\x1b[0;32m✓ Backup created: ${file_path}.bak\x1b[0m\n`;
        }

        // Write the updated content
        await fs.writeFile(file_path, content);
        response += `\x1b[0;32m✓ File updated successfully\x1b[0m\n`;

        // Re-mark as read after successful update
        fileReadTracker.markAsRead(file_path, content);
        response += `\x1b[0;32m✓ File re-marked as LAST READ (ready for immediate subsequent updates)\x1b[0m\n`;
      } else {
        response += `\n\x1b[0;32mPreview of first 500 characters of new content:\x1b[0m\n${"-".repeat(
          50
        )}\n`;
        response += content.substring(0, 500);
        if (content.length > 500) response += "\n...(truncated)";
      }

      return {
        content: [
          {
            type: "text",
            text: response,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error updating file: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// ============================================================================
// WRITE_FILE TOOL - Now checks if file exists first
// ============================================================================
server.registerTool(
  "write_file",
  {
    description:
      "Create a NEW file with content. Will reject if file already exists.",

    inputSchema: {
      file_path: z
        .string()
        .describe("Path where the new file should be created"),
      content: z
        .union([z.string(), z.record(z.any()), z.array(z.any())])
        .describe(
          "Content for the new file (strings, objects, or arrays - objects/arrays will be JSON formatted)"
        ),
      create_dirs: z
        .boolean()
        .optional()
        .default(false)
        .describe(
          "Automatically create parent directories if they don't exist"
        ),
      append: z
        .boolean()
        .optional()
        .default(false)
        .describe(
          "Append to existing file instead of overwriting (use update_file for complex modifications)"
        ),
      format_json: z
        .boolean()
        .optional()
        .default(true)
        .describe("Pretty-print JSON objects with proper indentation"),
    },
  },
  async ({ file_path, content, create_dirs, append, format_json }) => {
    try {
      // ============================================================================
      // CHECK IF FILE EXISTS FIRST
      // ============================================================================
      let fileExists = false;
      try {
        await fs.access(file_path);
        fileExists = true;
      } catch (error) {
        // File doesn't exist, which is expected for write_file
        fileExists = false;
      }

      if (fileExists) {
        let errorMsg = `🚫 BLOCKED: File already exists!\n\n`;
        errorMsg += `File: ${file_path}\n\n`;
        errorMsg += `🔧 Action Required:\n`;
        errorMsg += `This file already exists. Use the following sequence to modify it:\n\n`;
        errorMsg += `1. Call read_file to inspect the file:\n`;
        errorMsg += `   {\n`;
        errorMsg += `     "tool": "read_file",\n`;
        errorMsg += `     "file_path": "${file_path}"\n`;
        errorMsg += `   }\n\n`;
        errorMsg += `2. Then call update_file to make changes:\n`;
        errorMsg += `   {\n`;
        errorMsg += `     "tool": "update_file",\n`;
        errorMsg += `     "file_path": "${file_path}",\n`;
        errorMsg += `     "updates": [...]\n`;
        errorMsg += `   }\n`;

        return {
          content: [
            {
              type: "text",
              text: errorMsg,
            },
          ],
          isError: true,
        };
      }

      // ============================================================================
      // Proceed with file creation
      // ============================================================================

      // Create parent directories if requested
      if (create_dirs) {
        const dir = path.dirname(file_path);
        await fs.mkdir(dir, { recursive: true });
      }

      // Convert content to string if it's an object or array
      let finalContent;
      if (typeof content === "string") {
        finalContent = content;
      } else {
        // It's an object or array, stringify it
        finalContent = format_json
          ? JSON.stringify(content, null, 2)
          : JSON.stringify(content);
      }

      // Write the file
      if (append) {
        await fs.appendFile(file_path, finalContent);
      } else {
        await fs.writeFile(file_path, finalContent);
      }

      // Generate the heredoc command for reference
      const heredocCommand = `cat > ${file_path} << 'EOF'\n${finalContent}\nEOF`;

      const contentType = typeof content === "string" ? "text" : "JSON";

      let responseText = `\x1b[0;32m✓ File created successfully\x1b[0m: ${file_path}\n`;
      responseText += `\x1b[0;32mContent type:\x1b[0m ${contentType}\n`;
      responseText += `\x1b[0;32mSize:\x1b[0m ${finalContent.length} characters\n`;
      responseText += `\nEquivalent shell command:\n${heredocCommand}`;

      return {
        content: [
          {
            type: "text",
            text: responseText,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error writing file: ${error.message}`,
          },
        ],
      };
    }
  }
);

// List directory tool
server.registerTool(
  "list_directory",
  {
    description: `**Purpose:**  
Safely list files and directories in a structured format.

**Parameters:** 

- \`directory\` (string, optional, default \`"."\`):  
  Path to list. Can be relative or absolute.  
  Example: \`"src/"\`, \`"config"\`, \`"packages/api"\`

- \`level\` (number, optional):  
  Maximum depth to traverse.  
  - \`1\` = immediate children only  
  - \`2\` = children and grandchildren  
  - Omit or leave undefined for unlimited (not recommended)  
  Always prefer limiting depth in large projects

- \`show_hidden\` (boolean, optional, default \`true\`):  
  \`true\` = include files/directories starting with \`.\` (e.g., \`.env\`, \`.gitignore\`)  
  Set to \`true\` only when searching for config or dotfiles

- \`dirs_only\` (boolean, optional, default \`false\`):  
  \`true\` = show only directories, not files  
  Useful for structural exploration or cleanup tasks

- \`include_size\` (boolean, optional, default \`false\`):  
  \`true\` = show file sizes (in bytes) next to each file  
  Helps identify large assets or logs

- \`pattern\` (string, optional):  
  Filter results to only match files by glob pattern.  
  Example: \`"*.js"\`, \`"*.py"\`, \`"package.json"\`  
  Note: Uses shell-style globbing (\`*\`, \`?\`), not regex`,

    inputSchema: {
      directory: z
        .string()
        .optional()
        .default(".")
        .describe("Directory path to list (defaults to current directory)"),
      level: z
        .number()
        .optional()
        .describe(
          "How deep to show subdirectories (1 = only immediate children, 2 = children and grandchildren, etc.)"
        ),
      show_hidden: z
        .boolean()
        .optional()
        .default(true)
        .describe(
          "Include hidden files and directories (those starting with .)"
        ),
      dirs_only: z
        .boolean()
        .optional()
        .default(false)
        .describe("Only show directories, not files"),
      include_size: z
        .boolean()
        .optional()
        .default(false)
        .describe("Show file sizes next to each file"),
      pattern: z
        .string()
        .optional()
        .describe(
          "Filter to only show files matching this pattern (e.g., '*.js' for JavaScript files)"
        ),
    },
  },
  async ({
    directory,
    level,
    show_hidden,
    dirs_only,
    include_size,
    pattern,
  }) => {
    try {
      const ignorePattern = [
        "node_modules",
        ".git",
        "dist",
        "build",
        "target",
        "vendor",
        ".cache",
        "__pycache__",
        "env",
        ".venv",
        ".next",
        "coverage",
        "storage",
        ".idea",
        ".vscode",
        ".DS_Store",
        "Thumbs.db",
        ".pytest_cache",
        "bootstrap/cache",
        ".docker",
        ".gradle",
        ".mypy_cache",
        ".svelte-kit",
        ".nuxt",
      ].join("|");

      const args = [
        directory,
        "-C",
        "--gitignore",
        "--prune",
        "-I",
        ignorePattern,
      ];

      if (level !== undefined) {
        args.push("-L", level.toString());
      }

      if (show_hidden) {
        args.push("-a");
      }

      if (dirs_only) {
        args.push("-d");
      }

      if (include_size) {
        args.push("-s");
      }

      if (pattern) {
        args.push("-P", pattern);
      }

      const result = await executeCommand("tree", args);

      return {
        content: [
          {
            type: "text",
            text: result.stdout || "Empty directory or no matches found",
          },
        ],
      };
    } catch (error) {
      try {
        const excludeDirs = [
          "node_modules",
          ".git",
          "dist",
          "build",
          "target",
          "vendor",
          ".cache",
          "__pycache__",
          "env",
          ".venv",
          ".next",
          "coverage",
          ".idea",
          ".vscode",
          ".gradle",
          ".mypy_cache",
          ".svelte-kit",
          ".nuxt",
          "bootstrap",
        ];

        let findCmd = `find "${directory}"`;

        const exclusions = excludeDirs
          .map((dir) => `\\( -path "*/${dir}" -o -path "*/${dir}/*" \\) -prune`)
          .join(" -o ");

        findCmd += ` ${exclusions} -o`;

        if (level !== undefined && level > 0) {
          findCmd += ` -maxdepth ${level}`;
        }

        if (dirs_only) {
          findCmd += ` -type d`;
        } else {
          findCmd += ` -type f`;
        }

        if (!show_hidden) {
          findCmd += ` ! -path "*/.*"`;
        }

        if (pattern) {
          const globPattern = pattern.replace(/\*/g, ".*");
          findCmd += ` -name "${pattern}"`;
        }

        findCmd += ` -print`;

        const fallbackResult = await executeCommand("sh", ["-c", findCmd]);
        const output = `Directory listing (using find - tree not available):\n${fallbackResult.stdout}`;

        return {
          content: [
            {
              type: "text",
              text: output,
            },
          ],
        };
      } catch (fallbackError) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error.message}\nFallback error: ${fallbackError.message}`,
            },
          ],
        };
      }
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Advanced Filesystem Search MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
