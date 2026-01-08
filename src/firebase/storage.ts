'use client';

import {
  FirebaseStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';

/**
 * Uploads a file to Firebase Storage.
 * @param storage The Firebase Storage instance.
 * @param path The path where the file should be stored.
 * @param file The file to upload.
 * @param onProgress Optional callback to track upload progress.
 * @returns A promise that resolves with the download URL of the uploaded file.
 */
export function uploadFile(
  storage: FirebaseStorage,
  path: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) {
          onProgress(progress);
        }
      },
      (error) => {
        // Handle unsuccessful uploads
        reject(error);
      },
      () => {
        // Handle successful uploads on complete
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          resolve(downloadURL);
        });
      }
    );
  });
}
