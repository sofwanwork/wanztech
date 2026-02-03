/**
 * Compresses an image file to be under a certain size (default 1MB)
 * while maintaining reasonable quality.
 */
export async function compressImage(file: File, maxSizeMB: number = 1): Promise<File> {
  const maxSize = maxSizeMB * 1024 * 1024;

  // If file is already smaller than the limit, return it as is
  if (file.size <= maxSize) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Initial Max Dimension Constraint (e.g., max 2000px) based on original aspect ratio
        // This helps reduce huge images immediately before compression loop
        const MAX_DIMENSION = 2000;
        if (width > height) {
          if (width > MAX_DIMENSION) {
            height *= MAX_DIMENSION / width;
            width = MAX_DIMENSION;
          }
        } else {
          if (height > MAX_DIMENSION) {
            width *= MAX_DIMENSION / height;
            height = MAX_DIMENSION;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Compression loop: Reduce quality until it fits or hits minimum quality
        let quality = 0.9;
        const compress = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Canvas to Blob conversion failed'));
                return;
              }

              if (blob.size <= maxSize || quality <= 0.1) {
                // If satisfied or quality too low, accept it
                const compressedFile = new File([blob], file.name, {
                  type: file.type,
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                // Reduce quality and try again
                quality -= 0.1;
                compress();
              }
            },
            file.type,
            quality
          );
        };

        compress();
      };

      img.onerror = (err) => reject(err);
    };

    reader.onerror = (err) => reject(err);
  });
}
