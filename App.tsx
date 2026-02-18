import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, Platform } from "react-native";
import { PermissionsAndroid } from "react-native";
import { SafeAreaView } from "react-native";
import { ChatScreen } from "./src/components/ChatScreen";
import { HardShadow } from "./src/components/HardShadow";
import { colors, fonts, fontSizes, spacing, borders } from "./src/theme";

async function requestPermissions(): Promise<boolean> {
  if (Platform.OS === "android") {
    const apiLevel = Platform.Version;
    if (typeof apiLevel === "number" && apiLevel >= 31) {
      const results = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);
      return Object.values(results).every(
        (r) => r === PermissionsAndroid.RESULTS.GRANTED
      );
    } else {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      return result === PermissionsAndroid.RESULTS.GRANTED;
    }
  }
  return true;
}

export default function App() {
  const [permissionsGranted, setPermissionsGranted] = useState<boolean | null>(
    null
  );

  useEffect(() => {
    requestPermissions().then(setPermissionsGranted);
  }, []);

  if (permissionsGranted === null) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>INIT</Text>
        <View style={styles.loadingBar}>
          <View style={styles.loadingFill} />
        </View>
        <StatusBar style="light" />
      </View>
    );
  }

  if (!permissionsGranted) {
    return (
      <View style={styles.center}>
        <HardShadow
          shadowColor={colors.error}
          borderColor={colors.error}
          style={{ marginHorizontal: spacing.xl }}
        >
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>ACCESS DENIED</Text>
            <View style={styles.errorDivider} />
            <Text style={styles.errorBody}>
              Bluetooth + Location permissions required
            </Text>
            <Text style={styles.errorHint}>Check system settings</Text>
          </View>
        </HardShadow>
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ChatScreen />
      <StatusBar style="light" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  center: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontFamily: fonts.body,
    fontWeight: "900",
    fontSize: fontSizes.xl,
    color: colors.yellow,
    letterSpacing: 6,
    marginBottom: spacing.lg,
  },
  loadingBar: {
    width: 120,
    height: 8,
    borderWidth: borders.thin,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  loadingFill: {
    width: "40%",
    height: "100%",
    backgroundColor: colors.yellow,
  },
  errorBox: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  errorTitle: {
    fontFamily: fonts.body,
    fontWeight: "900",
    fontSize: fontSizes.lg,
    color: colors.error,
    letterSpacing: 3,
  },
  errorDivider: {
    width: 40,
    height: borders.medium,
    backgroundColor: colors.error,
    marginVertical: spacing.md,
  },
  errorBody: {
    fontFamily: fonts.body,
    fontWeight: "700",
    fontSize: fontSizes.sm,
    color: colors.text,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  errorHint: {
    fontFamily: fonts.body,
    fontWeight: "600",
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginTop: spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
