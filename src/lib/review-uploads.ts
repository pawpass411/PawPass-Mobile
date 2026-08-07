import { api } from "./api";

export type UploadableReviewImage = { uri: string; name: string; mimeType: string; uploadedUrl?: string };
export type ReviewUploadKind = "public" | "verification" | "receipt";

export async function uploadReviewImages(
  images: UploadableReviewImage[],
  kind: ReviewUploadKind,
  onUploaded?: (index: number, url: string) => Promise<void> | void,
) {
  const urls: string[] = [];
  for (let index = 0; index < images.length; index += 1) {
    const image = images[index];
    if (image.uploadedUrl) {
      urls.push(image.uploadedUrl);
      continue;
    }
    const form = new FormData();
    form.append("kind", kind);
    form.append("file", { uri: image.uri, name: image.name, type: image.mimeType } as any);
    const { url } = await api.reviewUploads.create(form);
    urls.push(url);
    await onUploaded?.(index, url);
  }
  return urls;
}
