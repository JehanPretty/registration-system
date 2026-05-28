import { Redirect } from "expo-router";
import { useAuthStore } from "../store/authStore";
import { useEffect, useState } from "react";

export default function Index() {
  const user = useAuthStore((state: any) => state.user);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    // Check if the store has hydrated
    const unsubHydrate = useAuthStore.persist.onHydrate(() => setHasHydrated(false));
    const unsubFinishHydration = useAuthStore.persist.onFinishHydration(() => setHasHydrated(true));

    setHasHydrated(useAuthStore.persist.hasHydrated());

    return () => {
      unsubHydrate();
      unsubFinishHydration();
    };
  }, []);

  if (!hasHydrated) return null;

  if (user) {
    const lastLocation = useAuthStore.getState().lastLocation;
    return <Redirect href={lastLocation || "/(tabs)/digital-id"} />;
  }

  return <Redirect href="/(auth)/login" />;
}
