const cloudinary = require('cloudinary').v2;

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Parses and extracts the Cloudinary public_id from a full secure URL.
 * Supports versioned URLs and subdirectories.
 * @param {string} url - The Cloudinary image URL
 * @returns {string|null} - The extracted public_id or null
 */
function extractPublicId(url) {
  if (!url || !url.includes('cloudinary.com')) return null;
  
  try {
    const parts = url.split('/image/upload/');
    if (parts.length < 2) return null;
    
    let path = parts[1];
    const pathParts = path.split('/');
    
    // Remove the version path segment (e.g. "v1716480392") if present
    if (pathParts[0].startsWith('v') && !isNaN(pathParts[0].substring(1))) {
      pathParts.shift();
    }
    
    path = pathParts.join('/');
    
    // Remove the file extension (e.g. ".png", ".jpg")
    const dotIndex = path.lastIndexOf('.');
    if (dotIndex !== -1) {
      path = path.substring(0, dotIndex);
    }
    
    return path;
  } catch (err) {
    console.error("Failed to extract Cloudinary public ID:", err);
    return null;
  }
}

/**
 * Uploads a base64 image data string directly to Cloudinary.
 * @param {string} base64Str - The raw base64 image DataURL (starts with 'data:image/')
 * @returns {Promise<string>} - The public secure URL of the uploaded image
 */
async function uploadSingle(base64Str) {
  if (!base64Str || !base64Str.startsWith('data:')) {
    return base64Str; // Already a URL or not base64
  }
  
  try {
    const uploadResponse = await cloudinary.uploader.upload(base64Str, {
      folder: 'surgical_products',
      resource_type: 'image'
    });
    return uploadResponse.secure_url;
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    throw new Error("Failed to upload image to Cloudinary CDN: " + err.message);
  }
}

/**
 * Deletes a single image from Cloudinary using its secure URL.
 * Parses the public ID on the fly.
 * @param {string} imageUrl - The full secure URL of the hosted image
 * @returns {Promise<boolean>} - Success status of the deletion
 */
async function deleteSingle(imageUrl) {
  const publicId = extractPublicId(imageUrl);
  if (!publicId) return false;
  
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (err) {
    console.error(`Failed to delete Cloudinary asset (${publicId}):`, err);
    return false;
  }
}

module.exports = {
  uploadSingle,
  deleteSingle,
  extractPublicId
};
