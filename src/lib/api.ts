const API_URI = "https://api.tools.gavago.fr/socketio/api";

async function getRooms() {
  const response = await fetch(`${API_URI}/rooms`);

  if (!response.ok) {
    throw new Error(`Erreur HTTP: ${response.status}`);
  }

  const data = await response.json();

  return data;
}

async function postImage(imageDataUrl: string, socketId: string) {
  // Extraire les données base64 du data URL
  // Format: "data:image/jpeg;base64,/9j/4AAQ..."
  const base64Data = imageDataUrl.split(",")[1];

  if (!base64Data) {
    throw new Error(
      "Format d'image invalide: impossible d'extraire les données base64"
    );
  }

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

  // L'API peut retourner soit une image directement, soit un JSON avec l'URL
  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    const data = await response.json();
    return data;
  } else {
    // Si c'est une image, on la convertit en data URL
    const blob = await response.blob();
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

const API = {
  getRooms,
  postImage,
  getImage,
};

export default API;
