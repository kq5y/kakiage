const EAGER_TRANSFORMATION = "w_1000,c_limit,f_avif,q_auto";
const FOLDER_NAME = "kakiage-img";

const computeHash = async (input: string, algorithm: string = "SHA-1") => {
  const digest = await crypto.subtle.digest(algorithm, new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const generateSignature = async (params: Record<string, string | number>, apiSecret: string) => {
  const sortedKeys = Object.keys(params).sort();
  const toSign = sortedKeys.map((key) => `${key}=${params[key]}`).join("&") + apiSecret;
  return computeHash(toSign);
}

const getSignature = (env: Bindings) => {
  const timestamp = Math.round(Date.now() / 1000);
  const signature = generateSignature(
    {
      timestamp,
      eager: EAGER_TRANSFORMATION,
      folder: FOLDER_NAME,
    },
    env.CLOUDINARY_API_SECRET,
  );
  return { timestamp, signature };
};

export const getUploadSignData = (env: Bindings) => {
  const sig = getSignature(env);
  return {
    data: {
      signature: sig.signature,
      timestamp: sig.timestamp,
      apikey: env.CLOUDINARY_API_KEY,
      eager: EAGER_TRANSFORMATION,
      folder: FOLDER_NAME,
    },
    url: `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/upload`,
  };
};
