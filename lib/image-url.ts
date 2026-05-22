export function resolveImageUrl(url: string | null | undefined) {
  const trimmedUrl = url?.trim();
  if (!trimmedUrl) return "";

  const driveFileMatch = trimmedUrl.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)(?:\/|\?|$)/);
  if (driveFileMatch?.[1]) {
    return `/api/image-proxy?url=${encodeURIComponent(trimmedUrl)}`;
  }

  const driveOpenMatch = trimmedUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (trimmedUrl.includes("drive.google.com") && driveOpenMatch?.[1]) {
    return `/api/image-proxy?url=${encodeURIComponent(trimmedUrl)}`;
  }

  if (
    trimmedUrl.includes("googleusercontent.com") ||
    trimmedUrl.includes("drive.usercontent.google.com")
  ) {
    return `/api/image-proxy?url=${encodeURIComponent(trimmedUrl)}`;
  }

  return trimmedUrl;
}