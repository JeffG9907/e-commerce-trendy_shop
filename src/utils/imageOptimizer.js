import { convertGoogleDriveUrl } from './googleDriveUtils';

export const optimizeImage = (url, width) => {
  if (!url) return '/placeholder-image.jpg';
  
  if (url.includes('drive.google.com')) {
    return convertGoogleDriveUrl(url);
  }
  
  // Handle local JPG images
  if (url.includes('.jpg') || url.includes('.jpeg')) {
    const basePath = url.split('.jpg')[0].split('.jpeg')[0];
    return {
      webp: `${basePath}.webp?w=${width}`,
      original: `${url}?w=${width}`,
      placeholder: generatePlaceholder(width, Math.floor(width * 0.75))
    };
  }
  
  return url;
};

export const generatePlaceholder = (width, height, color = '#f5f5f5') => {
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${width} ${height}'%3E%3Crect width='${width}' height='${height}' fill='${color}'/%3E%3C/svg%3E`;
};