import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "../firebase";

export type MediaFolder = "products" | "posts" | "events" | "resources" | "media";

const sanitize = (name: string) => name.replace(/[^\w.-]/g, "_");

export async function uploadMediaFile(file: File, folder: MediaFolder = "media"): Promise<string> {
  const filename = `${Date.now()}_${sanitize(file.name)}`;
  const fileRef = ref(storage, `${folder}/${filename}`);
  const snapshot = await uploadBytes(fileRef, file, { contentType: file.type });
  return getDownloadURL(snapshot.ref);
}

export async function deleteMediaByUrl(url: string): Promise<void> {
  try {
    const fileRef = ref(storage, url);
    await deleteObject(fileRef);
  } catch (err) {
    console.warn("deleteMediaByUrl failed:", err);
  }
}
