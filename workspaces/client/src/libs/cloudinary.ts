import type { getImageUploadSign } from "./api";

type SignDataType = Awaited<ReturnType<typeof getImageUploadSign>>;

interface UploadImageResponse {
  asset_id: string;
  public_id: string;
  version: number;
  version_id: string;
  signature: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  tags: string[];
  bytes: number;
  type: string;
  etag: string;
  placeholder: boolean;
  url: string;
  secure_url: string;
  asset_folder: string;
  display_name: string;
  original_filename: string;
  api_key: string;
  eager: {
    bytes: number;
    format: string;
    height: number;
    url: string;
    secure_url: string;
    transformation: string;
    width: number;
  }[];
}
interface UploadImageErrorResponse {
  error: {
    message: string;
  };
}

export const uploadImage = async (file: File, signData: SignDataType) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("signature", signData.data.signature);
  formData.append("timestamp", signData.data.timestamp.toString());
  formData.append("api_key", signData.data.apikey);
  formData.append("eager", signData.data.eager);
  formData.append("folder", signData.data.folder);

  const response = await fetch(signData.url, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = (await response.json()) as UploadImageErrorResponse;
    throw new Error(`Failed to upload image: ${errorData.error.message}`);
  }

  const data = (await response.json()) as UploadImageResponse;
  if (data.eager.length > 0) {
    return data.eager[0].secure_url;
  }
  return data.secure_url;
};
