import { useVideoPlayer, VideoView } from "expo-video";
import { Modal, TouchableOpacity, View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface VideoModalProps {
  data: string | null;
  visible: boolean;
  onClose: () => void;
}

export default function VideoModal({
  data,
  visible,
  onClose,
}: VideoModalProps) {
  const player = useVideoPlayer(data ?? "", (p) => {
    p.play();
  });

  if (!data) return null;

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <View style={styles.container}>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Ionicons name="close-circle" size={36} color="#fff" />
        </TouchableOpacity>

        <VideoView
          player={player}
          style={styles.video}
          contentFit="contain"
          nativeControls
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
  },
  closeBtn: {
    position: "absolute",
    top: 50,
    right: 16,
    zIndex: 10,
  },
  video: {
    flex: 1,
    width: "100%",
  },
});
