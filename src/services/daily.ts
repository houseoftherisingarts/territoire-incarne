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
