const ALLOWED_HOSTS = new Set([
  "drive.google.com",
  "lh3.googleusercontent.com",
  "drive.usercontent.google.com",
  "lh4.googleusercontent.com",
  "lh5.googleusercontent.com",
  "lh6.googleusercontent.com",
]);

function isAllowedImageUrl(value: string) {
  try {
    const parsedUrl = new URL(value);
    return (parsedUrl.protocol === "https:" || parsedUrl.protocol === "http:") && ALLOWED_HOSTS.has(parsedUrl.hostname);
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const imageUrl = requestUrl.searchParams.get("url");

  if (!imageUrl || !isAllowedImageUrl(imageUrl)) {
    return new Response("Invalid image URL", { status: 400 });
  }

  try {
    const response = await fetch(imageUrl, {
      redirect: "follow",
    });

    if (!response.ok) {
      return new Response("Image fetch failed", { status: response.status });
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    if (!contentType.startsWith("image/")) {
      return new Response("Remote resource is not an image", { status: 415 });
    }

    return new Response(response.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch (error) {
    console.error("Image proxy error:", error);
    return new Response("Unable to proxy image", { status: 502 });
  }
}