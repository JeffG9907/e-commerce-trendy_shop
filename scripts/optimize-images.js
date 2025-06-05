const sharp = require('sharp');

// Redimensionar banner para diferentes tamaños
sharp('src/assets/banner.webp')
  .resize(640, 279)
  .toFile('src/assets/banner-small.webp');

sharp('src/assets/banner.webp')
  .resize(1024, 446)
  .toFile('src/assets/banner-medium.webp');

sharp('src/assets/banner.webp')
  .resize(1920, 835)
  .toFile('src/assets/banner.webp');