export async function uploadToCloudinary(file: any) {
  // Placeholder for Cloudinary upload
  return {
    url: "",
    publicId: "",
  };
}


export const cloudinary = {
  config: {
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
  },
};
