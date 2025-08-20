const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

// Image sizes we need for different use cases
const SIZES = [
  { size: 24, suffix: '24' },
  { size: 32, suffix: '32' },
  { size: 40, suffix: '40' },
  { size: 48, suffix: '48' },
  { size: 64, suffix: '64' },
];

const INPUT_DIR = path.join(__dirname, '../public/images/tokens');
const OUTPUT_BASE_DIR = path.join(__dirname, '../public/images/tokens/optimized');

async function ensureDirectory(dirPath) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
}

async function resizeImage(inputPath, outputPath, size) {
  try {
    await sharp(inputPath)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }, // Transparent background
      })
      .png({
        quality: 90,
        compressionLevel: 9,
        palette: true, // Use palette for smaller file sizes when possible
      })
      .toFile(outputPath);

    const stats = await fs.stat(outputPath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    console.log(`✓ Resized ${path.basename(inputPath)} to ${size}x${size} (${sizeKB}KB)`);
  } catch (error) {
    console.error(`✗ Failed to resize ${inputPath}:`, error.message);
  }
}

async function optimizeTokenImages() {
  console.log('🖼️  Starting token image optimization...\n');

  try {
    // Ensure output base directory exists
    await ensureDirectory(OUTPUT_BASE_DIR);

    // Create size-specific directories
    for (const { suffix } of SIZES) {
      await ensureDirectory(path.join(OUTPUT_BASE_DIR, suffix));
    }

    // Get all PNG files from input directory
    const files = await fs.readdir(INPUT_DIR);
    const pngFiles = files.filter(
      (file) => file.toLowerCase().endsWith('.png') && !file.startsWith('.') // Skip hidden files
    );

    if (pngFiles.length === 0) {
      console.log('No PNG files found in input directory');
      return;
    }

    console.log(`Found ${pngFiles.length} PNG files to optimize:`);
    pngFiles.forEach((file) => console.log(`  • ${file}`));
    console.log('');

    // Process each file for each size
    for (const file of pngFiles) {
      const inputPath = path.join(INPUT_DIR, file);
      const baseName = path.parse(file).name; // filename without extension

      console.log(`Processing ${file}...`);

      for (const { size, suffix } of SIZES) {
        const outputPath = path.join(OUTPUT_BASE_DIR, suffix, `${baseName}.png`);
        await resizeImage(inputPath, outputPath, size);
      }

      console.log(''); // Empty line between files
    }

    console.log('🎉 Optimization complete!');
    console.log('\nGenerated directories:');
    for (const { size, suffix } of SIZES) {
      console.log(`  • public/images/tokens/optimized/${suffix}/ (${size}x${size} images)`);
    }

    console.log('\nNext steps:');
    console.log('1. Update tokenImages.ts to use optimized paths');
    console.log('2. Remove unoptimized flag from Image components');
  } catch (error) {
    console.error('❌ Optimization failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  optimizeTokenImages();
}

module.exports = { optimizeTokenImages, SIZES };
