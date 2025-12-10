// app/index.tsx
import React from "react";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  // Pantalla “dummy” mientras RootNavigator decide a dónde ir
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#f7f7f7ff",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <ActivityIndicator size="large" color="#000000ff" />
    </View>
  );
}
