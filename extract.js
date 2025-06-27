// extract-code.js

const fs = require("fs");
const path = require("path");

const COMPONENTS_DIR = path.join(__dirname, "src", "app");
const OUTPUT_FILE = path.join(__dirname, "all-components-code-app-app.txt");

// File extensions you want to include
const EXTENSIONS = [".js", ".jsx", ".ts", ".tsx", ".vue"];

async function walk(dir, fileList = []) {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  for (let entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath, fileList);
    } else if (EXTENSIONS.includes(path.extname(entry.name))) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}
async function extractAllCode() {
  try {
    // 1. Find all component files
    const files = await walk(COMPONENTS_DIR);
    if (files.length === 0) {
      console.log("No component files found in", COMPONENTS_DIR);
      return;
    }

    // 2. Read each file and append its content to the output
    const writeStream = fs.createWriteStream(OUTPUT_FILE, { flags: "w" });
    for (let filePath of files) {
      const relative = path.relative(__dirname, filePath);
      const code = await fs.promises.readFile(filePath, "utf-8");
      writeStream.write(`// ===== ${relative} =====\n`);
      writeStream.write(code + "\n\n");
    }
    writeStream.end(() => {
      console.log(`All component code has been extracted to ${OUTPUT_FILE}`);
    });
  } catch (err) {
    console.error("Error extracting code:", err);
  }
}

// Run it!
extractAllCode();
