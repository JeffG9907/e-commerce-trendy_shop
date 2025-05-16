export const convertGoogleDriveUrl = (url) => {
  if (!url) return '';
  if (url.includes('uc?export=view')) return url;

  let id = '';
  if (url.includes('drive.google.com/file/d/')) {
    id = url.split('/file/d/')[1].split('/')[0];
    return `https://drive.google.com/thumbnail?id=${id}&sz=w1000`;
  } else if (url.includes('drive.google.com/drive/folders/')) {
    id = url.split('drive.google.com/drive/folders/')[1].split('?')[0];
  } else if (url.includes('drive.google.com/drive/u/0/folders/')) {
    id = url.split('drive.google.com/drive/u/0/folders/')[1].split('?')[0];
  } else if (url.includes('drive.google.com/open?id=')) {
    id = url.split('open?id=')[1];
  } else if (url.includes('drive.google.com/uc?id=')) {
    id = url.split('uc?id=')[1];
  } else {
    const matches = url.match(/[-\w]{25,}/);
    id = matches ? matches[0] : '';
  }

  if (!id) return url;
  return `https://drive.google.com/thumbnail?id=${id}&sz=w1000`;
};



