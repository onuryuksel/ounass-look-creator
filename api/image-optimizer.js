/**
 * Image Optimization Utility
 * 
 * This utility provides image compression and resizing functions
 * to optimize images for API calls while maintaining quality.
 * 
 * Used by:
 * - Photo validation API
 * - Virtual try-on API
 * - Any other image processing APIs
 */

/**
 * Optimize image for API usage
 * @param {string} base64Image - Base64 encoded image
 * @param {Object} options - Optimization options
 * @param {number} options.maxSize - Maximum dimension (default: 1500)
 * @param {number} options.quality - JPEG quality 0-1 (default: 0.85)
 * @param {string} options.format - Output format (default: 'image/jpeg')
 * @returns {Promise<string>} Optimized base64 image
 */
export async function optimizeImageForAPI(base64Image, options = {}) {
  const {
    maxSize = 1500,
    quality = 0.85,
    format = 'image/jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Calculate optimal dimensions
          let { width, height } = img;
          
          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // High quality resize
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to optimized format
          const optimizedDataURL = canvas.toDataURL(format, quality);
          
          console.log(`[Image Optimizer] Original: ${base64Image.length} chars (${img.width}x${img.height})`);
          console.log(`[Image Optimizer] Optimized: ${optimizedDataURL.length} chars (${width}x${height})`);
          console.log(`[Image Optimizer] Size reduction: ${((base64Image.length - optimizedDataURL.length) / base64Image.length * 100).toFixed(1)}%`);
          
          resolve(optimizedDataURL);
        } catch (error) {
          console.error('[Image Optimizer] Canvas processing error:', error);
          reject(error);
        }
      };
      
      img.onerror = (error) => {
        console.error('[Image Optimizer] Image load error:', error);
        reject(new Error('Failed to load image for optimization'));
      };
      
      img.src = base64Image;
    } catch (error) {
      console.error('[Image Optimizer] General error:', error);
      reject(error);
    }
  });
}

/**
 * Optimize image for photo validation (smaller size, faster processing)
 * @param {string} base64Image - Base64 encoded image
 * @returns {Promise<string>} Optimized base64 image for validation
 */
export async function optimizeForValidation(base64Image) {
  return optimizeImageForAPI(base64Image, {
    maxSize: 800,  // Smaller for faster validation
    quality: 0.7,  // Lower quality for validation
    format: 'image/jpeg'
  });
}

/**
 * Optimize image for virtual try-on (higher quality)
 * @param {string} base64Image - Base64 encoded image
 * @returns {Promise<string>} Optimized base64 image for try-on
 */
export async function optimizeForTryOn(base64Image) {
  return optimizeImageForAPI(base64Image, {
    maxSize: 1500, // Higher resolution for better results
    quality: 0.85, // Higher quality for try-on
    format: 'image/jpeg'
  });
}

/**
 * Check if image needs optimization
 * @param {string} base64Image - Base64 encoded image
 * @param {number} maxSize - Maximum size threshold in characters
 * @returns {boolean} True if optimization is needed
 */
export function needsOptimization(base64Image, maxSize = 2000000) {
  return base64Image.length > maxSize;
}

/**
 * Get image dimensions from base64
 * @param {string} base64Image - Base64 encoded image
 * @returns {Promise<{width: number, height: number}>} Image dimensions
 */
export async function getImageDimensions(base64Image) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height
      });
    };
    
    img.onerror = (error) => {
      reject(new Error('Failed to load image for dimension check'));
    };
    
    img.src = base64Image;
  });
}
