const ProductImage = ({ imageUrl, width = 300 }) => {
  const imageSources = optimizeImage(imageUrl, width);
  
  return (
    <picture>
      <source
        type="image/webp"
        srcSet={imageSources.webp}
      />
      <img
        src={imageSources.original}
        loading="lazy"
        width={width}
        height={Math.floor(width * 0.75)}
        style={{ backgroundColor: '#f5f5f5' }}
        alt="Product"
      />
    </picture>
  );
};