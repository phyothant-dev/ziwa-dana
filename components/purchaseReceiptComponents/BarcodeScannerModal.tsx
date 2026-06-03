import { Ionicons } from "@expo/vector-icons";
import { CameraView } from "expo-camera";
import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface BarcodeScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onBarcodeScanned: (data: { type: string; data: string }) => void;
  themeColor: string;
  instructions: string;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  visible,
  onClose,
  onBarcodeScanned,
  themeColor,
  instructions,
}) => {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.cameraScreenContainer}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          barcodeScannerSettings={{
            barcodeTypes: ["qr", "ean13", "ean8", "code128"],
          }}
          onBarcodeScanned={onBarcodeScanned}
        />
        <View style={styles.cameraOverlayMask}>
          <View style={styles.reticleTargetFrame}>
            <View
              style={[styles.cornerMarker, styles.topLeftCorner, { borderColor: themeColor }]}
            />
            <View
              style={[styles.cornerMarker, styles.topRightCorner, { borderColor: themeColor }]}
            />
            <View
              style={[styles.cornerMarker, styles.bottomLeftCorner, { borderColor: themeColor }]}
            />
            <View
              style={[styles.cornerMarker, styles.bottomRightCorner, { borderColor: themeColor }]}
            />
          </View>
          <Text style={styles.cameraInstructionsText}>{instructions}</Text>
        </View>
        <TouchableOpacity style={styles.closeCameraFabButton} onPress={onClose}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  cameraScreenContainer: { flex: 1, backgroundColor: "#000" },
  cameraOverlayMask: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  reticleTargetFrame: { width: 240, height: 240, position: "relative" },
  cornerMarker: { position: "absolute", width: 24, height: 24, borderWidth: 4 },
  topLeftCorner: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  topRightCorner: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeftCorner: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRightCorner: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  cameraInstructionsText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 24,
    textAlign: "center",
    paddingHorizontal: 32,
  },
  closeCameraFabButton: {
    position: "absolute",
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
});
