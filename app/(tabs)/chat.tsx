import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
  Text,
} from "react-native";
import { Audio } from "expo-av";
import * as Speech from "expo-speech";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function ChatScreen() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState("");
  const colorScheme = useColorScheme() ?? "light";

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setIsRecording(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      setIsRecording(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Here you would typically send the audio file to a speech-to-text service
      // For demo purposes, we'll use a mock transcription
      setTranscribedText(
        "This is a sample transcription. In a real app, you would integrate with a speech-to-text service."
      );

      setRecording(null);
    } catch (err) {
      console.error("Failed to stop recording", err);
    }
  };

  const handleSend = useCallback(() => {
    if (transcribedText.trim()) {
      // Here you would typically send the message to your backend
      console.log("Sending message:", transcribedText);
      setTranscribedText("");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [transcribedText]);

  const handleCancel = useCallback(() => {
    setTranscribedText("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Chat</ThemedText>
      </ThemedView>

      <ThemedView style={styles.messageContainer}>
        {transcribedText ? (
          <Text>{transcribedText}</Text>
        ) : (
          //   <TextInput
          //     style={[
          //       styles.transcriptionInput,
          //       { color: Colors[colorScheme].text },
          //     ]}
          //     value={transcribedText}
          //     onChangeText={setTranscribedText}
          //     multiline
          //     autoFocus
          //     placeholder="Edit your message..."
          //     placeholderTextColor={Colors[colorScheme].tabIconDefault}
          //   />
          <ThemedText style={styles.placeholder}>
            Press and hold the microphone button to start recording
          </ThemedText>
        )}
      </ThemedView>

      <ThemedView style={styles.footer}>
        {transcribedText ? (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
            >
              <ThemedText>Cancel</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.sendButton]}
              onPress={handleSend}
            >
              <ThemedText style={styles.sendButtonText}>Send</ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.micButton, isRecording && styles.micButtonRecording]}
            onPressIn={startRecording}
            onPressOut={stopRecording}
          >
            <IconSymbol
              name="paperplane.fill"
              size={32}
              color={isRecording ? "#ff4444" : Colors[colorScheme].background}
            />
          </TouchableOpacity>
        )}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: Platform.OS === "ios" ? 60 : 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  messageContainer: {
    flex: 1,
    padding: 16,
    paddingBottom: 100, // Add space for the larger button
  },
  transcriptionInput: {
    fontSize: 18,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    minHeight: 100,
  },
  placeholder: {
    textAlign: "center",
    marginTop: 20,
    opacity: 0.5,
  },
  footer: {
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 50 : 30,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: Colors.light.background, // Add background color to footer
    position: "absolute", // Position footer at bottom
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
  },
  sendButton: {
    backgroundColor: "#0a7ea4",
  },
  sendButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  micButton: {
    alignSelf: "center",
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#0a7ea4",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5, // Android shadow
    shadowColor: "#000", // iOS shadow
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1000, // Ensure button stays above other elements
  },
  micButtonRecording: {
    backgroundColor: "#ff4444",
  },
});
