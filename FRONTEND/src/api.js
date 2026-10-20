const configuredApiUrl = (
  import.meta.env.VITE_API_URL || "https://herbhaven.onrender.com"
).trim();

export const API_ORIGIN = configuredApiUrl
  .replace(/\/+$/, "")
  .replace(/\/api$/i, "");

export const API_URL = `${API_ORIGIN}/api`;

export function getProductImageUrl(image) {
  if (typeof image !== "string" || !image.trim()) return "";
  const value = image.trim().replace(/\\/g, "/");

  if (/^(data:image\/|blob:)/i.test(value)) {
    return value;
  }

  if (/^https?:\/\//i.test(value) || value.startsWith("//")) {
    try {
      const url = new URL(value.startsWith("//") ? `https:${value}` : value);
      const uploadsIndex = url.pathname.toLowerCase().lastIndexOf("/uploads/");
      if (uploadsIndex >= 0) {
        return `${API_ORIGIN}${url.pathname.slice(uploadsIndex)}${url.search}${url.hash}`;
      }
      return value.startsWith("//") ? `https:${value}` : value;
    } catch {
      return "";
    }
  }

  const uploadsIndex = value.toLowerCase().lastIndexOf("uploads/");
  const path = uploadsIndex >= 0
    ? `/${value.slice(uploadsIndex)}`
    : value.startsWith("/")
      ? value
      : `/${value}`;
  return `${API_ORIGIN}${path}`;
}

export async function readApiResponse(response, apiName = "API") {
  const contentType = response.headers.get("content-type") || "";
  const responseText = await response.text();

  if (contentType.includes("application/json")) {
    try {
      return responseText ? JSON.parse(responseText) : {};
    } catch {
      throw new Error(
        `${apiName} returned invalid JSON (HTTP ${response.status}) from ${response.url}.`
      );
    }
  }

  if (/^\s*<!doctype html|^\s*<html/i.test(responseText)) {
    if (response.status === 404 && responseText.includes("Cannot GET")) {
      throw new Error(
        `The deployed backend does not have this endpoint (404): ${response.url}. Deploy the latest BACKEND service, then retry. The request is already reaching the backend; changing VITE_API_URL will not add the missing route.`
      );
    }
    throw new Error(
      `${apiName} returned an HTML page instead of JSON (HTTP ${response.status}) from ${response.url}. Check that the frontend Render VITE_API_URL is set to the backend origin (https://herbhaven.onrender.com), then rebuild and redeploy the frontend.`
    );
  }

  throw new Error(
    `${apiName} returned a non-JSON response (HTTP ${response.status}) from ${response.url}.`
  );
}
