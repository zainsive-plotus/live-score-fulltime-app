// Import necessary Node.js modules
const fs = require('fs');
const path = require('path');

// --- Configuration ---
// The directory you want to extract files from.
const SRC_DIR = 'src'; 
// The name of the file where all the code will be saved.
const OUTPUT_FILE = 'extracted_code.txt';
// Extensions of files you want to include.
const ALLOWED_EXTENSIONS = ['.tsx', '.ts', '.js', '.jsx', '.css', '.json'];
// Specific filenames you want to include, regardless of extension.
const ALLOWED_FILENAMES = ['robots.ts', 'sitemap.ts'];
// Directories to ignore.
const IGNORED_DIRS = ['node_modules', '.next', 'public'];

/**
 * Recursively walks a directory and collects the content of allowed files.
 * @param {string} dir - The directory to walk.
 * @param {Array<string>} fileContentsArray - An array to accumulate file contents.
 */
function walkAndExtract(dir, fileContentsArray) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    
    // Check if the path is a directory and not in the ignored list.
    if (fs.statSync(fullPath).isDirectory()) {
      if (!IGNORED_DIRS.includes(file)) {
        walkAndExtract(fullPath, fileContentsArray); // Recurse into subdirectory
      }
    } else {
      // Check if the file has an allowed extension or is an allowed filename.
      const fileExt = path.extname(fullPath);
      const fileName = path.basename(fullPath);
      
      if (ALLOWED_EXTENSIONS.includes(fileExt) || ALLOWED_FILENAMES.includes(fileName)) {
        // 1. Get the relative path to use in the header comment.
        // We use path.sep to ensure it works on both Windows (\) and Unix (/).
        const relativePath = path.relative(process.cwd(), fullPath).split(path.sep).join('/');
        
        // 2. Read the file content.
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // 3. Format the output block.
        const outputBlock = `// ===== ${relativePath} =====\n\n${content}\n`;
        
        // 4. Add the block to our array.
        fileContentsArray.push(outputBlock);
        
        console.log(`✅ Extracted: ${relativePath}`);
      }
    }
  }
}

/**
 * Main function to run the script.
 */
function main() {
  console.log(`Starting extraction from directory: "${SRC_DIR}"...`);
  
  try {
    const allContents = [];
    walkAndExtract(SRC_DIR, allContents);

    // Join all the collected blocks with a couple of newlines for separation.
    const finalOutput = allContents.join('\n');
    
    // Write the combined content to the output file.
    fs.writeFileSync(OUTPUT_FILE, finalOutput, 'utf8');
    
    console.log(`\n🎉 Success! All code has been extracted to "${OUTPUT_FILE}".`);

  } catch (error) {
    if (error.code === 'ENOENT') {
        console.error(`❌ Error: The source directory "${SRC_DIR}" was not found.`);
        console.error('Please make sure you are running this script from your project\'s root directory.');
    } else {
        console.error('An unexpected error occurred:', error);
    }
  }
}

// Run the script
main();