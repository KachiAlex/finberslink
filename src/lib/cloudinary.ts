import { v2 as cloudinary } from "cloudinary";

const cloudinaryUrl = process.env.CLOUDINARY_URL;

if (!cloudinaryUrl) {
  throw new Error("Missing CLOUDINARY_URL environment variable");
}

cloudinary.config({
  secure: true,
  url: cloudinaryUrl,
});

export { cloudinary };
