import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, fonts, fontSizes, spacing, borders } from "../theme";

interface Props {
  text: string | null;
  label: "FROM" | "TO";
}

export function MessageBubble({ text, label }: Props) {
  const isSent = label === "TO";
  const shadowColor = isSent ? colors.yellow : colors.pink;
  const bgColor = isSent ? colors.yellow : colors.surface;
  const textColor = isSent ? colors.textDark : colors.text;
  const borderColor = isSent ? colors.textDark : colors.border;
  const empty = text == null;

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: shadowColor }]}>{label}</Text>
      <View style={styles.shadowWrap}>
        <View
          style={[
            styles.shadow,
            { backgroundColor: shadowColor },
            empty && styles.dimmed,
          ]}
        />
        <View
          style={[
            styles.card,
            { backgroundColor: bgColor, borderColor },
            empty && styles.dimmed,
          ]}
        >
          <Text
            style={[
              styles.text,
              { color: textColor },
              empty && styles.textDimmed,
            ]}
          >
            {text ?? "..."}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  label: {
    fontFamily: fonts.body,
    fontWeight: "900",
    fontSize: fontSizes.xs,
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
  shadowWrap: {
    position: "relative",
  },
  shadow: {
    position: "absolute",
    top: 4,
    left: 4,
    right: -4,
    bottom: -4,
  },
  card: {
    borderWidth: borders.medium,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    position: "relative",
  },
  text: {
    fontFamily: fonts.body,
    fontWeight: "600",
    fontSize: fontSizes.base,
    lineHeight: 22,
  },
  dimmed: {
    opacity: 0.25,
  },
  textDimmed: {
    opacity: 0.5,
  },
});
