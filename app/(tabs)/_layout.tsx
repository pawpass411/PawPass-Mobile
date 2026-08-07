import { Tabs, router } from "expo-router";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-expo";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../../src/lib/theme";
import { api } from "../../src/lib/api";

function TabIcon({
  focused,
  name,
}: {
  focused: boolean;
  name: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={{ alignItems: "center", justifyContent: "center", paddingTop: 4 }}>
      <Ionicons name={name} size={24} color={focused ? Colors.info : Colors.muted} />
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { isLoaded, isSignedIn } = useAuth();
  const [roleChecked,setRoleChecked] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) { setRoleChecked(true); return; }
    api.users.me().then(({user}) => {
      if (["BUSINESS","STAFF","ADMIN","SUPERADMIN"].includes(user.role)) router.replace("/business/dashboard");
      else setRoleChecked(true);
    }).catch(() => setRoleChecked(true));
  },[isLoaded,isSignedIn]);

  if (!isLoaded || (isSignedIn && !roleChecked)) return null;

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 8,
          height: 62 + (insets.bottom > 0 ? insets.bottom : 8),
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
        },
        tabBarActiveTintColor: Colors.info,
        tabBarInactiveTintColor: Colors.muted,
        headerStyle: { backgroundColor: Colors.surface },
        headerTintColor: Colors.accent,
        headerTitleStyle: { color: Colors.text, fontWeight: "800" },
        headerShadowVisible: false,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} name="home" />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: "Discover",
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} name="search" />,
        }}
      />
      <Tabs.Screen
        name="parks"
        options={{
          title: "Parks",
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} name="paw" />,
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: "Rights",
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} name="shield-checkmark" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} name="person-circle" />,
        }}
      />
    </Tabs>
  );
}
