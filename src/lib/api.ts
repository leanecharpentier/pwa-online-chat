const API_URI = "https://api.tools.gavago.fr/socketio/api";

async function getRooms() {
  const response = await fetch(`${API_URI}/rooms`);

  if (!response.ok) {
    throw new Error(`Erreur HTTP: ${response.status}`);
  }

  const data = await response.json();

  return data;
}

const API = {
  getRooms,
};

export default API;
