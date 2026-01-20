import { extractBase64FromDataUrl } from "./imageUtils";

const API_URI = "https://api.tools.gavago.fr/socketio/api";

interface RoomsResponse {
  data: Record<string, unknown>;
}

async function getRooms(): Promise<RoomsResponse> {
  const response = await fetch(`${API_URI}/rooms`);

  if (!response.ok) {
    throw new Error(`Erreur HTTP: ${response.status}`);
  }

  return response.json();
}

async function postImage(
  imageDataUrl: string,
  socketId: string,
): Promise<unknown> {
  const base64Data = extractBase64FromDataUrl(imageDataUrl);

  const apiResponse = await fetch(`${API_URI}/images/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: socketId,
      image_data: base64Data,
    }),
  });

  if (!apiResponse.ok) {
    throw new Error(`Erreur HTTP: ${apiResponse.status}`);
  }

  const data = await apiResponse.json();
  return data;
}

async function getImage(imageId: string) {
  const response = await fetch(`${API_URI}/images/${imageId}`);

  if (!response.ok) {
    throw new Error(`Erreur HTTP: ${response.status}`);
  }

  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return response.json();
  }

  // Si c'est une image, on la convertit en data URL
  const blob = await response.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

const API = {
  getRooms,
  postImage,
  getImage,
};

export default API;
