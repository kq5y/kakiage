import { getHashHex } from "@/utils/hash";

const EAGER_TRANSFORMATION = "w_1000,c_limit,f_avif,q_auto";
const FOLDER_NAME = "kakiage-img";

const generateSignature = async (params: Record<string, string | number>, apiSecret: string) => {
  const sortedKeys = Object.keys(params).sort();
  const toSign = sortedKeys.map(key => `${key}=${params[key]}`).join("&") + apiSecret;
  return await getHashHex(toSign, "SHA-1");
};

const getSignature = async (env: Bindings) => {
  const timestamp = Math.round(Date.now() / 1000);
  const signature = await generateSignature(
    {
      timestamp,
      eager: EAGER_TRANSFORMATION,
      folder: FOLDER_NAME,
    },
    env.CLOUDINARY_API_SECRET,
  );
  return { timestamp, signature };
};

export const getUploadSignData = async (env: Bindings) => {
  const sig = await getSignature(env);
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
