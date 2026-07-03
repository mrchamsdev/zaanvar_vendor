const fs = require('fs');
const path = require('path');

const targetDirs = [
  path.join(__dirname, 'components'),
  path.join(__dirname, 'pages')
];

// We want to skip vendor-settings where the default symbols are configured.
const skipPaths = ['vendor-settings'];

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    if (skipPaths.some(p => dirPath.includes(p))) return;
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(dirPath);
  });
}

function processFile(filePath) {
  if (!filePath.endsWith('.js') && !filePath.endsWith('.jsx')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('₹') && !content.includes('Rs') && !content.includes('Rs.')) return;

  console.log(`Processing: ${filePath}`);
  
  // 1. Add import if not present
  if (!content.includes('useCurrencySymbol')) {
    const importStatement = `import useCurrencySymbol from "@/components/utilities/useCurrencySymbol";\n`;
    
    // Find last import
    const lastImportIndex = content.lastIndexOf('import ');
    if (lastImportIndex !== -1) {
      const endOfLastImport = content.indexOf('\n', lastImportIndex);
      content = content.slice(0, endOfLastImport + 1) + importStatement + content.slice(endOfLastImport + 1);
    } else {
      content = importStatement + content;
    }
  }

  // 2. Inject hook into functional components
  // Look for: const ComponentName = (...) => { OR function ComponentName(...) {
  // This is a naive approach, but works for most standard React components.
  const componentRegex = /((?:const|let|var)\s+[A-Z]\w*\s*=\s*(?:async\s*)?(?:\([^)]*\)|[^=]*)\s*=>\s*\{|function\s+[A-Z]\w*\s*\([^)]*\)\s*\{)/g;
  
  content = content.replace(componentRegex, (match) => {
    // Check if the component already has the hook
    // It's hard to know the exact boundary, so we just inject it at the top of the block.
    return match + `\n  const currencySymbol = useCurrencySymbol();\n`;
  });

  // 3. Replace symbols
  // Replace '₹' or 'Rs' inside JSX text: >₹< -> >{currencySymbol}<
  // Replace inside template literals: `₹ ${amount}` -> `${currencySymbol} ${amount}`
  // Replace string literals: "₹" -> currencySymbol (this one is tricky, easier to just do JSX and templates first)

  // Safe global replaces for common patterns
  content = content.replace(/>\s*₹\s*</g, '>{currencySymbol}<');
  content = content.replace(/>\s*₹\s*/g, '>{currencySymbol} ');
  content = content.replace(/\s*₹\s*</g, ' {currencySymbol}<');
  
  content = content.replace(/`([^`]*?)₹([^`]*?)`/g, (match, p1, p2) => {
    return `\`${p1}\${currencySymbol}${p2}\``;
  });

  // Specifically target some tricky ones
  content = content.replace(/"₹"/g, 'currencySymbol');
  content = content.replace(/'₹'/g, 'currencySymbol');
  content = content.replace(/>₹\s*/g, '>{currencySymbol} ');
  content = content.replace(/₹\s*\{/g, '{currencySymbol} {');
  
  fs.writeFileSync(filePath, content, 'utf8');
}

targetDirs.forEach(dir => walk(dir, processFile));
console.log("Done.");
