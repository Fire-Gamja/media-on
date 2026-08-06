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
  | 'faq'
  | 'instagram'
  | 'graduation'
  | 'trash'
  | 'check';

export function AppIcon({
  name,
  size = 28,
  color = '#182366',
  monochrome = false,
}: {
  name: AppIconName;
  size?: number;
  color?: string;
  monochrome?: boolean;
}) {
  const viewBox =
    name === 'notice' ||
    name === 'room' ||
    name === 'report' ||
    name === 'assistant'
      ? '0 0 20 20'
      : '0 0 24 24';
  const assistantPrimaryColor = monochrome ? color : '#292D32';
  const assistantAccentColor = monochrome ? color : '#0080FF';

  return <Svg width={size} height={size} viewBox={viewBox} fill="none">
    {name === 'notice' ? <><Path opacity="0.6" d="M15.8333 6.66669C17.214 6.66669 18.3333 5.5474 18.3333 4.16669C18.3333 2.78598 17.214 1.66669 15.8333 1.66669C14.4526 1.66669 13.3333 2.78598 13.3333 4.16669C13.3333 5.5474 14.4526 6.66669 15.8333 6.66669Z" stroke="#0080FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <Path opacity="0.6" d="M5.83333 10.8333H10" stroke="#0080FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <Path opacity="0.6" d="M5.83333 14.1667H13.3333" stroke="#0080FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M11.6667 1.66669H7.5C3.33333 1.66669 1.66667 3.33335 1.66667 7.50002V12.5C1.66667 16.6667 3.33333 18.3334 7.5 18.3334H12.5C16.6667 18.3334 18.3333 16.6667 18.3333 12.5V8.33335" stroke="#292D32" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </> : null}
    {name === 'equipment' ? <><Path d="M6.76 22H17.24C20 22 21.1 20.31 21.23 18.25L21.75 9.99C21.89 7.83 20.17 6 18 6C17.39 6 16.83 5.65 16.55 5.11L15.83 3.66C15.37 2.75 14.17 2 13.15 2H10.86C9.83 2 8.63 2.75 8.17 3.66L7.45 5.11C7.17 5.65 6.61 6 6 6C3.83 6 2.11 7.83 2.25 9.99L2.77 18.25C2.89 20.31 4 22 6.76 22Z" stroke="#292D32" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
<Path opacity="0.6" d="M10.5 8H13.5" stroke="#0080FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
<Path opacity="0.6" d="M12 18C13.79 18 15.25 16.54 15.25 14.75C15.25 12.96 13.79 11.5 12 11.5C10.21 11.5 8.75 12.96 8.75 14.75C8.75 16.54 10.21 18 12 18Z" stroke="#0080FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
</> : null}
    {name === 'room' ? <><Path d="M5.36667 1.66669H14.625C17.5917 1.66669 18.3333 2.40835 18.3333 5.36669V10.6417C18.3333 13.6084 17.5917 14.3417 14.6333 14.3417H5.36667C2.40834 14.35 1.66667 13.6084 1.66667 10.65V5.36669C1.66667 2.40835 2.40834 1.66669 5.36667 1.66669Z" stroke="#292D32" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
<Path opacity="0.6" d="M10 14.35V18.3333" stroke="#0080FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
<Path opacity="0.6" d="M1.66667 10.8333H18.3333" stroke="#0080FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
<Path d="M6.25 18.3333H13.75" stroke="#292D32" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
</> : null}
    {name === 'report' ? <><Path d="M14.1667 15.3584H10.8333L7.12499 17.825C6.57499 18.1917 5.83334 17.8001 5.83334 17.1334V15.3584C3.33334 15.3584 1.66667 13.6917 1.66667 11.1917V6.19169C1.66667 3.69169 3.33334 2.02502 5.83334 2.02502H14.1667C16.6667 2.02502 18.3333 3.69169 18.3333 6.19169V11.1917C18.3333 13.6917 16.6667 15.3584 14.1667 15.3584Z" stroke="#292D32" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
<Path opacity="0.6" d="M9.99999 9.46667V9.29171C9.99999 8.72504 10.35 8.42503 10.7 8.18336C11.0417 7.95003 11.3833 7.65004 11.3833 7.10004C11.3833 6.33337 10.7667 5.71667 9.99999 5.71667C9.23333 5.71667 8.61668 6.33337 8.61668 7.10004" stroke="#0080FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
<Path opacity="0.6" d="M9.99624 11.4584H10.0037" stroke="#0080FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
</> : null}
    {name === 'assistant' ? <><Path d="M18.3333 8.33335V10.8334C18.3333 14.1667 16.6667 15.8334 13.3333 15.8334H12.9167C12.6583 15.8334 12.4083 15.9584 12.25 16.1667L11 17.8334C10.45 18.5667 9.54999 18.5667 8.99999 17.8334L7.74999 16.1667C7.61666 15.9834 7.30832 15.8334 7.08332 15.8334H6.66666C3.33332 15.8334 1.66666 15 1.66666 10.8334V6.66669C1.66666 3.33335 3.33332 1.66669 6.66666 1.66669H11.6667" stroke={assistantPrimaryColor} strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
<Path opacity={monochrome ? 1 : 0.6} d="M16.25 5.83335C17.4006 5.83335 18.3333 4.90061 18.3333 3.75002C18.3333 2.59943 17.4006 1.66669 16.25 1.66669C15.0994 1.66669 14.1667 2.59943 14.1667 3.75002C14.1667 4.90061 15.0994 5.83335 16.25 5.83335Z" stroke={assistantAccentColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
<Path opacity={monochrome ? 1 : 0.6} d="M13.3304 9.16667H13.3379" stroke={assistantAccentColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
<Path opacity={monochrome ? 1 : 0.6} d="M9.99623 9.16667H10.0037" stroke={assistantAccentColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
<Path opacity={monochrome ? 1 : 0.6} d="M6.66209 9.16667H6.66957" stroke={assistantAccentColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
</> : null}
    {name === 'popup' ? <><Rect x="3.5" y="4.5" width="17" height="15" rx="2.5" stroke={color} strokeWidth="1.8" /><Path d="M3.5 8.5h17M7 6.5h.01M10 6.5h.01M8 13h8M8 16h5" stroke={color} strokeWidth="1.8" strokeLinecap="round" /></> : null}
    {name === 'hours' ? <><Circle cx="12" cy="12" r="8.5" stroke={color} strokeWidth="1.8" /><Path d="M12 7v5l3.5 2" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></> : null}
    {name === 'bell' ? <><Path d="M18 8A6 6 0 0 0 6 8C6 15 3 15 3 18H21C21 15 18 15 18 8Z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><Path d="M10 21H14" stroke={color} strokeWidth="1.8" strokeLinecap="round" /></> : null}
    {name === 'search' ? <><Circle cx="10.5" cy="10.5" r="6.5" stroke={color} strokeWidth="1.8" /><Line x1="15.5" y1="15.5" x2="20" y2="20" stroke={color} strokeWidth="1.8" strokeLinecap="round" /></> : null}
    {name === 'settings' ? <>
    <Path d="M15 12C15 12.5933 14.8241 13.1734 14.4944 13.6667C14.1648 14.1601 13.6962 14.5446 13.1481 14.7716C12.5999 14.9987 11.9967 15.0581 11.4147 14.9424C10.8328 14.8266 10.2982 14.5409 9.87868 14.1213C9.45912 13.7018 9.1734 13.1672 9.05765 12.5853C8.94189 12.0033 9.0013 11.4001 9.22836 10.8519C9.45543 10.3038 9.83994 9.83524 10.3333 9.50559C10.8266 9.17595 11.4067 9 12 9C12.7957 9 13.5587 9.31607 14.1213 9.87868C14.6839 10.4413 15 11.2044 15 12Z" stroke="#60ACF9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M2 12.88V11.12C2.00158 10.6166 2.20227 10.1342 2.55825 9.77824C2.91422 9.42227 3.39658 9.22158 3.9 9.22C5.71 9.22 6.45 7.94 5.54 6.37C5.29015 5.93354 5.22353 5.41583 5.35474 4.93033C5.48596 4.44484 5.8043 4.03117 6.24 3.78L7.97 2.79C8.35203 2.56773 8.80663 2.50607 9.23406 2.61856C9.6615 2.73104 10.0269 3.00847 10.25 3.39L10.36 3.58C11.26 5.15 12.74 5.15 13.65 3.58L13.76 3.39C13.9831 3.00847 14.3485 2.73104 14.7759 2.61856C15.2034 2.50607 15.658 2.56773 16.04 2.79L17.77 3.78C18.2057 4.03117 18.524 4.44484 18.6553 4.93033C18.7865 5.41583 18.7199 5.93354 18.47 6.37C17.56 7.94 18.3 9.22 20.11 9.22C20.6134 9.22158 21.0958 9.42227 21.4518 9.77824C21.8077 10.1342 22.0084 10.6166 22.01 11.12V12.88C22.0084 13.3834 21.8077 13.8658 21.4518 14.2218C21.0958 14.5777 20.6134 14.7784 20.11 14.78C18.3 14.78 17.56 16.06 18.47 17.63C18.7199 18.0665 18.7865 18.5842 18.6553 19.0697C18.524 19.5552 18.2057 19.9688 17.77 20.22L16.04 21.21C15.658 21.4323 15.2034 21.4939 14.7759 21.3814C14.3485 21.269 13.9831 20.9915 13.76 20.61L13.65 20.42C12.75 18.85 11.27 18.85 10.36 20.42L10.25 20.61C10.0269 20.9915 9.6615 21.269 9.23406 21.3814C8.80663 21.4939 8.35203 21.4323 7.97 21.21L6.24 20.22C5.8043 19.9688 5.48596 19.5552 5.35474 19.0697C5.22353 18.5842 5.29015 18.0665 5.54 17.63C6.45 16.06 5.71 14.78 3.9 14.78C3.39658 14.7784 2.91422 14.5777 2.55825 14.2218C2.20227 13.8658 2.00158 13.3834 2 12.88Z" stroke="#292D32" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
</> : null}
    {name === 'rental' ? <><Path d="M6.76 22H17.24C20 22 21.1 20.31 21.23 18.25L21.75 9.99C21.89 7.83 20.17 6 18 6C17.39 6 16.83 5.65 16.55 5.11L15.83 3.66C15.37 2.75 14.17 2 13.15 2H10.86C9.83 2 8.63 2.75 8.17 3.66L7.45 5.11C7.17 5.65 6.61 6 6 6C3.83 6 2.11 7.83 2.25 9.99L2.77 18.25C2.89 20.31 4 22 6.76 22Z" stroke="#292D32" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <Path opacity="0.6" d="M10.5 8H13.5" stroke="#0080FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <Path opacity="0.6" d="M12 18C13.79 18 15.25 16.54 15.25 14.75C15.25 12.96 13.79 11.5 12 11.5C10.21 11.5 8.75 12.96 8.75 14.75C8.75 16.54 10.21 18 12 18Z" stroke="#0080FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </> : null}
    {name === 'faq' ? <><Path d="M5.25 3.25H18.75C20.1307 3.25 21.25 4.36929 21.25 5.75V15.25C21.25 16.6307 20.1307 17.75 18.75 17.75H11L6.25 21V17.75H5.25C3.86929 17.75 2.75 16.6307 2.75 15.25V5.75C2.75 4.36929 3.86929 3.25 5.25 3.25Z" stroke="#292D32" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /><Path opacity="0.6" d="M9.75 8.25C9.75 7.00736 10.7574 6 12 6C13.2426 6 14.25 7.00736 14.25 8.25C14.25 10.125 12 10.125 12 12M12 14.75H12.01" stroke="#0080FF" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></> : null}
    {name === 'instagram' ? <><Rect x="3" y="3" width="18" height="18" rx="5" stroke={color} strokeWidth="1.8" /><Circle cx="12" cy="12" r="4.25" stroke={color} strokeWidth="1.8" /><Circle cx="17.35" cy="6.65" r="1.1" fill={color} /></> : null}
    {name === 'graduation' ? <><Path d="m2.5 8.5 9.5-5 9.5 5-9.5 5-9.5-5Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" /><Path d="M6.5 10.7v5.2c3.4 2.3 7.6 2.3 11 0v-5.2M21.5 8.5v6" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><Circle cx="21.5" cy="16.5" r="1" fill={color} /></> : null}
    {name === 'trash' ? <><Path d="M5.5 7h13M9 7V4.5h6V7M7.5 7l.8 13h7.4l.8-13M10 10.5v6M14 10.5v6" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></> : null}
    {name === 'check' ? <Path d="m5 12.5 4.2 4.2L19 7" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /> : null}
  </Svg>;
}
