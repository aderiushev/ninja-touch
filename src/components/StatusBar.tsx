import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { DiscoveryState, Role } from "../ble/discovery";
import { colors, fonts, fontSizes, spacing, borders } from "../theme";

interface Props {
  state: DiscoveryState;
  role: Role;
  peerName: string | null;
  localName: string;
  error: string | null;
}

const STATUS_CONFIG: Record<
  DiscoveryState,
  { label: string; bg: string; fg: string }
> = {
  idle: { label: "IDLE", bg: colors.surfaceRaised, fg: colors.textMuted },
  discovering: { label: "SCANNING", bg: colors.yellow, fg: colors.textDark },
  negotiating: { label: "LINKING", bg: colors.cyan, fg: colors.textDark },
  connected: { label: "LINKED", bg: colors.mint, fg: colors.textDark },
  disconnected: { label: "LOST", bg: colors.error, fg: colors.text },
};

export function StatusBar({ state, peerName, localName, error }: Props) {
  const config = STATUS_CONFIG[state];

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {/* Status badge with hard shadow */}
        <View style={styles.badgeWrap}>
          <View style={[styles.badgeShadow, { backgroundColor: colors.border }]} />
          <View style={[styles.badge, { backgroundColor: config.bg }]}>
            <Text style={[styles.badgeText, { color: config.fg }]}>
              {config.label}
            </Text>
          </View>
        </View>

        {/* Peer info */}
        {state === "connected" && peerName && (
          <Text style={styles.peerText}>{peerName}</Text>
        )}
        {state === "discovering" && (
          <Text style={styles.selfText}>{localName}</Text>
        )}
      </View>

      {error && (
        <View style={styles.errorRow}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.divider} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  badgeWrap: {
    position: "relative",
  },
  badgeShadow: {
    position: "absolute",
    top: 3,
    left: 3,
    right: -3,
    bottom: -3,
  },
  badge: {
    borderWidth: borders.medium,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  badgeText: {
    fontFamily: fonts.body,
    fontWeight: "900",
    fontSize: fontSizes.xs,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  peerText: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.sm,
    color: colors.text,
    fontWeight: "700",
  },
  selfText: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    fontWeight: "700",
  },
  errorRow: {
    marginTop: spacing.xs,
    backgroundColor: colors.error,
    borderWidth: borders.thin,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  errorText: {
    fontFamily: fonts.body,
    fontWeight: "800",
    fontSize: fontSizes.xs,
    color: colors.text,
    textTransform: "uppercase",
  },
  divider: {
    height: borders.medium,
    backgroundColor: colors.border,
    marginTop: spacing.sm,
  },
});
