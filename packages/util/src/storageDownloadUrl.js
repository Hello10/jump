const BASE_PATH = 'https://firebasestorage.googleapis.com/v0/b';

export default function storageDownloadUrl ({bucket, key}) {
  key = key.replace(/^\//, '');
  key = encodeURIComponent(key);
  return `${BASE_PATH}/${bucket}/o/${key}?alt=media`;
}
