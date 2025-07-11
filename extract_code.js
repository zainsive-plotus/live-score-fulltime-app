const fs = require("fs");
const path = require("path");

// --- Central Configuration ---
const CONFIG = {
  // Directories to scan
  SRC_DIRS: ["src"],
  // The name of the file where all the code will be saved.
  OUTPUT_FILE: "extracted_code.txt",
  // Extensions of files to include (case-insensitive).
  ALLOWED_EXTENSIONS: [".tsx", ".ts", ".js", ".jsx", ".css"],
  // Specific filenames to include, regardless of extension.
  ALLOWED_FILENAMES: ["next.config.js", "tailwind.config.ts"],
  // Directories to ignore.
  IGNORED_DIRS: ["node_modules", ".next", "public", ".vscode", "locales"],
  // Specific filenames to ignore.
  IGNORED_FILENAMES: ["package.json", "package-lock.json", "tsconfig.json"],

  // --- Token Optimization Settings ---
  REMOVE_COMMENTS: true,
  REMOVE_CONSOLE_LOGS: true,
  TRIM_WHITESPACE: true,
};

/**
 * Processes the raw content of a file to apply various optimizations.
 * @param {string} content - The raw file content.
 * @returns {string} The processed, token-optimized content.
 */
function processFileContent(content) {
  let processedContent = content;

  if (CONFIG.REMOVE_COMMENTS) {
    // Remove multi-line /* ... */ comments and single-line // comments
    processedContent = processedContent.replace(
      /\/\*[\s\S]*?\*\/|(?<=[^:])\/\/.*|^\/\/.*/g,
      ""
    );
  }

  if (CONFIG.REMOVE_CONSOLE_LOGS) {
    // Remove console.log, console.error, etc.
    processedContent = processedContent.replace(
      /console\.(log|warn|error|info|debug)\s*\(.*?\);?/g,
      ""
    );
  }

  if (CONFIG.TRIM_WHITESPACE) {
    // Collapse multiple empty lines into a single empty line and trim trailing whitespace
    processedContent = processedContent
      .replace(/\n\s*\n/g, "\n\n")
      .replace(/[ \t]+$/gm, "");
  }

  return processedContent.trim();
}

/**
 * Recursively walks a directory and collects the content of allowed files.
 * @param {string} dir - The directory to walk.
 * @param {Array<string>} fileContentsArray - An array to accumulate file contents.
 */
function walkAndExtract(dir, fileContentsArray) {
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);

    if (CONFIG.IGNORED_DIRS.includes(path.basename(dir))) {
      continue;
    }

    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (!CONFIG.IGNORED_DIRS.includes(item)) {
        walkAndExtract(fullPath, fileContentsArray);
      }
    } else {
      const fileExt = path.extname(fullPath).toLowerCase();
      const fileName = path.basename(fullPath);

      if (CONFIG.IGNORED_FILENAMES.includes(fileName)) {
        continue; // Skip ignored files
      }

      if (
        CONFIG.ALLOWED_EXTENSIONS.includes(fileExt) ||
        CONFIG.ALLOWED_FILENAMES.includes(fileName)
      ) {
        const relativePath = path
          .relative(process.cwd(), fullPath)
          .replace(/\\/g, "/");
        const rawContent = fs.readFileSync(fullPath, "utf8");

        const processedContent = processFileContent(rawContent);

        // Only add the block if there's content left after processing
        if (processedContent) {
          const outputBlock = `// ===== ${relativePath} =====\n\n${processedContent}\n`;
          fileContentsArray.push(outputBlock);
          console.log(`✅ Extracted & Processed: ${relativePath}`);
        } else {
          console.log(`⚪ Skipped (empty after processing): ${relativePath}`);
        }
      }
    }
  }
}

/**
 * Main function to run the script.
 */
function main() {
  console.log(`Starting extraction from: "${CONFIG.SRC_DIRS.join(", ")}"...`);

  try {
    const allContents = [];
    for (const dir of CONFIG.SRC_DIRS) {
      if (!fs.existsSync(dir)) {
        console.warn(
          `⚠️ Warning: Source directory "${dir}" not found. Skipping.`
        );
        continue;
      }
      walkAndExtract(dir, allContents);
    }

    if (allContents.length === 0) {
      console.log("\n🟡 No files were extracted. Check your configuration.");
      return;
    }

    const finalOutput = allContents.join("\n");
    fs.writeFileSync(CONFIG.OUTPUT_FILE, finalOutput, "utf8");

    const stats = fs.statSync(CONFIG.OUTPUT_FILE);
    const fileSizeInKB = (stats.size / 1024).toFixed(2);

    console.log(
      `\n🎉 Success! ${allContents.length} files have been extracted to "${CONFIG.OUTPUT_FILE}".`
    );
    console.log(`   Total size: ${fileSizeInKB} KB`);
  } catch (error) {
    console.error("❌ An unexpected error occurred:", error);
  }
}

// Run the script
main();
