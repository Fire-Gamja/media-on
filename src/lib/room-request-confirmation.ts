import { Alert } from 'react-native';

export function confirmRoomRequestNavigation(onConfirm: () => void) {
  Alert.alert('통합정보시스템에 신청하셨나요?', undefined, [
    {
      text: '아니오',
      style: 'cancel',
      onPress: () =>
        Alert.alert(
          '신청 안내',
          '통합정보시스템에서 신청 후 해당 기능을 사용해 주세요.',
        ),
    },
    { text: '예', onPress: onConfirm },
  ]);
}
