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

const parseYoutubeStartParam = (raw?: string | null) => {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed);
  }
  const match = trimmed.match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)/i);
  if (!match) return null;
  const hours = match[1] ? Number(match[1]) * 3600 : 0;
  const minutes = match[2] ? Number(match[2]) * 60 : 0;
  const seconds = match[3] ? Number(match[3]) : 0;
  const total = hours + minutes + seconds;
  return total > 0 ? total : null;
};

const buildYoutubeEmbedUrl = (parsed: URL) => {
  let videoId = "";
  if (matchesHost(parsed.hostname, "youtu.be")) {
    videoId = parsed.pathname.split("/").filter(Boolean)[0] ?? "";
  } else {
    videoId = parsed.searchParams.get("v") ?? "";
    if (!videoId) {
      const pathParts = parsed.pathname.split("/").filter(Boolean);
      const embedIndex = pathParts.indexOf("embed");
      if (embedIndex > -1 && pathParts[embedIndex + 1]) {
        videoId = pathParts[embedIndex + 1];
      }
    }
  }

  if (!videoId) return null;

  const embed = new URL(`https://www.youtube.com/embed/${videoId}`);
  const startParam = parseYoutubeStartParam(parsed.searchParams.get("start") ?? parsed.searchParams.get("t"));
  if (startParam) {
    embed.searchParams.set("start", startParam.toString());
  }
  return embed.toString();
};

const buildVimeoEmbedUrl = (parsed: URL) => {
  const segments = parsed.pathname.split("/").filter(Boolean);
  const videoId = segments[segments.length - 1];
  if (!videoId) return null;
  return `https://player.vimeo.com/video/${videoId}`;
};

const ensureHttpsProtocol = (parsed: URL) => {
  if (parsed.protocol !== "https:") {
    parsed.protocol = "https:";
  }
  return parsed;
};

export const toEmbedUrl = (url: string) => {
  const trimmed = url.trim();
  if (!trimmed) return "";
  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase();

    if (YOUTUBE_DOMAINS.some((domain) => matchesHost(host, domain))) {
      return buildYoutubeEmbedUrl(parsed) ?? ensureHttpsProtocol(parsed).toString();
    }

    if (VIMEO_DOMAINS.some((domain) => matchesHost(host, domain))) {
      return buildVimeoEmbedUrl(parsed) ?? ensureHttpsProtocol(parsed).toString();
    }

    return ensureHttpsProtocol(parsed).toString();
  } catch {
    return trimmed;
  }
};
