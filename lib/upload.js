import { supabase } from './supabase';

// Read a File into an HTMLImageElement via an object URL (revoked once decoded).
function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err instanceof Error ? err : new Error('image decode failed'));
    };
    img.src = url;
  });
}

// Resize so the longest edge is `maxDim`, encode as JPEG, return a Blob.
async function resizeToBlob(file, maxDim, quality) {
  const img = await loadImage(file);
  const longest = Math.max(img.naturalWidth, img.naturalHeight);
  const scale = longest > maxDim ? maxDim / longest : 1;
  const w = Math.round(img.naturalWidth * scale);
  const h = Math.round(img.naturalHeight * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, w, h);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('canvas.toBlob returned null'))),
      'image/jpeg',
      quality,
    );
  });
}

// Resize + upload to the private `photos` bucket. Path convention:
//   <user_id>/initial/<pose>.jpg
//   <user_id>/checkin/<weekStart>/scale.jpg
// Caller owns the path naming; this just uploads with upsert so a retry overwrites cleanly.
// Returns { path } on success, { error } on failure (no exceptions thrown for upload errors).
export async function resizeAndUpload(file, storagePath, { maxDim = 1280, quality = 0.85 } = {}) {
  let blob;
  try {
    blob = await resizeToBlob(file, maxDim, quality);
  } catch (err) {
    return { error: err };
  }

  const { error } = await supabase.storage
    .from('photos')
    .upload(storagePath, blob, {
      upsert: true,
      contentType: 'image/jpeg',
      cacheControl: '3600',
    });

  if (error) return { error };
  return { path: storagePath };
}

// Generate a single signed URL. For multiple paths in one round trip, call
// supabase.storage.from('photos').createSignedUrls(paths, expiresIn) directly.
export async function signedUrl(path, expiresIn = 60 * 60 * 24) {
  const { data, error } = await supabase.storage
    .from('photos')
    .createSignedUrl(path, expiresIn);
  if (error) return { error };
  return { url: data.signedUrl };
}

// Best-effort delete — used to clean up an orphan blob when a DB insert fails
// after a successful upload. Errors are swallowed (the orphan is harmless;
// next upload to the same path overwrites it via upsert).
export async function removeIgnore(path) {
  try {
    await supabase.storage.from('photos').remove([path]);
  } catch {
    // intentional: see comment above
  }
}
