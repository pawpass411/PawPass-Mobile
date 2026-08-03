import * as Location from "expo-location";

export type DeviceCoordinates = { lat: number; lng: number };

export async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function coordinates(position: Location.LocationObject): DeviceCoordinates {
  return { lat: position.coords.latitude, lng: position.coords.longitude };
}

export async function getUsableLocation(timeoutMs = 12_000): Promise<DeviceCoordinates | null> {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== "granted") return null;

  const recent = await Location.getLastKnownPositionAsync({
    maxAge: 5 * 60 * 1000,
    requiredAccuracy: 5_000,
  }).catch(() => null);
  if (recent) return coordinates(recent);

  const current = await withTimeout(
    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
    timeoutMs,
    "Location took too long. Try again or search by city or ZIP.",
  );
  return coordinates(current);
}
