import { ref, uploadBytes, getDownloadURL, deleteObject, listAll, getMetadata } from "firebase/storage";
import { storage } from "../firebase";

export type MediaFolder = "products" | "posts" | "events" | "resources" | "media";

const sanitize = (name: string) => name.replace(/[^\w.-]/g, "_");

export async function uploadMediaFile(file: File, folder: MediaFolder = "media"): Promise<string> {
  const filename = `${Date.now()}_${sanitize(file.name)}`;
  const fileRef = ref(storage, `${folder}/${filename}`);
  const snapshot = await uploadBytes(fileRef, file, { contentType: file.type });
  return getDownloadURL(snapshot.ref);
}

/** Avatar ou bannière d'une cliente, dans son propre dossier Storage (profils/{uid}/…),
 *  distinct du dossier `media/` partagé où écrivent les sections admin. */
export async function uploadProfilPhoto(uid: string, file: File, kind: "avatar" | "banniere"): Promise<string> {
  const ext = sanitize(file.name).split(".").pop() || "jpg";
  const fileRef = ref(storage, `profils/${uid}/${kind}-${Date.now()}.${ext}`);
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

export interface FichierMedia {
  nom: string;
  url: string;
  chemin: string;
  taille: number;
  /** Type MIME tel que Storage le garde, pour distinguer une vidéo d'une photo. */
  type: string;
  /** Date de dépôt en ISO, telle que Storage la donne. */
  depose: string;
}

/** Tout ce qui dort dans un dossier de la médiathèque, du plus récent au plus ancien. */
export async function listMediaFiles(folder: MediaFolder = "media"): Promise<FichierMedia[]> {
  const { items } = await listAll(ref(storage, folder));
  const fichiers = await Promise.all(
    items.map(async (item) => {
      const [url, meta] = await Promise.all([getDownloadURL(item), getMetadata(item)]);
      return {
        nom: item.name.replace(/^\d+_/, ""),
        url,
        chemin: item.fullPath,
        taille: meta.size ?? 0,
        type: meta.contentType ?? "",
        depose: meta.timeCreated ?? "",
      };
    }),
  );
  return fichiers.sort((a, b) => b.depose.localeCompare(a.depose));
}

/** Retire un fichier de la médiathèque par son chemin Storage. */
export async function deleteMediaByPath(chemin: string): Promise<void> {
  await deleteObject(ref(storage, chemin));
}
