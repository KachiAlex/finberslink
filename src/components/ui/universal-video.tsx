"use client";

import { useState } from "react";

interface UniversalVideoProps {
  url: string;
  className?: string;
  width?: number;
  height?: number;
  autoplay?: boolean;
  muted?: boolean;
  controls?: boolean;
}

export function UniversalVideo({ 
  url, 
  className = "", 
  width = 640, 
  height = 360,
  autoplay = false,
  muted = false,
  controls = true
}: UniversalVideoProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Extract video ID and platform from URL
  const getVideoInfo = (videoUrl: string) => {
    // YouTube
    const youtubeMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
    if (youtubeMatch) {
      return {
        platform: 'youtube',
        videoId: youtubeMatch[1],
        embedUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}?rel=0&showinfo=0&modestbranding=1&autohide=1`,
      };
    }

    // Vimeo
    const vimeoMatch = videoUrl.match(/vimeo\.com\/.*?(\d+)/);
    if (vimeoMatch) {
      return {
        platform: 'vimeo',
        videoId: vimeoMatch[1],
        embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?title=0&byline=0&portrait=0`,
      };
    }

    // Google Drive
    const gdriveMatch = videoUrl.match(/drive\.google\.com\/.*?id=([^&\n?#]+)/);
    if (gdriveMatch) {
      return {
        platform: 'gdrive',
        videoId: gdriveMatch[1],
        embedUrl: `https://drive.google.com/uc?export=download&id=${gdriveMatch[1]}`,
      };
    }

    // OneDrive
    const onedriveMatch = videoUrl.match(/onedrive\.live\.com\/.*?id=([^&\n?#]+)/);
    if (onedriveMatch) {
      return {
        platform: 'onedrive',
        videoId: onedriveMatch[1],
        embedUrl: `https://onedrive.live.com/embed?cid=${onedriveMatch[1]}`,
      };
    }

    // Direct video URLs
    const directMatch = videoUrl.match(/\.(mp4|webm|ogg|mov)$/i);
    if (directMatch) {
      return {
        platform: 'direct',
        videoId: videoUrl,
        embedUrl: videoUrl,
      };
    }

    return null;
  };

  const videoInfo = getVideoInfo(url);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  if (!videoInfo) {
    return (
      <div className={`bg-slate-100 rounded-lg flex items-center justify-center ${className}`} style={{ width, height }}>
        <div className="text-center p-4">
          <div className="text-2xl mb-2">🎥</div>
          <div className="text-sm text-slate-600">Unsupported video format</div>
          <div className="text-xs text-slate-500 mt-1">Please use a supported video platform</div>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className={`bg-slate-100 rounded-lg flex items-center justify-center ${className}`} style={{ width, height }}>
        <div className="text-center p-4">
          <div className="text-2xl mb-2">⚠️</div>
          <div className="text-sm text-slate-600">Failed to load video</div>
          <div className="text-xs text-slate-500 mt-1">The video may be private or unavailable</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden ${className}`} style={{ width, height }}>
      {isLoading && (
        <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <div className="text-sm mt-2">Loading video...</div>
          </div>
        </div>
      )}
      
      <iframe
        src={videoInfo.embedUrl}
        width={width}
        height={height}
        className={`w-full h-full border-0 ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        allowFullScreen={true}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        onLoad={handleLoad}
        onError={handleError}
        title="Course Video"
        referrerPolicy="no-referrer-when-downgrade"
        allowTransparency={true}
        frameBorder="0"
        scrolling="no"
      />
    </div>
  );
}
