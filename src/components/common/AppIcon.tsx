import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type AppIconName =
  | 'notice'
  | 'equipment'
  | 'room'
  | 'report'
  | 'assistant'
  | 'hours';

export function AppIcon({ name, size = 28, color = '#182366' }: { name: AppIconName; size?: number; color?: string }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {name === 'notice' ? <><Path d="M4 10v4h4l7 4V6L8 10H4Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" /><Path d="M18 9c1.3 1.7 1.3 4.3 0 6" stroke={color} strokeWidth="1.8" strokeLinecap="round" /></> : null}
    {name === 'equipment' ? <><Rect x="3" y="6" width="18" height="13" rx="3" stroke={color} strokeWidth="1.8" /><Circle cx="12" cy="12.5" r="3.5" stroke={color} strokeWidth="1.8" /><Path d="M7 6l1-2h4l1 2" stroke={color} strokeWidth="1.8" /></> : null}
    {name === 'room' ? <><Path d="M3 21h18M5 21V4h14v17M9 8h2M13 8h2M9 12h2M13 12h2M10 21v-5h4v5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></> : null}
    {name === 'report' ? <><Path d="M14 5a4 4 0 0 0-5 5L3 16l5 5 6-6a4 4 0 0 0 5-5l-3 3-3-3 3-3-2-2Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" /></> : null}
    {name === 'assistant' ? <><Path d="M4 5h16v11H9l-5 4V5Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" /><Circle cx="9" cy="10.5" r="1" fill={color} /><Circle cx="12" cy="10.5" r="1" fill={color} /><Circle cx="15" cy="10.5" r="1" fill={color} /></> : null}
    {name === 'hours' ? <><Circle cx="12" cy="12" r="8.5" stroke={color} strokeWidth="1.8" /><Path d="M12 7v5l3.5 2" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></> : null}
  </Svg>;
}
