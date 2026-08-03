import { Tabs } from "expo-router";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../../src/lib/theme";

function TabIcon({
  focused,
  name,
}: {
  focused: boolean;
  name: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={{ alignItems: "center", justifyContent: "center", paddingTop: 4 }}>
      <Ionicons name={name} size={24} color={focused ? Colors.accent : Colors.muted} />
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();

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
        tabBarActiveTintColor: Colors.accent,
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
