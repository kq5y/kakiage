import { v2 as cloudinary } from "cloudinary";

const EAGER_TRANSFORMATION = "w_1000,c_limit,f_avif,q_auto";
const FOLDER_NAME = "kakiage-img";

const getSignature = (env: Bindings) => {
  const timestamp = Math.round(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request({
    timestamp,
    eager: EAGER_TRANSFORMATION,
    folder: FOLDER_NAME,
  }, env.CLOUDINARY_API_SECRET);
  return { timestamp, signature };
}

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
    url: `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/upload`
  };
}
