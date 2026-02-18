import React, { useState, useRef, useEffect } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  AppState,
  type AppStateStatus,
} from "react-native";
import { StatusBar } from "./StatusBar";
import { MessageBubble } from "./MessageBubble";
import { HardShadow } from "./HardShadow";
import { useChat } from "../hooks/useChat";
import {
  monitorBluetoothState,
  type BluetoothState,
} from "../ble/central";
import { colors, fonts, fontSizes, spacing, borders } from "../theme";

export function ChatScreen() {
  const {
    sent,
    received,
    state,
    role,
    peerName,
    localName,
    error,
    sendMessage,
    start,
    destroy,
  } = useChat();

  const [inputText, setInputText] = useState("");
  const [btState, setBtState] = useState<BluetoothState>("Unknown");
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const sub = monitorBluetoothState((s) => setBtState(s));
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (btState === "PoweredOn") {
      start();
    }
  }, [btState, start]);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        if (
          appStateRef.current.match(/active/) &&
          nextAppState.match(/inactive|background/)
        ) {
          destroy();
        } else if (
          appStateRef.current.match(/inactive|background/) &&
          nextAppState === "active" &&
          btState === "PoweredOn"
        ) {
          start();
        }
        appStateRef.current = nextAppState;
      }
    );
    return () => subscription.remove();
  }, [btState, start, destroy]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const text = inputText;
    setInputText("");
    await sendMessage(text);
  };

  const isConnected = state === "connected";
  const btOff = btState === "PoweredOff";
  const hasMessages = sent != null || received != null;

  if (btOff) {
    return (
      <View style={styles.centerContainer}>
        <HardShadow
          shadowColor={colors.error}
          borderColor={colors.error}
          style={{ marginHorizontal: spacing.xl }}
        >
          <View style={styles.alertBox}>
            <Text style={styles.alertTitle}>BLUETOOTH OFF</Text>
            <Text style={styles.alertBody}>
              Turn on Bluetooth to find nearby peers
            </Text>
          </View>
        </HardShadow>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <StatusBar
        state={state}
        role={role}
        peerName={peerName}
        localName={localName}
        error={error}
      />

      <View style={styles.messageArea}>
        {hasMessages ? (
          <View style={styles.messageSlots}>
            <MessageBubble text={received} label="FROM" />
            <MessageBubble text={sent} label="TO" />
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>
              {isConnected ? "READY" : "SCANNING"}
            </Text>
            <View style={styles.emptyDivider} />
            <Text style={styles.emptyBody}>
              {isConnected
                ? "type something below"
                : "looking for peers nearby"}
            </Text>
            {!isConnected && (
              <View style={styles.scanIndicator}>
                <View style={styles.scanDot} />
                <View style={[styles.scanDot, styles.scanDot2]} />
                <View style={[styles.scanDot, styles.scanDot3]} />
              </View>
            )}
          </View>
        )}
      </View>

      {/* Input bar */}
      <View style={styles.inputOuter}>
        <View style={styles.inputShadow} />
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, !isConnected && styles.inputDisabled]}
            value={inputText}
            onChangeText={setInputText}
            placeholderTextColor={colors.textMuted}
            placeholder={isConnected ? "Type here..." : "waiting..."}
            editable={isConnected}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            multiline={false}
            maxLength={500}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!isConnected || !inputText.trim()) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!isConnected || !inputText.trim()}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.sendText,
                (!isConnected || !inputText.trim()) && styles.sendTextDisabled,
              ]}
            >
              SEND
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  messageArea: {
    flex: 1,
  },
  messageSlots: {
    flex: 1,
    justifyContent: "center",
    gap: spacing.md,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.xl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  alertBox: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  alertTitle: {
    fontFamily: fonts.body,
    fontWeight: "900",
    fontSize: fontSizes.lg,
    color: colors.text,
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  alertBody: {
    fontFamily: fonts.body,
    fontWeight: "600",
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    textAlign: "center",
  },
  emptyTitle: {
    fontFamily: fonts.body,
    fontWeight: "900",
    fontSize: fontSizes.xxl,
    color: colors.yellow,
    letterSpacing: 4,
  },
  emptyDivider: {
    width: 60,
    height: borders.thick,
    backgroundColor: colors.yellow,
    marginVertical: spacing.md,
  },
  emptyBody: {
    fontFamily: fonts.body,
    fontWeight: "600",
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  scanIndicator: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  scanDot: {
    width: 10,
    height: 10,
    backgroundColor: colors.yellow,
    borderWidth: borders.thin,
    borderColor: colors.border,
  },
  scanDot2: {
    backgroundColor: colors.pink,
  },
  scanDot3: {
    backgroundColor: colors.cyan,
  },

  // Input area
  inputOuter: {
    position: "relative",
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  inputShadow: {
    position: "absolute",
    top: 4,
    left: 4,
    right: -4,
    bottom: -4,
    backgroundColor: colors.yellow,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: borders.medium,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    position: "relative",
  },
  input: {
    flex: 1,
    fontFamily: fonts.body,
    fontWeight: "600",
    fontSize: fontSizes.base,
    color: colors.text,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: "transparent",
  },
  inputDisabled: {
    opacity: 0.35,
  },
  sendButton: {
    backgroundColor: colors.yellow,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderLeftWidth: borders.medium,
    borderLeftColor: colors.border,
  },
  sendButtonDisabled: {
    backgroundColor: colors.surfaceRaised,
  },
  sendText: {
    fontFamily: fonts.body,
    fontWeight: "900",
    fontSize: fontSizes.sm,
    color: colors.textDark,
    letterSpacing: 2,
  },
  sendTextDisabled: {
    color: colors.textMuted,
  },
});
