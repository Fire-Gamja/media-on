import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '../../constants/colors';
import { getAuthErrorMessage } from '../../services/auth';
import {
  createEquipmentRentalRequest,
  type EquipmentItem,
  getEquipmentItem,
} from '../../services/equipment-rentals';

export default function EquipmentRequestScreen() {
  const { equipmentId: rawEquipmentId } = useLocalSearchParams<{
    equipmentId?: string;
  }>();
  const equipmentId = Array.isArray(rawEquipmentId)
    ? rawEquipmentId[0]
    : rawEquipmentId;
  const [equipment, setEquipment] = useState<EquipmentItem | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [pickupDate, setPickupDate] = useState(() => getLocalDate(0));
  const [returnDate, setReturnDate] = useState(() => getLocalDate(1));
  const [purpose, setPurpose] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!equipmentId) {
      router.back();
      return;
    }

    void getEquipmentItem(equipmentId)
      .then(setEquipment)
      .catch((error) => {
        Alert.alert('조회 실패', getAuthErrorMessage(error), [
          { text: '확인', onPress: () => router.back() },
        ]);
      })
      .finally(() => setIsLoading(false));
  }, [equipmentId]);

  const handleSubmit = async () => {
    if (!equipmentId || !equipment) return;

    const parsedQuantity = Number(quantity);
    if (
      !Number.isInteger(parsedQuantity) ||
      parsedQuantity < 1 ||
      parsedQuantity > equipment.total_quantity
    ) {
      Alert.alert(
        '수량 확인',
        `1개부터 최대 ${equipment.total_quantity}개까지 신청할 수 있습니다.`,
      );
      return;
    }

    if (!isValidDate(pickupDate) || !isValidDate(returnDate)) {
      Alert.alert('날짜 확인', '대여일과 반납일을 정확히 입력해 주세요.');
      return;
    }

    if (pickupDate < getLocalDate(0)) {
      Alert.alert('날짜 확인', '대여일은 오늘 이후 날짜를 선택해 주세요.');
      return;
    }

    if (returnDate < pickupDate) {
      Alert.alert('날짜 확인', '반납일은 대여일과 같거나 이후여야 합니다.');
      return;
    }

    if (!purpose.trim()) {
      Alert.alert('사용 목적 확인', '기자재 사용 목적을 입력해 주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      await createEquipmentRentalRequest({
        equipmentId,
        quantity: parsedQuantity,
        pickupDate,
        returnDate,
        purpose,
      });
      Alert.alert('신청 완료', '기자재 대여 신청이 완료되었습니다.', [
        {
          text: '내 신청 확인',
          onPress: () => router.replace('/equipment-requests'),
        },
      ]);
    } catch (error) {
      Alert.alert('신청 실패', getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>대여 신청</Text>
          <View style={styles.headerSide} />
        </View>

        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.navy} />
          </View>
        ) : equipment ? (
          <>
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.equipmentCard}>
                <Text style={styles.category}>{equipment.category}</Text>
                <Text style={styles.name}>{equipment.name}</Text>
                <Text style={styles.description}>
                  {equipment.description ?? '학부 기자재 대여 품목'}
                </Text>
                <Text style={styles.stock}>보유 수량 {equipment.total_quantity}개</Text>
              </View>

              <Text style={styles.label}>신청 수량</Text>
              <TextInput
                value={quantity}
                onChangeText={(value) => setQuantity(value.replace(/\D/g, ''))}
                maxLength={2}
                keyboardType="number-pad"
                placeholder="1"
                placeholderTextColor={COLORS.placeholder}
                style={styles.input}
              />

              <View style={styles.dateRow}>
                <View style={styles.dateField}>
                  <Text style={styles.label}>대여일</Text>
                  <TextInput
                    value={pickupDate}
                    onChangeText={(value) =>
                      setPickupDate(formatDateInput(value))
                    }
                    maxLength={10}
                    keyboardType="number-pad"
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={COLORS.placeholder}
                    style={styles.input}
                  />
                </View>
                <View style={styles.dateField}>
                  <Text style={styles.label}>반납일</Text>
                  <TextInput
                    value={returnDate}
                    onChangeText={(value) =>
                      setReturnDate(formatDateInput(value))
                    }
                    maxLength={10}
                    keyboardType="number-pad"
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={COLORS.placeholder}
                    style={styles.input}
                  />
                </View>
              </View>

              <Text style={[styles.label, styles.purposeLabel]}>사용 목적</Text>
              <TextInput
                value={purpose}
                onChangeText={setPurpose}
                maxLength={1000}
                multiline
                textAlignVertical="top"
                placeholder="수업명, 행사명 등 사용 목적을 입력해 주세요"
                placeholderTextColor={COLORS.placeholder}
                style={styles.purposeInput}
              />
            </ScrollView>

            <View style={styles.footer}>
              <Pressable
                disabled={isSubmitting}
                onPress={() => void handleSubmit()}
                style={({ pressed }) => [
                  styles.submitButton,
                  isSubmitting && styles.disabled,
                  pressed && !isSubmitting && styles.pressed,
                ]}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.submitText}>대여 신청</Text>
                )}
              </Pressable>
            </View>
          </>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function getLocalDate(offset: number) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime()) && getDateKey(date) === value;
}

function getDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.surface },
  flex: { flex: 1 },
  header: { height: 64, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backText: { width: 40, color: COLORS.navy, fontSize: 38, lineHeight: 40 },
  headerTitle: { color: COLORS.text, fontSize: 18, fontWeight: '800' },
  headerSide: { width: 40 },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollView: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 22, paddingBottom: 38 },
  equipmentCard: { marginBottom: 26, padding: 19, borderRadius: 17, backgroundColor: COLORS.navy },
  category: { color: '#D9DDEF', fontSize: 11, fontWeight: '700' },
  name: { marginTop: 7, color: COLORS.white, fontSize: 21, fontWeight: '900' },
  description: { marginTop: 8, color: '#D9DDEF', fontSize: 12, lineHeight: 19 },
  stock: { marginTop: 12, color: COLORS.white, fontSize: 12, fontWeight: '800' },
  label: { marginBottom: 9, color: COLORS.text, fontSize: 14, fontWeight: '800' },
  input: { height: 56, paddingHorizontal: 15, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, backgroundColor: COLORS.surface, color: COLORS.text, fontSize: 15 },
  dateRow: { marginTop: 23, flexDirection: 'row', gap: 10 },
  dateField: { flex: 1 },
  purposeLabel: { marginTop: 23 },
  purposeInput: { minHeight: 150, padding: 15, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, backgroundColor: COLORS.surface, color: COLORS.text, fontSize: 14, lineHeight: 22 },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: COLORS.surface },
  submitButton: { height: 56, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: COLORS.navy },
  submitText: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.7 },
});
