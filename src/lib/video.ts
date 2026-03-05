const YOUTUBE_DOMAINS = ["youtube.com", "youtu.be"];
const VIMEO_DOMAINS = ["vimeo.com"];
const CLOUDINARY_DOMAIN = "res.cloudinary.com";

const allowedHosts = [...YOUTUBE_DOMAINS, ...VIMEO_DOMAINS, CLOUDINARY_DOMAIN];

const matchesHost = (host: string, domain: string) =>
  host === domain || host.endsWith(`.${domain}`);

const getHost = (url: string) => {
  try {
    const parsed = new URL(url);
    return parsed.hostname.toLowerCase();
  } catch {
    return "";
  }
};

export const isIframeVideoHost = (url: string) => {
  const host = getHost(url);
  return [...YOUTUBE_DOMAINS, ...VIMEO_DOMAINS].some((domain) => matchesHost(host, domain));
};

export const isCloudinaryVideoUrl = (url: string) => {
  const host = getHost(url);
  return matchesHost(host, CLOUDINARY_DOMAIN);
};

export const isVideoUrlValid = (url: string) => {
  const trimmed = url.trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return false;
    }
    const host = parsed.hostname.toLowerCase();
    return allowedHosts.some((domain) => matchesHost(host, domain));
  } catch {
    return false;
  }
};

export const toEmbedUrl = (url: string) => {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.includes("youtube.com/watch?v=")) {
    return trimmed.replace("watch?v=", "embed/");
  }
  if (trimmed.includes("youtu.be/")) {
    const id = trimmed.split("youtu.be/")[1]?.split("?")[0];
    return id ? `https://www.youtube.com/embed/${id}` : trimmed;
  }
  if (trimmed.includes("vimeo.com/")) {
    const id = trimmed.split("vimeo.com/")[1]?.split("?")[0];
    return id ? `https://player.vimeo.com/video/${id}` : trimmed;
  }
  return trimmed;
};
