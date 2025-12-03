# Image Optimization - Quick Start

## Installation

The image optimization features require the `sharp` package. To install it:

```bash
cd backend
npm install sharp
```

## Features Implemented

### 1. Fallback Images ✅
Two SVG fallback images have been created:
- `public/assets/placeholder.svg` - Used when no image is available
- `public/assets/error-image.svg` - Used when an image fails to load

### 2. Frontend Image Utilities ✅
A comprehensive image utilities module (`public/scripts/image-utils.js`) provides:
- Automatic error handling for all images
- WebP format detection and support
- Responsive image srcset generation
- Image preloading capabilities
- Global error handlers for failed images

### 3. Backend Image Optimizer ✅
A backend utility (`backend/utils/imageOptimizer.js`) provides:
- WebP conversion with configurable quality
- Responsive image size generation (thumbnail, small, medium, large)
- Batch image processing
- Image metadata extraction

### 4. Batch Conversion Script ✅
A CLI tool (`backend/scripts/convert-images-to-webp.js`) for converting existing images:
```bash
cd backend
npm run convert-images
```

## Usage

### Frontend - Automatic Error Handling

The image utilities are automatically loaded and initialized. All images will:
- Show placeholder when src is empty
- Show error fallback when loading fails
- Support lazy loading with Intersection Observer

```html
<!-- Images automatically get error handling -->
<img src="/uploads/project.jpg" alt="Project" loading="lazy">
```

### Frontend - Manual Image Creation

```javascript
// Create an image with all optimizations
const img = ImageUtils.createImage({
  src: '/uploads/project.jpg',
  alt: 'Project Image',
  loading: 'lazy',
  responsive: true  // Enables srcset for responsive images
});

document.getElementById('container').appendChild(img);
```

### Backend - Convert Existing Images

```bash
# Navigate to backend
cd backend

# Install dependencies (if not already installed)
npm install

# Run the conversion script
npm run convert-images
```

This will:
1. Find all JPG and PNG images in `backend/uploads/`
2. Convert each to WebP format
3. Generate 4 responsive sizes (300px, 640px, 1024px, 1920px)
4. Preserve original images

### Backend - Programmatic Usage

```javascript
const { optimizeImage } = require('./utils/imageOptimizer');

// Optimize a single image
const result = await optimizeImage(
  '/path/to/input.jpg',
  '/path/to/output/dir',
  'image-name'
);

// Result contains:
// - main: WebP version
// - responsive: { thumbnail, small, medium, large }
```

## File Structure

```
backend/
├── utils/
│   └── imageOptimizer.js          # Image optimization utilities
├── scripts/
│   └── convert-images-to-webp.js  # Batch conversion CLI
└── uploads/                        # Image storage
    ├── image.jpg                   # Original
    ├── image.webp                  # WebP version
    ├── image-thumbnail.webp        # 300x225
    ├── image-small.webp            # 640x480
    ├── image-medium.webp           # 1024x768
    └── image-large.webp            # 1920x1440

public/
├── assets/
│   ├── placeholder.svg             # Placeholder image
│   └── error-image.svg             # Error fallback
└── scripts/
    └── image-utils.js              # Frontend utilities
```

## Benefits

- **Smaller file sizes**: WebP reduces image size by 25-35%
- **Faster loading**: Responsive images load appropriate sizes
- **Better UX**: Graceful fallbacks for missing/failed images
- **SEO friendly**: Proper alt text and lazy loading
- **Browser compatible**: Automatic WebP detection with fallbacks

## Browser Support

- **WebP**: Chrome, Firefox, Safari 14+, Edge (auto-detected)
- **Lazy Loading**: All modern browsers (native + Intersection Observer fallback)
- **Fallback Images**: All browsers (SVG)

## Next Steps

1. Install sharp: `npm install sharp` (in backend directory)
2. Upload images through the admin dashboard
3. Run conversion script: `npm run convert-images`
4. Images will automatically use WebP and responsive sizes

## Documentation

For detailed documentation, see `backend/IMAGE_OPTIMIZATION_GUIDE.md`
