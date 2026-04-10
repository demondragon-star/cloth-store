/**
 * Script to download placeholder category images
 * 
 * This script downloads free stock images from Unsplash for each category.
 * Run with: node assets/images/categories/download-images.js
 * 
 * Note: You can replace these with your own images from any source.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Unsplash Source URLs for random fashion images
const images = {
  'men.jpg': 'https://source.unsplash.com/1200x800/?men,fashion,clothing',
  'women.jpg': 'https://source.unsplash.com/1200x800/?women,fashion,clothing',
  'kids.jpg': 'https://source.unsplash.com/1200x800/?kids,fashion,clothing',
  'sports.jpg': 'https://source.unsplash.com/1200x800/?sports,athletic,wear'
};

const downloadImage = (url, filename) => {
  return new Promise((resolve, reject) => {
    const filepath = path.join(__dirname, filename);
    const file = fs.createWriteStream(filepath);
    
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`✓ Downloaded ${filename}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      console.error(`✗ Error downloading ${filename}:`, err.message);
      reject(err);
    });
  });
};

async function downloadAll() {
  console.log('Downloading category images...\n');
  
  for (const [filename, url] of Object.entries(images)) {
    try {
      await downloadImage(url, filename);
    } catch (error) {
      console.error(`Failed to download ${filename}`);
    }
  }
  
  console.log('\nDone! Please verify the images and optimize them if needed.');
  console.log('Recommended: Use https://tinyjpg.com to compress images to <500KB');
}

downloadAll();
