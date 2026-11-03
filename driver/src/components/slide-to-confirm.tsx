/* eslint-disable react-hooks/refs -- the touch handlers read this ref only when touched, never while rendering */
import { CaretDoubleRight } from 'phosphor-react-native';
import { useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, View } from 'react-native';
import { colors } from '@native/theme';
import { Text } from '@native/ui';

const KNOB = 56;
const PAD = 4;

/**
 * The slide control from the design. Drag the knob across to confirm. Screen readers
 * get a normal "activate" action instead, because dragging is not possible for everyone.
 */
export function SlideToConfirm({
  label,
  onComplete,
  tone = 'brand',
  disabled,
}: {
  label: string;
  onComplete: () => void;
  tone?: 'brand' | 'dark';
  disabled?: boolean;
}) {
  const [width, setWidth] = useState(0);
  const [x] = useState(() => new Animated.Value(0));
  const max = Math.max(0, width - KNOB - PAD * 2);
  const state = useRef({ max, onComplete, disabled });
  useEffect(() => {
    state.current = { max, onComplete, disabled };
  });

  const [pan] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => !state.current.disabled,
      onMoveShouldSetPanResponder: () => !state.current.disabled,
      onPanResponderMove: (_, g) => x.setValue(Math.min(Math.max(0, g.dx), state.current.max)),
      onPanResponderRelease: (_, g) => {
        const { max: m, onComplete: done } = state.current;
        if (m > 0 && g.dx >= m * 0.8) {
          Animated.timing(x, { toValue: m, duration: 80, useNativeDriver: false }).start(() => {
            done();
            Animated.timing(x, { toValue: 0, duration: 200, useNativeDriver: false }).start();
          });
        } else {
          Animated.spring(x, { toValue: 0, useNativeDriver: false }).start();
        }
      },
    }),
  );

  const track = tone === 'brand' ? colors.brand : colors.ink;
  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityHint="Double tap to confirm"
      accessibilityState={{ disabled: !!disabled }}
      accessibilityActions={[{ name: 'activate', label }]}
      onAccessibilityAction={() => !disabled && onComplete()}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{ height: 64, borderRadius: 32, backgroundColor: track, justifyContent: 'center', opacity: disabled ? 0.6 : 1 }}
    >
      <Text weight="semibold" color={colors.white} style={{ textAlign: 'center', paddingLeft: KNOB }}>
        {label}
      </Text>
      <Animated.View
        {...pan.panHandlers}
        style={{
          position: 'absolute',
          left: PAD,
          width: KNOB,
          height: KNOB,
          borderRadius: KNOB / 2,
          backgroundColor: colors.white,
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ translateX: x }],
        }}
      >
        <CaretDoubleRight size={24} weight="bold" color={tone === 'brand' ? colors.brand : colors.ink} />
      </Animated.View>
    </View>
  );
}
