import { type PropsWithChildren, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

type BottomSheetModalProps = PropsWithChildren<{
  accessibilityLabel: string;
  backdropColor?: string;
  onRequestClose: () => void;
  visible: boolean;
}>;

const BACKDROP_ENTER_DURATION = 180;
const BACKDROP_EXIT_DURATION = 110;
const SHEET_ENTER_DURATION = 280;
const SHEET_EXIT_DURATION = 220;

export function BottomSheetModal({
  accessibilityLabel,
  backdropColor = 'rgba(0, 0, 0, 0.45)',
  children,
  onRequestClose,
  visible,
}: BottomSheetModalProps) {
  const { height } = useWindowDimensions();
  const [isMounted, setIsMounted] = useState(visible);
  const backdropOpacity = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const sheetTranslateY = useRef(
    new Animated.Value(visible ? 0 : Math.max(height, 600)),
  ).current;

  useEffect(() => {
    backdropOpacity.stopAnimation();
    sheetTranslateY.stopAnimation();

    if (visible && !isMounted) {
      setIsMounted(true);
      return;
    }

    if (visible) {
      backdropOpacity.setValue(0);
      sheetTranslateY.setValue(Math.max(height, 600));

      const frame = requestAnimationFrame(() => {
        Animated.parallel([
          Animated.timing(backdropOpacity, {
            duration: BACKDROP_ENTER_DURATION,
            easing: Easing.out(Easing.quad),
            toValue: 1,
            useNativeDriver: true,
          }),
          Animated.timing(sheetTranslateY, {
            duration: SHEET_ENTER_DURATION,
            easing: Easing.out(Easing.cubic),
            toValue: 0,
            useNativeDriver: true,
          }),
        ]).start();
      });

      return () => cancelAnimationFrame(frame);
    }

    if (!isMounted) return;

    Animated.timing(backdropOpacity, {
      duration: BACKDROP_EXIT_DURATION,
      easing: Easing.out(Easing.quad),
      toValue: 0,
      useNativeDriver: true,
    }).start(({ finished: backdropFinished }) => {
      if (!backdropFinished) return;

      Animated.timing(sheetTranslateY, {
        duration: SHEET_EXIT_DURATION,
        easing: Easing.in(Easing.cubic),
        toValue: Math.max(height, 600),
        useNativeDriver: true,
      }).start(({ finished: sheetFinished }) => {
        if (sheetFinished) setIsMounted(false);
      });
    });
  }, [backdropOpacity, height, isMounted, sheetTranslateY, visible]);

  return (
    <Modal
      animationType="none"
      onRequestClose={onRequestClose}
      transparent
      visible={isMounted}
    >
      <View style={styles.root}>
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: backdropColor, opacity: backdropOpacity },
          ]}
        />
        <Pressable
          accessibilityLabel={accessibilityLabel}
          disabled={!visible}
          onPress={onRequestClose}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View
          pointerEvents={visible ? 'auto' : 'none'}
          style={[styles.sheet, { transform: [{ translateY: sheetTranslateY }] }]}
        >
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%',
    backgroundColor: '#FFFFFF',
  },
});
