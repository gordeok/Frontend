// 구매자 - 배송 현황 조회 화면

import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Linking,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getTrackingInfo } from "../../services/chat";

const SHEET_HEIGHT = 272;

const COLORS = {
  white: "#FFFFFF",
  black: "#111111",
  gray900: "#222222",
  gray700: "#555555",
  gray500: "#999999",
  gray300: "#D8D8D8",
  yellowLight: "#FFF6D8",
  yellowBadge: "#FFF0B8",
  line: "#EFEFEF",
};

function getParamString(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function normalizeCourierType(value?: string | null) {
  const raw = String(value ?? "").trim().toUpperCase();

  if (raw.includes("CU")) return "CU 반값택배";
  if (raw.includes("GS")) return "GS 반값택배";

  const original = String(value ?? "").trim();
  return original || "GS 반값택배";
}

function getCourierTrackingUrl(courierType: string, apiUrl?: string | null) {
  const normalized = normalizeCourierType(courierType);

  if (apiUrl && apiUrl.trim().length > 0) {
    return apiUrl.trim();
  }

  if (normalized.includes("CU")) {
    return "https://www.cupost.co.kr/postbox/delivery/localResult.cupost";
  }

  return "https://www.cvsnet.co.kr/reservation-inquiry/delivery/index.do";
}

export default function TrackingStatusScreen() {
  const params = useLocalSearchParams<{
    chatRoomId?: string;
    title?: string;
    courierType?: string;
    trackingNumber?: string;
    trackingUrl?: string;
  }>();

  const chatRoomId = getParamString(params.chatRoomId);

  const [courierType, setCourierType] = useState(
    normalizeCourierType(getParamString(params.courierType))
  );
  const [trackingNumber, setTrackingNumber] = useState(
    getParamString(params.trackingNumber)
  );
  const [trackingUrl, setTrackingUrl] = useState(
    getParamString(params.trackingUrl)
  );
  const [isLoading, setIsLoading] = useState(true);

  const sheetTranslateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const dimOpacity = useRef(new Animated.Value(0)).current;

  const displayCourierType = useMemo(
    () => normalizeCourierType(courierType),
    [courierType]
  );

  const resolvedTrackingUrl = useMemo(
    () => getCourierTrackingUrl(displayCourierType, trackingUrl),
    [displayCourierType, trackingUrl]
  );

  const hasTrackingNumber = trackingNumber.trim().length > 0;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(dimOpacity, {
        toValue: 1,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.spring(sheetTranslateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 90,
        friction: 14,
      }),
    ]).start();
  }, [dimOpacity, sheetTranslateY]);

  useEffect(() => {
    const loadTrackingInfo = async () => {
      if (!chatRoomId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        const response = await getTrackingInfo(chatRoomId);

        setCourierType(normalizeCourierType(response?.courierType));
        setTrackingNumber(response?.trackingNumber || "");
        setTrackingUrl(response?.trackingUrl || "");
      } catch (error) {
        console.log("배송 현황 조회 실패:", error);

        if (!getParamString(params.trackingNumber)) {
          setCourierType(
            normalizeCourierType(getParamString(params.courierType))
          );
          setTrackingNumber(getParamString(params.trackingNumber));
          setTrackingUrl(getParamString(params.trackingUrl));
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadTrackingInfo();
  }, [chatRoomId, params.courierType, params.trackingNumber, params.trackingUrl]);

  const closeSheet = () => {
    Animated.parallel([
      Animated.timing(dimOpacity, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: SHEET_HEIGHT + 40,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.back();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 5,

      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) {
          sheetTranslateY.setValue(gesture.dy);
        }
      },

      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > 55 || gesture.vy > 0.4) {
          closeSheet();
          return;
        }

        Animated.spring(sheetTranslateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 90,
          friction: 14,
        }).start();
      },
    })
  ).current;

  const openTrackingSite = async () => {
    try {
      const canOpen = await Linking.canOpenURL(resolvedTrackingUrl);

      if (!canOpen) {
        Alert.alert("오류", "배송 조회 페이지를 열 수 없어요.");
        return;
      }

      await Linking.openURL(resolvedTrackingUrl);
    } catch (error) {
      console.log("배송 조회 링크 열기 실패:", error);
      Alert.alert("오류", "배송 조회 페이지를 열 수 없어요.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.dimLayer, { opacity: dimOpacity }]}>
          <TouchableOpacity
            style={styles.dimPressArea}
            activeOpacity={1}
            onPress={closeSheet}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              transform: [{ translateY: sheetTranslateY }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.handleBox}>
            <View style={styles.handle} />
          </View>

          <Text style={styles.sheetTitle}>배송 현황</Text>

          <View style={styles.topDivider} />

          <View style={styles.trackingCard}>
            {isLoading ? (
              <>
                <View style={styles.courierBadge}>
                  <Text style={styles.courierBadgeText}>조회 중</Text>
                </View>

                <Text style={styles.label}>배송 정보를 불러오는 중이에요</Text>
                <Text style={styles.emptyNumber}>잠시만 기다려주세요.</Text>
              </>
            ) : hasTrackingNumber ? (
              <>
                <View style={styles.courierBadge}>
                  <Text style={styles.courierBadgeText}>
                    {displayCourierType}
                  </Text>
                </View>

                <Text style={styles.label}>운송장 번호</Text>
                <Text style={styles.trackingNumber}>{trackingNumber}</Text>
              </>
            ) : (
              <>
                <View style={styles.courierBadge}>
                  <Text style={styles.courierBadgeText}>
                    {displayCourierType}
                  </Text>
                </View>

                <Text style={styles.label}>운송장 번호</Text>
                <Text style={styles.emptyNumber}>
                  아직 등록된 운송장이 없어요.
                </Text>
              </>
            )}
          </View>

          <TouchableOpacity
            style={styles.linkButton}
            activeOpacity={0.82}
            onPress={openTrackingSite}
          >
            <Text style={styles.linkButtonText}>
              {displayCourierType} 바로가기
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "transparent",
  },

  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "transparent",
  },

  dimLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.38)",
  },

  dimPressArea: {
    flex: 1,
  },

  sheet: {
    minHeight: SHEET_HEIGHT,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    paddingBottom: 14,
  },

  handleBox: {
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  handle: {
    width: 64,
    height: 5,
    borderRadius: 99,
    backgroundColor: COLORS.gray300,
  },

  sheetTitle: {
    textAlign: "center",
    fontSize: 17,
    fontWeight: "900",
    color: COLORS.black,
    paddingBottom: 17,
  },

  topDivider: {
    height: 1,
    backgroundColor: COLORS.line,
  },

  trackingCard: {
    marginHorizontal: 16,
    marginTop: 14,
    minHeight: 100,
    borderRadius: 14,
    backgroundColor: COLORS.yellowLight,
    paddingHorizontal: 14,
    paddingVertical: 14,
    justifyContent: "center",
  },

  courierBadge: {
    alignSelf: "flex-start",
    minHeight: 26,
    paddingHorizontal: 10,
    borderRadius: 13,
    backgroundColor: COLORS.yellowBadge,
    justifyContent: "center",
    marginBottom: 9,
  },

  courierBadgeText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#8B6F00",
  },

  label: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.gray700,
    marginBottom: 4,
  },

  trackingNumber: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.black,
    letterSpacing: 0.1,
  },

  emptyNumber: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.gray500,
    lineHeight: 21,
  },

  linkButton: {
    height: 54,
    marginHorizontal: 16,
    marginTop: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },

  linkButtonText: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.gray700,
  },
});