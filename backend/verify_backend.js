const path = require('path');
const fs = require('fs');

console.log("🔍 Running backend module integrity checks...");

const filesToVerify = [
  { name: 'User Model', path: './models/User' },
  { name: 'Product Model', path: './models/Product' },
  { name: 'Auth Middleware', path: './middleware/auth' },
  { name: 'Cloudinary Utils', path: './utils/cloudinary' },
  { name: 'Auth Route', path: './routes/auth' },
  { name: 'Products Route', path: './routes/products' }
];

let errors = 0;

// Set dummy env variables so loading modules doesn't fail due to validation
process.env.JWT_SECRET = 'verify_test_secret';
process.env.CLOUDINARY_CLOUD_NAME = 'verify_cloud';
process.env.CLOUDINARY_API_KEY = 'verify_key';
process.env.CLOUDINARY_API_SECRET = 'verify_secret';

for (const file of filesToVerify) {
  try {
    console.log(`  Checking module: ${file.name}...`);
    require(file.path);
    console.log(`  ✅ ${file.name} loaded and compiled successfully without syntax errors.`);
  } catch (err) {
    console.error(`  ❌ Failed to load ${file.name}:`, err.message);
    errors++;
  }
}

if (errors > 0) {
  console.error(`\n❌ Backend integrity verification failed with ${errors} error(s).`);
  process.exit(1);
} else {
  console.log("\n🎉 All backend files and routes are 100% syntactically correct and module-ready!");
}
