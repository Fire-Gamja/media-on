import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

export type AppIconName =
  | 'notice'
  | 'equipment'
  | 'room'
  | 'report'
  | 'assistant'
  | 'popup'
  | 'hours'
  | 'bell'
  | 'search'
  | 'settings'
  | 'rental'
  | 'administration'
  | 'trash'
  | 'check';

export function AppIcon({ name, size = 28, color = '#182366' }: { name: AppIconName; size?: number; color?: string }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {name === 'notice' ? <><Path d="M4 10v4h4l7 4V6L8 10H4Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" /><Path d="M18 9c1.3 1.7 1.3 4.3 0 6" stroke={color} strokeWidth="1.8" strokeLinecap="round" /></> : null}
    {name === 'equipment' ? <><Rect x="3" y="6" width="18" height="13" rx="3" stroke={color} strokeWidth="1.8" /><Circle cx="12" cy="12.5" r="3.5" stroke={color} strokeWidth="1.8" /><Path d="M7 6l1-2h4l1 2" stroke={color} strokeWidth="1.8" /></> : null}
    {name === 'room' ? <><Path d="M3 21h18M5 21V4h14v17M9 8h2M13 8h2M9 12h2M13 12h2M10 21v-5h4v5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></> : null}
    {name === 'report' ? <><Path d="M14 5a4 4 0 0 0-5 5L3 16l5 5 6-6a4 4 0 0 0 5-5l-3 3-3-3 3-3-2-2Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" /></> : null}
    {name === 'assistant' ? <><Path d="M4 5h16v11H9l-5 4V5Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" /><Circle cx="9" cy="10.5" r="1" fill={color} /><Circle cx="12" cy="10.5" r="1" fill={color} /><Circle cx="15" cy="10.5" r="1" fill={color} /></> : null}
    {name === 'popup' ? <><Rect x="3.5" y="4.5" width="17" height="15" rx="2.5" stroke={color} strokeWidth="1.8" /><Path d="M3.5 8.5h17M7 6.5h.01M10 6.5h.01M8 13h8M8 16h5" stroke={color} strokeWidth="1.8" strokeLinecap="round" /></> : null}
    {name === 'hours' ? <><Circle cx="12" cy="12" r="8.5" stroke={color} strokeWidth="1.8" /><Path d="M12 7v5l3.5 2" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></> : null}
    {name === 'bell' ? <><Path d="M6.5 9.5a5.5 5.5 0 0 1 11 0v3.2l1.7 2.8H4.8l1.7-2.8V9.5Z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><Path d="M9.5 18a2.7 2.7 0 0 0 5 0" stroke={color} strokeWidth="1.8" strokeLinecap="round" /></> : null}
    {name === 'search' ? <><Circle cx="10.5" cy="10.5" r="6.5" stroke={color} strokeWidth="1.8" /><Line x1="15.5" y1="15.5" x2="20" y2="20" stroke={color} strokeWidth="1.8" strokeLinecap="round" /></> : null}
    {name === 'settings' ? <><Circle cx="12" cy="12" r="3.1" stroke={color} strokeWidth="1.8" /><Path d="M19 13.2v-2.4l-2-.6a7 7 0 0 0-.7-1.7l1-1.8-1.7-1.7-1.8 1a7 7 0 0 0-1.7-.7l-.6-2H9.1l-.6 2a7 7 0 0 0-1.7.7L5 5 3.3 6.7l1 1.8a7 7 0 0 0-.7 1.7l-2 .6v2.4l2 .6a7 7 0 0 0 .7 1.7l-1 1.8L5 19l1.8-1a7 7 0 0 0 1.7.7l.6 2h2.4l.6-2a7 7 0 0 0 1.7-.7l1.8 1 1.7-1.7-1-1.8a7 7 0 0 0 .7-1.7l2-.6Z" stroke={color} strokeWidth="1.4" strokeLinejoin="round" /></> : null}
    {name === 'rental' ? <><Rect x="3.5" y="7" width="17" height="12.5" rx="2.5" stroke={color} strokeWidth="1.8" /><Path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7M3.5 12h17M9.5 12v2h5v-2" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></> : null}
    {name === 'administration' ? <><Path d="M5 3.5h10l4 4V20.5H5V3.5Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" /><Path d="M15 3.5v4h4M8.5 12h7M8.5 15.5h7" stroke={color} strokeWidth="1.8" strokeLinecap="round" /></> : null}
    {name === 'trash' ? <><Path d="M5.5 7h13M9 7V4.5h6V7M7.5 7l.8 13h7.4l.8-13M10 10.5v6M14 10.5v6" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></> : null}
    {name === 'check' ? <Path d="m5 12.5 4.2 4.2L19 7" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /> : null}
  </Svg>;
}
