import { Modal, StyleSheet, View } from "react-native";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useVideoPlayer, VideoView } from "expo-video";

export default function VideoModal({
  data,
  visible,
  onClose,
}: {
  data: string | null;
  visible: boolean;
  onClose: () => void;
}) {
  let player;

  if (data) {
    player = useVideoPlayer(data, (player) => {
      player.loop = true;
      player.play();
    });
  }

  if (!player) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      style={{ backgroundColor: "#000" }}
    >
      <View style={styles.container}>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Ionicons name="close" size={35} color="#fff" />
        </TouchableOpacity>

        {/* 3. Hiển thị VideoView */}
        <VideoView
          style={styles.video}
          player={player!}
          allowsFullscreen
          allowsPictureInPicture
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000", // Đặt nền đen cho chuẩn video
    justifyContent: "center",
  },
  video: {
    width: "100%",
    height: "100%", // Hoặc set chiều cao cụ thể tùy ý
  },
  closeBtn: {
    position: "absolute",
    top: 40, // Tăng lên một chút để tránh notch (tai thỏ)
    right: 20,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
  },
});
