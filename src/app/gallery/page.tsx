"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { formatTime } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface PhotoData {
  id: string;
  imageUrl: string;
  dateEmis: string;
  roomName: string;
  pseudo: string;
}

interface PhotoWithError extends PhotoData {
  hasError?: boolean;
}

export default function GalleryPage() {
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoData | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraLoading, setCameraLoading] = useState<boolean>(false);
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = () => {
    setIsCameraOpen(true);
  };

  // Initialiser la caméra quand la modal s'ouvre
  useEffect(() => {
    if (!isCameraOpen) {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
      return;
    }

    let stream: MediaStream | null = null;
    let cancelled = false;

    const initCamera = async () => {
      setCameraLoading(true);
      try {
        // Attendre que l'élément vidéo soit monté dans le DOM
        let attempts = 0;
        while (!videoRef.current && attempts < 30) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          attempts++;
          console.log(
            `Tentative ${attempts}/30 - videoRef.current:`,
            videoRef.current
          );
        }

        if (!videoRef.current) {
          console.error("Élément vidéo non trouvé après 30 tentatives");
          throw new Error("Élément vidéo non disponible");
        }

        console.log("Élément vidéo trouvé:", videoRef.current);

        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        const videoEl = videoRef.current;
        if (videoEl && !cancelled) {
          videoEl.srcObject = stream;
          try {
            await videoEl.play();
          } catch (playError) {
            console.error("Erreur lors de la lecture:", playError);
          }
        } else {
          stream.getTracks().forEach((track) => track.stop());
        }
      } catch (error) {
        if (cancelled) return;

        console.error("Erreur d'accès à la caméra:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Erreur inconnue";
        alert(`Impossible d'accéder à la caméra: ${errorMessage}`);
        setIsCameraOpen(false);
        setCameraLoading(false);
      }
    };

    const timeoutId = setTimeout(() => {
      initCamera();
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      const videoElement = videoRef.current;
      if (videoElement?.srcObject) {
        const currentStream = videoElement.srcObject as MediaStream;
        currentStream.getTracks().forEach((track) => track.stop());
        videoElement.srcObject = null;
      }
    };
  }, [isCameraOpen]);

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
    setCapturedImage(null);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (video.readyState < 2) {
        alert("Veuillez attendre que la vidéo soit prête");
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      if (context) {
        context.fillStyle = "#FFFFFF";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageDataUrl = canvas.toDataURL("image/jpeg", 0.8);
        setCapturedImage(imageDataUrl);
      }
    }
  };

  const savePhoto = () => {
    if (capturedImage) {
      if (!capturedImage.startsWith("data:image")) {
        alert("Erreur: format d'image invalide");
        return;
      }

      const photoData = {
        id: Date.now().toString(),
        imageUrl: capturedImage,
        dateEmis: new Date().toISOString(),
        roomName: "Galerie",
        pseudo: user?.username || "Utilisateur",
      };

      const savedPhotos = localStorage.getItem("galleryPhotos");
      const photos = savedPhotos ? JSON.parse(savedPhotos) : [];
      photos.push(photoData);

      try {
        localStorage.setItem("galleryPhotos", JSON.stringify(photos));
        window.dispatchEvent(new Event("galleryUpdated"));
        stopCamera();
        loadPhotos();
      } catch (error) {
        console.error("Erreur lors de la sauvegarde:", error);
        if (error instanceof Error && error.name === "QuotaExceededError") {
          alert(
            "Erreur: L'espace de stockage est plein. Veuillez supprimer des photos."
          );
        } else {
          alert("Erreur lors de la sauvegarde de la photo");
        }
      }
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/connexion");
      return;
    }
    loadPhotos();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "galleryPhotos") {
        loadPhotos();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    const handleCustomStorage = () => {
      loadPhotos();
    };

    window.addEventListener("galleryUpdated", handleCustomStorage);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("galleryUpdated", handleCustomStorage);
    };
  }, [isAuthenticated, router]);

  const loadPhotos = () => {
    try {
      const savedPhotos = localStorage.getItem("galleryPhotos");
      if (savedPhotos) {
        const parsedPhotos = JSON.parse(savedPhotos);
        console.log(
          "Photos chargées depuis localStorage:",
          parsedPhotos.length
        );

        // Vérifier que chaque photo a une imageUrl valide
        const validPhotos = parsedPhotos.filter((photo: PhotoData) => {
          if (!photo.imageUrl) {
            console.warn("Photo sans imageUrl:", photo.id);
            return false;
          }

          const isValid = photo.imageUrl.startsWith("data:image");
          if (!isValid) {
            console.warn(
              "Photo invalide trouvée:",
              photo.id,
              "imageUrl (début):",
              photo.imageUrl.substring(0, 50)
            );
            console.warn(
              "ImageUrl complète (premiers 200 caractères):",
              photo.imageUrl.substring(0, 200)
            );
          } else {
            console.log(
              "Photo valide:",
              photo.id,
              "Taille:",
              photo.imageUrl.length,
              "caractères"
            );
          }
          return isValid;
        });

        console.log("Photos valides:", validPhotos.length);

        // Trier par date (plus récentes en premier)
        const sortedPhotos = validPhotos.sort(
          (a: PhotoData, b: PhotoData) =>
            new Date(b.dateEmis).getTime() - new Date(a.dateEmis).getTime()
        );
        setPhotos(sortedPhotos);
      } else {
        console.log("Aucune photo trouvée dans localStorage");
      }
    } catch (error) {
      console.error("Erreur lors du chargement des photos:", error);
    } finally {
      setLoading(false);
    }
  };

  const deletePhoto = (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette photo ?")) {
      const updatedPhotos = photos.filter((photo) => photo.id !== id);
      localStorage.setItem("galleryPhotos", JSON.stringify(updatedPhotos));
      setPhotos(updatedPhotos);
      if (selectedPhoto?.id === id) {
        setSelectedPhoto(null);
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="h-full flex items-center justify-center">
        <p>Redirection vers la page de connexion...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">
            Chargement de la galerie...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              📸 Galerie de photos
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {photos.length} photo{photos.length > 1 ? "s" : ""} sauvegardée
              {photos.length > 1 ? "s" : ""}
            </p>
          </div>
          <Button
            onClick={startCamera}
            className="bg-blue-500 hover:bg-blue-600"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="mr-2"
            >
              <path
                d="M9 3H15L17 5H21C21.5304 5 22.0391 5.21071 22.4142 5.58579C22.7893 5.96086 23 6.46957 23 7V19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V7C1 6.46957 1.21071 5.96086 1.58579 5.58579C1.96086 5.21071 2.46957 5 3 5H7L9 3Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx="12"
                cy="13"
                r="4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Prendre une photo
          </Button>
        </div>
      </div>

      {photos.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">📷</div>
            <p className="text-gray-500 text-lg">Aucune photo sauvegardée</p>
            <p className="text-gray-400 text-sm mt-2">
              Prenez une photo dans le chat pour quelle apparaisse ici
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Debug: Afficher les infos des photos */}
          {process.env.NODE_ENV === "development" && (
            <div className="p-4 bg-yellow-50 border-b">
              <details className="text-xs">
                <summary className="cursor-pointer font-semibold">
                  Debug Info ({photos.length} photos)
                </summary>
                <div className="mt-2 space-y-1">
                  {photos.map((photo) => (
                    <div key={photo.id} className="bg-white p-2 rounded">
                      <p>ID: {photo.id}</p>
                      <p>URL length: {photo.imageUrl?.length || 0}</p>
                      <p>
                        URL start: {photo.imageUrl?.substring(0, 50) || "N/A"}
                        ...
                      </p>
                      <p>
                        Valid:{" "}
                        {photo.imageUrl?.startsWith("data:image") ? "✅" : "❌"}
                      </p>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          )}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative group cursor-pointer"
                  onClick={() => setSelectedPhoto(photo)}
                >
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200 hover:border-blue-500 transition-colors relative">
                    {imageErrors.has(photo.id) ? (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <div className="text-center p-4">
                          <svg
                            className="w-12 h-12 text-gray-400 mx-auto mb-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          <p className="text-xs text-gray-500">
                            Image corrompue
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log(
                                "Tentative de rechargement de l'image:",
                                photo.id
                              );
                              console.log(
                                "Image URL (premiers 200 caractères):",
                                photo.imageUrl.substring(0, 200)
                              );
                              setImageErrors((prev) => {
                                const newSet = new Set(prev);
                                newSet.delete(photo.id);
                                return newSet;
                              });
                            }}
                            className="mt-2 text-xs text-blue-500 hover:text-blue-700"
                          >
                            Réessayer
                          </button>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={photo.imageUrl}
                        alt={`Photo du ${formatTime(photo.dateEmis)}`}
                        className="w-full h-full object-cover"
                        style={{
                          display: "block",
                          position: "relative",
                          zIndex: 1,
                        }}
                        onError={(e) => {
                          console.error(
                            "❌ Erreur de chargement de l'image:",
                            photo.id
                          );
                          console.error(
                            "Image URL (début):",
                            photo.imageUrl?.substring(0, 100)
                          );
                          console.error(
                            "Image URL (longueur):",
                            photo.imageUrl?.length
                          );
                          console.error(
                            "Image URL (fin):",
                            photo.imageUrl?.substring(
                              Math.max(0, photo.imageUrl.length - 50)
                            )
                          );
                          console.error("Élément img:", e.target);
                          setImageErrors((prev) => new Set(prev).add(photo.id));
                        }}
                        onLoad={(e) => {
                          console.log(
                            "✅ Image chargée avec succès:",
                            photo.id
                          );
                          console.log(
                            "Dimensions:",
                            e.currentTarget.naturalWidth,
                            "x",
                            e.currentTarget.naturalHeight
                          );
                          setImageErrors((prev) => {
                            const newSet = new Set(prev);
                            newSet.delete(photo.id);
                            return newSet;
                          });
                        }}
                      />
                    )}
                    {/* Overlay au survol */}
                    <div className="absolute inset-0 bg-opacity-0 group-hover:bg-opacity-30 transition-opacity rounded-lg flex items-center justify-center pointer-events-none z-10">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg
                          className="w-8 h-8 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM15 10a5 5 0 11-10 0 5 5 0 0110 0z"
                          />
                        </svg>
                      </div>
                    </div>
                    {/* Date au survol */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      <p className="text-white text-xs truncate">
                        {formatTime(photo.dateEmis)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Modal pour afficher la photo en grand */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative max-w-4xl max-h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 z-10 bg-white/90 hover:bg-white rounded-full p-2 transition-colors"
              aria-label="Fermer"
            >
              <svg
                className="w-6 h-6 text-gray-800"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <img
              src={selectedPhoto.imageUrl}
              alt={`Photo du ${formatTime(selectedPhoto.dateEmis)}`}
              className="max-w-full max-h-[90vh] rounded-lg bg-white"
              onError={(e) => {
                console.error(
                  "❌ Erreur dans la modal - Image ID:",
                  selectedPhoto.id
                );
                console.error(
                  "Image URL (début):",
                  selectedPhoto.imageUrl?.substring(0, 100)
                );
                console.error(
                  "Image URL (longueur):",
                  selectedPhoto.imageUrl?.length
                );
              }}
              onLoad={() => {
                console.log(
                  "✅ Image chargée dans la modal:",
                  selectedPhoto.id
                );
              }}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 rounded-b-lg">
              <div className="flex items-center justify-between text-white">
                <div>
                  <p className="font-semibold">{selectedPhoto.pseudo}</p>
                  <p className="text-sm text-gray-300">
                    {formatTime(selectedPhoto.dateEmis)}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {decodeURIComponent(selectedPhoto.roomName)}
                  </p>
                </div>
                <button
                  onClick={() => deletePhoto(selectedPhoto.id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interface de la caméra */}
      {isCameraOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-4 max-w-md w-full mx-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-4 text-white">
                {(() => {
                  if (capturedImage) return "Photo capturée";
                  if (cameraLoading) return "Initialisation de la caméra...";
                  return "Prendre une photo";
                })()}
              </h3>

              {!capturedImage && (
                <div className="relative">
                  {cameraLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-lg z-10">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                        <span className="ml-2 text-white">
                          Chargement de la caméra...
                        </span>
                      </div>
                    </div>
                  )}
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full rounded-lg bg-gray-100"
                    style={{ minHeight: "200px" }}
                    onLoadedMetadata={() => {
                      setCameraLoading(false);
                    }}
                    onCanPlay={() => {
                      setCameraLoading(false);
                    }}
                    onPlaying={() => {
                      setCameraLoading(false);
                    }}
                    onError={(e) => {
                      console.error("Erreur vidéo:", e);
                      setCameraLoading(false);
                      alert("Erreur lors du chargement de la vidéo");
                    }}
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="flex justify-center space-x-2 mt-4">
                    <Button
                      onClick={capturePhoto}
                      className="bg-blue-500 hover:bg-blue-600"
                      disabled={cameraLoading}
                    >
                      📸 Capturer
                    </Button>
                    <Button onClick={stopCamera} variant="outline">
                      Annuler
                    </Button>
                  </div>
                </div>
              )}

              {capturedImage && (
                <div>
                  <div className="relative">
                    <img
                      src={capturedImage}
                      alt="Aperçu"
                      className="w-full rounded-lg"
                    />
                  </div>
                  <div className="flex justify-center space-x-2 mt-4">
                    <Button
                      onClick={savePhoto}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      💾 Sauvegarder
                    </Button>
                    <Button onClick={retakePhoto} variant="outline">
                      🔄 Reprendre
                    </Button>
                    <Button onClick={stopCamera} variant="outline">
                      Annuler
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
