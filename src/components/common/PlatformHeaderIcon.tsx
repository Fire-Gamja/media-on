import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

type PlatformHeaderIconProps = {
  name: 'back' | 'home';
  color?: string;
  size?: number;
};

export function PlatformHeaderIcon({
  name,
  color = '#182366',
  size = 24,
}: PlatformHeaderIconProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <SymbolView
        name={
          name === 'back'
            ? { ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }
            : { ios: 'house.fill', android: 'home', web: 'home' }
        }
        size={size}
        tintColor={color}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
