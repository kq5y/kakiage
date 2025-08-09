export type ConvertType = 'avif' | 'webp' | 'jpeg';

export async function convertImageFromBuffer(
  env: Bindings,
  buffer: ArrayBuffer,
  fileName: string,
  mimeType: string,
  convertType: ConvertType = "avif"
): Promise<File> {
  const formData = new FormData();
  const blob = new Blob([buffer], { type: mimeType });
  formData.append("image", blob);

  const response = await fetch(`${env.IMAGE_API_DOMAIN}/convert?format=${convertType}`, {
    method: "POST",
    body: formData,
    headers: {
      "X-API-KEY": env.IMAGE_API_KEY
    }
  });

  if (!response.ok) {
    throw new Error(`Image conversion failed: ${response.statusText}`);
  }

  const convertedBlob = await response.blob();
  const outName = fileName.replace(/\.[^/.]+$/, `.${convertType}`);

  return new File([convertedBlob], outName, { type: convertedBlob.type });
}

export async function hashArrayBufferToHex(buffer: ArrayBuffer): Promise<string> {
  const hashBuf = await crypto.subtle.digest('SHA-256', buffer);
  const hashArr = Array.from(new Uint8Array(hashBuf));
  return hashArr.map((b) => b.toString(16).padStart(2, '0')).join('');
}
