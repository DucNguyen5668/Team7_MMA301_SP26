import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect, useState } from "react";
import {
  Modal,
  TouchableOpacity,
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { API } from "../../services/api";

interface VideoModalProps {
  messageId: string | null; 
  visible: boolean;
  onClose: () => void;
}

export default function VideoModal({
  messageId,
  visible,
  onClose,
}: VideoModalProps) {
  const [videoData, setVideoData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch video data khi modal mở
  useEffect(() => {
    if (!visible || !messageId) return;

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        setVideoData(null);

        const { data } = await API.get(`/messages/${messageId}/video`);

        if (!cancelled) setVideoData(data.data);
      } catch {
        if (!cancelled) setError("Không thể tải video");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [visible, messageId]);

  // Reset khi đóng
  const handleClose = () => {
    setVideoData(null);
    setError(null);
    onClose();
  };

  const player = useVideoPlayer(videoData ?? "", (p) => {
    if (videoData) p.play();
  });

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <View style={styles.container}>
        <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
          <Ionicons name="close-circle" size={36} color="#fff" />
        </TouchableOpacity>

        {loading && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#FDD835" />
            <Text style={styles.loadingText}>Đang tải video...</Text>
          </View>
        )}

        {error && !loading && (
          <View style={styles.center}>
            <Ionicons name="alert-circle-outline" size={40} color="#FF5722" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {videoData && !loading && (
          <VideoView
            player={player}
            style={styles.video}
            contentFit="contain"
            nativeControls
          />
        )}
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
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    color: "#ccc",
    fontSize: 14,
  },
  errorText: {
    color: "#FF5722",
    fontSize: 14,
  },
});