import React, { type ReactNode } from "react";
import { View, type ViewStyle } from "react-native";
import { colors, borders, shadows } from "../theme";

interface Props {
  children: ReactNode;
  shadowColor?: string;
  shadowSize?: "small" | "medium" | "large";
  borderColor?: string;
  borderWidth?: number;
  backgroundColor?: string;
  style?: ViewStyle;
}

export function HardShadow({
  children,
  shadowColor = colors.border,
  shadowSize = "medium",
  borderColor = colors.border,
  borderWidth = borders.medium,
  backgroundColor = colors.surface,
  style,
}: Props) {
  const offset = shadows[shadowSize];

  return (
    <View style={[{ position: "relative" }, style]}>
      {/* Shadow layer */}
      <View
        style={{
          position: "absolute",
          top: offset.y,
          left: offset.x,
          right: -offset.x,
          bottom: -offset.y,
          backgroundColor: shadowColor,
        }}
      />
      {/* Main content layer */}
      <View
        style={{
          backgroundColor,
          borderWidth,
          borderColor,
          position: "relative",
        }}
      >
        {children}
      </View>
    </View>
  );
}
