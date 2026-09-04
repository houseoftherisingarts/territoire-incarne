const API_KEY = import.meta.env.VITE_DAILY_API_KEY as string | undefined;
const BASE = "https://api.daily.co/v1";

const headers = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${API_KEY ?? ""}`,
});

export const createDailyRoom = async (slug: string): Promise<string> => {
  const res = await fetch(`${BASE}/rooms`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      name: slug,
      privacy: "private",
      properties: {
        enable_recording: "cloud",
        max_participants: 2,
        exp: Math.round(Date.now() / 1000) + 60 * 60 * 4,
        enable_chat: false,
      },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Daily.co room creation failed");
  return data.url as string;
};

export const createDailyToken = async (roomName: string, isOwner: boolean): Promise<string> => {
  const res = await fetch(`${BASE}/meeting-tokens`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      properties: {
        room_name: roomName,
        is_owner: isOwner,
        exp: Math.round(Date.now() / 1000) + 60 * 60 * 4,
      },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Token creation failed");
  return data.token as string;
};

/**
 * La salle d'un cours de groupe. Elle differe de celle des seances
 * individuelles sur trois points : elle accueille tout le groupe, elle vit
 * plusieurs semaines plutot que quatre heures, et elle n'enregistre RIEN.
 * Un cercle de parole ne se met pas en boite sans que chaque personne l'ait
 * demande. Le format audio ouvre la salle camera fermee.
 */
export const createDailyGroupRoom = async (
  slug: string,
  maxParticipants: number,
  expUnix: number,
  audioOnly: boolean,
): Promise<{ url: string; name: string }> => {
  const res = await fetch(`${BASE}/rooms`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      name: slug,
      privacy: "private",
      properties: {
        max_participants: Math.min(Math.max(maxParticipants, 2), 200),
        exp: expUnix,
        enable_chat: true,
        enable_recording: false,
        start_video_off: audioOnly,
        start_audio_off: true,
      },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? "Daily.co group room creation failed");
  return { url: data.url as string, name: data.name as string };
};

/** Repousse l'expiration d'une salle deja creee, quand l'horaire s'allonge. */
export const updateDailyRoomExpiry = async (roomName: string, expUnix: number): Promise<void> => {
  const res = await fetch(`${BASE}/rooms/${encodeURIComponent(roomName)}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ properties: { exp: expUnix } }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error ?? "Daily.co room update failed");
  }
};
