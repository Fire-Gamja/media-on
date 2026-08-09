import { Image as ExpoImage } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { InlineDropdown } from '../../../components/common/InlineDropdown';
import { BottomSheetModal } from '../../../components/common/BottomSheetModal';
import { PlatformHeaderIcon } from '../../../components/common/PlatformHeaderIcon';
import MonthCalendar, {
  fromDateKey,
  toDateKey,
} from '../../../components/student/MonthCalendar';
import { COLORS } from '../../../constants/colors';
import { maskProfanityInput } from '../../../lib/content-filter';
import { getAuthErrorMessage } from '../../../services/auth';
import {
  createEquipmentRentalRequests,
  type EquipmentItem,
  getEquipmentItems,
} from '../../../services/equipment-rentals';

const icons = {
  calendar: require('../../../../assets/figma/student-v2/calendar.svg'),
  chevronDown: require('../../../../assets/figma/student-v2/chervron-down.svg'),
  plus: require('../../../../assets/figma/student-v2/plus-icon.svg'),
} as const;

const equipmentImages = {
  djiPocket2: require('../../../../assets/images/equipment/dji-pocket-2.jpg'),
  dslr: require('../../../../assets/images/equipment/dslr.jpg'),
  galaxyTab: require('../../../../assets/images/equipment/galaxy-tab.jpg'),
  gimbal: require('../../../../assets/images/equipment/gimbal.jpg'),
  notebook: require('../../../../assets/images/equipment/notebook.jpg'),
  penTablet: require('../../../../assets/images/equipment/pen-tablet.jpg'),
  projector: require('../../../../assets/images/equipment/projector.jpg'),
  sdCard: require('../../../../assets/images/equipment/sd-card.jpg'),
  tripod: require('../../../../assets/images/equipment/tripod.jpg'),
} as const;

type RentalLine = {
  key: string;
  equipmentId: string;
  pickupDate: string;
  returnDate: string;
  quantity: number;
};

type DateSheetState = {
  lineIndex: number;
} | null;

type QuantitySheetState = {
  lineIndex: number;
} | null;

const QUANTITY_WHEEL_ITEM_HEIGHT = 56;
const QUANTITY_WHEEL_VISIBLE_ITEMS = 5;
const QUANTITY_WHEEL_PADDING =
  QUANTITY_WHEEL_ITEM_HEIGHT * Math.floor(QUANTITY_WHEEL_VISIBLE_ITEMS / 2);

export default function EquipmentScreen() {
  const { equipmentId: rawEquipmentId } = useLocalSearchParams<{
    equipmentId?: string;
  }>();
  const requestedEquipmentId = Array.isArray(rawEquipmentId)
    ? rawEquipmentId[0]
    : rawEquipmentId;
  const today = useMemo(() => getLocalDate(0), []);
  const [items, setItems] = useState<EquipmentItem[]>([]);
  const [lines, setLines] = useState<RentalLine[]>([
    createRentalLine(requestedEquipmentId ?? '', today),
  ]);
  const [purpose, setPurpose] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [openEquipmentIndex, setOpenEquipmentIndex] = useState<number | null>(
    null,
  );
  const [dateSheet, setDateSheet] = useState<DateSheetState>(null);
  const [quantitySheet, setQuantitySheet] =
    useState<QuantitySheetState>(null);

  const loadItems = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const nextItems = await getEquipmentItems();
      setItems(nextItems);
      setLines((current) =>
        current.map((line, index) => {
          if (nextItems.some((item) => item.id === line.equipmentId)) {
            return line;
          }

          return {
            ...line,
            equipmentId: nextItems[Math.min(index, nextItems.length - 1)]?.id ?? '',
          };
        }),
      );
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const equipmentDropdownOptions = useMemo(
    () => items.map((item) => ({ label: item.name, value: item.id })),
    [items],
  );

  const updateLine = useCallback(
    (lineIndex: number, patch: Partial<RentalLine>) => {
      setLines((current) =>
        current.map((line, index) =>
          index === lineIndex ? { ...line, ...patch } : line,
        ),
      );
    },
    [],
  );

  const selectedHeroItem =
    items.find((item) => item.id === lines[0]?.equipmentId) ?? items[0] ?? null;
  const selectedHeroIndex = selectedHeroItem
    ? items.findIndex((item) => item.id === selectedHeroItem.id)
    : -1;
  const nextHeroItem =
    items.length > 1
      ? items[(Math.max(0, selectedHeroIndex) + 1) % items.length]
      : null;
  const selectedHeroImage = selectedHeroItem
    ? getEquipmentImage(selectedHeroItem.name)
    : null;
  const nextHeroImage = nextHeroItem
    ? getEquipmentImage(nextHeroItem.name)
    : null;

  const selectNextHeroItem = () => {
    if (!nextHeroItem) return;
    updateLine(0, { equipmentId: nextHeroItem.id, quantity: 1 });
  };

  const addRentalLine = () => {
    const selectedIds = new Set(lines.map((line) => line.equipmentId));
    const nextItem = items.find((item) => !selectedIds.has(item.id));

    if (!nextItem) {
      Alert.alert('기자재 확인', '추가로 선택할 수 있는 기자재가 없습니다.');
      return;
    }

    setLines((current) => [
      ...current,
      createRentalLine(nextItem.id, current[0]?.pickupDate ?? today),
    ]);
  };

  const handleSubmit = async () => {
    if (items.length === 0 || lines.some((line) => !line.equipmentId)) {
      Alert.alert('기자재 확인', '대여할 기자재를 선택해 주세요.');
      return;
    }

    if (new Set(lines.map((line) => line.equipmentId)).size !== lines.length) {
      Alert.alert('기자재 확인', '같은 기자재가 중복으로 선택되어 있습니다.');
      return;
    }

    for (const line of lines) {
      const item = items.find((candidate) => candidate.id === line.equipmentId);
      if (!item || line.quantity < 1 || line.quantity > item.total_quantity) {
        Alert.alert(
          '수량 확인',
          `${item?.name ?? '기자재'}는 최대 ${item?.total_quantity ?? 0}개까지 신청할 수 있습니다.`,
        );
        return;
      }

      if (line.pickupDate < today || line.returnDate < line.pickupDate) {
        Alert.alert('날짜 확인', '대여 기간을 정확히 선택해 주세요.');
        return;
      }
    }

    if (!purpose.trim()) {
      Alert.alert('사용 목적 확인', '기자재 사용 목적을 입력해 주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      await createEquipmentRentalRequests(
        lines.map((line) => ({
          equipmentId: line.equipmentId,
          quantity: line.quantity,
          pickupDate: line.pickupDate,
          returnDate: line.returnDate,
          purpose,
        })),
      );
      Alert.alert(
        '신청 완료',
        lines.length > 1
          ? `기자재 ${lines.length}건의 대여 신청이 완료되었습니다.`
          : '기자재 대여 신청이 완료되었습니다.',
        [
          {
            text: '내 신청 확인',
            onPress: () => router.replace('/equipment-requests'),
          },
        ],
      );
    } catch (error) {
      Alert.alert('신청 실패', getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeDateLine = dateSheet ? lines[dateSheet.lineIndex] : null;
  const activeQuantityLine = quantitySheet
    ? lines[quantitySheet.lineIndex]
    : null;
  const activeQuantityItem = activeQuantityLine
    ? items.find((item) => item.id === activeQuantityLine.equipmentId)
    : null;

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="뒤로 가기"
          hitSlop={10}
          onPress={() => router.back()}
          style={styles.headerSide}
        >
          <PlatformHeaderIcon color="#1A2035" name="back" size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>기자재 대여 신청</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/equipment-requests')}
          style={({ pressed }) => [
            styles.headerSide,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.historyText}>내 신청</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.stateBox}>
          <ActivityIndicator color="#3550FF" size="large" />
        </View>
      ) : errorMessage ? (
        <View style={styles.stateBox}>
          <Text style={styles.errorTitle}>기자재 목록을 불러오지 못했습니다.</Text>
          <Text style={styles.stateText}>{errorMessage}</Text>
          <Pressable onPress={() => void loadItems()} style={styles.retryButton}>
            <Text style={styles.retryText}>다시 시도</Text>
          </Pressable>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.stateBox}>
          <Text style={styles.stateText}>대여 가능한 기자재가 없습니다.</Text>
        </View>
      ) : (
        <>
          <KeyboardAwareScrollView
            bottomOffset={84}
            contentContainerStyle={styles.scrollContent}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            style={styles.scrollView}
          >
            <View style={styles.heroSection}>
              <Text style={styles.sectionTitle}>대여 가능 물품</Text>
              {selectedHeroItem ? (
                <View style={styles.heroContent}>
                  <View style={styles.heroArtwork}>
                    {selectedHeroImage ? (
                      <ExpoImage
                        accessible={false}
                        contentFit="cover"
                        source={selectedHeroImage}
                        style={styles.heroImage}
                        transition={150}
                      />
                    ) : (
                      <View style={styles.heroImagePlaceholder}>
                        <Text style={styles.heroImagePlaceholderText}>
                          기자재 이미지
                        </Text>
                      </View>
                    )}
                    {nextHeroItem ? (
                      <Pressable
                        accessibilityLabel={`${nextHeroItem.name} 선택`}
                        onPress={selectNextHeroItem}
                        style={styles.nextPreview}
                      >
                        {nextHeroImage ? (
                          <ExpoImage
                            accessible={false}
                            contentFit="cover"
                            source={nextHeroImage}
                            style={styles.previewImage}
                          />
                        ) : (
                          <View style={styles.previewPlaceholder} />
                        )}
                      </Pressable>
                    ) : null}
                  </View>
                  <View style={styles.heroMeta}>
                    <Text style={styles.heroName}>{selectedHeroItem.name}</Text>
                    <Text style={styles.heroDescription}>
                      {selectedHeroItem.description ?? '학부 기자재 대여 품목'}
                    </Text>
                    <Text style={styles.heroStock}>
                      보유 수량: {selectedHeroItem.total_quantity}개
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>

            <View style={styles.sectionDivider} />

            <View style={styles.formSection}>
              {lines.map((line, lineIndex) => {
                const selectedItem = items.find(
                  (item) => item.id === line.equipmentId,
                );

                return (
                  <View key={line.key} style={styles.rentalBlock}>
                    {lineIndex > 0 ? (
                      <View style={styles.additionalHeader}>
                        <Text style={styles.additionalTitle}>
                          추가 기자재 {lineIndex}
                        </Text>
                        <Pressable
                          hitSlop={8}
                          onPress={() =>
                            setLines((current) =>
                              current.filter((_, index) => index !== lineIndex),
                            )
                          }
                        >
                          <Text style={styles.removeText}>삭제</Text>
                        </Pressable>
                      </View>
                    ) : null}

                    <InlineDropdown
                      accessibilityLabel={`기자재 ${lineIndex + 1} 선택`}
                      isOpen={openEquipmentIndex === lineIndex}
                      label="기자재"
                      onSelect={(equipmentId) => {
                        updateLine(lineIndex, {
                          equipmentId,
                          quantity: 1,
                        });
                        setOpenEquipmentIndex(null);
                      }}
                      onToggle={() =>
                        setOpenEquipmentIndex((current) =>
                          current === lineIndex ? null : lineIndex,
                        )
                      }
                      options={equipmentDropdownOptions}
                      placeholder="기자재를 선택해 주세요"
                      selectedValue={selectedItem?.id ?? null}
                    />

                    <View style={styles.dateGroup}>
                      <View style={styles.dateRow}>
                        <DateButton
                          label="시작일"
                          onPress={() => setDateSheet({ lineIndex })}
                          value={line.pickupDate}
                        />
                        <DateButton
                          label="종료일"
                          onPress={() => setDateSheet({ lineIndex })}
                          value={line.returnDate}
                        />
                      </View>
                      <Text style={styles.rangeSummary}>
                        {line.pickupDate} ~ {line.returnDate} · 총{' '}
                        {inclusiveDays(line.pickupDate, line.returnDate)}일
                      </Text>
                    </View>

                    <FieldGroup label="수량">
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => setQuantitySheet({ lineIndex })}
                        style={({ pressed }) => [
                          styles.selectField,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text style={styles.fieldValue}>{line.quantity}개</Text>
                        <ExpoImage
                          contentFit="contain"
                          source={icons.chevronDown}
                          style={styles.chevronIcon}
                        />
                      </Pressable>
                    </FieldGroup>
                  </View>
                );
              })}

              <Pressable
                accessibilityRole="button"
                onPress={addRentalLine}
                style={({ pressed }) => [
                  styles.addEquipmentButton,
                  pressed && styles.pressed,
                ]}
              >
                <ExpoImage
                  contentFit="contain"
                  source={icons.plus}
                  style={styles.plusIcon}
                />
                <Text style={styles.addEquipmentText}>기자재 추가 대여 하기</Text>
              </Pressable>

              <FieldGroup label="사용 목적">
                <TextInput
                  maxLength={1000}
                  multiline
                  onChangeText={(value) =>
                    setPurpose(maskProfanityInput(value))
                  }
                  placeholder="수업명, 행사명 등 사용 목적을 입력해 주세요"
                  placeholderTextColor="#B7B7B7"
                  style={styles.purposeInput}
                  textAlignVertical="top"
                  value={purpose}
                />
              </FieldGroup>
            </View>
          </KeyboardAwareScrollView>

          <View style={styles.bottomCta}>
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
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitText}>대여 신청</Text>
              )}
            </Pressable>
          </View>
        </>
      )}

      {activeDateLine && dateSheet ? (
        <DateRangeSheet
          endDate={activeDateLine.returnDate}
          minimumDate={today}
          onClose={() => setDateSheet(null)}
          onConfirm={(pickupDate, returnDate) => {
            updateLine(dateSheet.lineIndex, { pickupDate, returnDate });
            setDateSheet(null);
          }}
          startDate={activeDateLine.pickupDate}
          visible
        />
      ) : null}

      {activeQuantityLine && quantitySheet ? (
        <QuantitySheet
          maximum={Math.max(1, activeQuantityItem?.total_quantity ?? 1)}
          onClose={() => setQuantitySheet(null)}
          onConfirm={(quantity) => {
            updateLine(quantitySheet.lineIndex, { quantity });
            setQuantitySheet(null);
          }}
          value={activeQuantityLine.quantity}
          visible
        />
      ) : null}
    </SafeAreaView>
  );
}

function FieldGroup({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function DateButton({
  label,
  onPress,
  value,
}: {
  label: string;
  onPress: () => void;
  value: string;
}) {
  return (
    <View style={styles.dateField}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable
        accessibilityLabel={`${label} 달력 열기`}
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.dateButton, pressed && styles.pressed]}
      >
        <Text style={styles.dateValue}>{value}</Text>
        <ExpoImage
          contentFit="contain"
          source={icons.calendar}
          style={styles.calendarIcon}
        />
      </Pressable>
    </View>
  );
}

function DateRangeSheet({
  endDate,
  minimumDate,
  onClose,
  onConfirm,
  startDate,
  visible,
}: {
  endDate: string;
  minimumDate: string;
  onClose: () => void;
  onConfirm: (startDate: string, endDate: string) => void;
  startDate: string;
  visible: boolean;
}) {
  const [draftStart, setDraftStart] = useState(startDate);
  const [draftEnd, setDraftEnd] = useState(endDate);
  const [month, setMonth] = useState(() => {
    const initial = fromDateKey(startDate);
    return new Date(initial.getFullYear(), initial.getMonth(), 1);
  });
  const [isSelectingEnd, setIsSelectingEnd] = useState(false);

  const selectDate = (date: string) => {
    if (!isSelectingEnd) {
      setDraftStart(date);
      setDraftEnd(date);
      setIsSelectingEnd(true);
      return;
    }

    if (date < draftStart) {
      setDraftStart(date);
      setDraftEnd(date);
      return;
    }

    setDraftEnd(date);
    setIsSelectingEnd(false);
  };

  return (
    <BottomSheetModal
      accessibilityLabel="날짜 선택 닫기"
      backdropColor="rgba(0,0,0,0.5)"
      onRequestClose={onClose}
      visible={visible}
    >
      <SafeAreaView edges={['bottom']} style={styles.dateSheet}>
          <View style={styles.sheetHandle} />
          <MonthCalendar
            minimumDate={minimumDate}
            month={month}
            onChangeMonth={setMonth}
            onSelectDate={selectDate}
            selectedEndDate={draftEnd}
            selectedStartDate={draftStart}
            showMonthControls
          />
          <Pressable
            onPress={() => onConfirm(draftStart, draftEnd)}
            style={({ pressed }) => [
              styles.sheetConfirmButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.sheetConfirmText}>
              {formatKoreanDate(draftStart)} ~ {formatKoreanDate(draftEnd)} (총{' '}
              {inclusiveDays(draftStart, draftEnd)}일)
            </Text>
          </Pressable>
      </SafeAreaView>
    </BottomSheetModal>
  );
}

function QuantitySheet({
  maximum,
  onClose,
  onConfirm,
  value,
  visible,
}: {
  maximum: number;
  onClose: () => void;
  onConfirm: (quantity: number) => void;
  value: number;
  visible: boolean;
}) {
  const safeMaximum = Math.max(1, maximum);
  const initialValue = Math.min(Math.max(1, value), safeMaximum);
  const [draftValue, setDraftValue] = useState(initialValue);
  const dialValues = useMemo(
    () => Array.from({ length: safeMaximum }, (_, index) => index + 1),
    [safeMaximum],
  );
  const wheelRef = useRef<FlatList<number>>(null);

  const scrollToQuantity = (quantity: number, animated = true) => {
    const nextValue = Math.min(Math.max(1, quantity), safeMaximum);
    setDraftValue(nextValue);
    wheelRef.current?.scrollToOffset({
      animated,
      offset: (nextValue - 1) * QUANTITY_WHEEL_ITEM_HEIGHT,
    });
  };

  const updateQuantityFromOffset = (offsetY: number) => {
    const nextIndex = Math.round(offsetY / QUANTITY_WHEEL_ITEM_HEIGHT);
    const nextValue = Math.min(Math.max(1, nextIndex + 1), safeMaximum);
    setDraftValue((current) => (current === nextValue ? current : nextValue));
  };

  return (
    <BottomSheetModal
      accessibilityLabel="수량 선택 닫기"
      backdropColor="rgba(0,0,0,0.5)"
      onRequestClose={onClose}
      visible={visible}
    >
      <SafeAreaView edges={['bottom']} style={styles.quantitySheet}>
          <View style={styles.sheetHandle} />
          <View
            accessibilityActions={[
              { name: 'increment', label: '수량 늘리기' },
              { name: 'decrement', label: '수량 줄이기' },
            ]}
            accessibilityLabel={`수량 ${draftValue}개`}
            accessibilityRole="adjustable"
            accessibilityValue={{
              max: safeMaximum,
              min: 1,
              now: draftValue,
              text: `${draftValue}개`,
            }}
            onAccessibilityAction={({ nativeEvent }) => {
              if (nativeEvent.actionName === 'increment') {
                scrollToQuantity(draftValue + 1);
              } else if (nativeEvent.actionName === 'decrement') {
                scrollToQuantity(draftValue - 1);
              }
            }}
            style={styles.dialViewport}
          >
            <View pointerEvents="none" style={styles.dialSelection} />
            <FlatList
              bounces={false}
              contentContainerStyle={styles.dialContent}
              data={dialValues}
              decelerationRate="fast"
              disableIntervalMomentum
              getItemLayout={(_, index) => ({
                index,
                length: QUANTITY_WHEEL_ITEM_HEIGHT,
                offset: QUANTITY_WHEEL_ITEM_HEIGHT * index,
              })}
              initialScrollIndex={initialValue - 1}
              keyExtractor={(quantity) => String(quantity)}
              onMomentumScrollEnd={({ nativeEvent }) =>
                updateQuantityFromOffset(nativeEvent.contentOffset.y)
              }
              onScroll={({ nativeEvent }) =>
                updateQuantityFromOffset(nativeEvent.contentOffset.y)
              }
              overScrollMode="never"
              ref={wheelRef}
              renderItem={({ item: quantity }) => {
                const signedDistance = quantity - draftValue;
                const distance = Math.abs(signedDistance);

                return (
                  <Pressable
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    onPress={() => scrollToQuantity(quantity)}
                    style={styles.dialItem}
                  >
                    <Text
                      style={[
                        styles.dialText,
                        distance === 1 && styles.dialTextNear,
                        distance >= 2 && styles.dialTextFar,
                        signedDistance < 0 && styles.dialTextAbove,
                        signedDistance > 0 && styles.dialTextBelow,
                        distance === 0 && styles.selectedDialText,
                      ]}
                    >
                      {quantity}
                    </Text>
                  </Pressable>
                );
              }}
              scrollEnabled={dialValues.length > 1}
              scrollEventThrottle={16}
              showsVerticalScrollIndicator={false}
              snapToAlignment="start"
              snapToInterval={QUANTITY_WHEEL_ITEM_HEIGHT}
              style={styles.dial}
            />
          </View>
          <Pressable
            onPress={() => onConfirm(draftValue)}
            style={({ pressed }) => [
              styles.sheetConfirmButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.sheetConfirmText}>확인</Text>
          </Pressable>
      </SafeAreaView>
    </BottomSheetModal>
  );
}

function createRentalLine(equipmentId: string, date: string): RentalLine {
  return {
    key: `${Date.now()}-${Math.random()}`,
    equipmentId,
    pickupDate: date,
    returnDate: date,
    quantity: 1,
  };
}

function getLocalDate(offset: number) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return toDateKey(date);
}

function inclusiveDays(start: string, end: string) {
  const milliseconds =
    fromDateKey(end).getTime() - fromDateKey(start).getTime();
  return Math.max(1, Math.floor(milliseconds / 86_400_000) + 1);
}

function formatKoreanDate(dateKey: string) {
  const date = fromDateKey(dateKey);
  return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}`;
}

function getEquipmentImage(name: string): number | null {
  const normalizedName = name.toLowerCase().replaceAll(' ', '');

  if (normalizedName.includes('dji') && normalizedName.includes('pocket2')) {
    return equipmentImages.djiPocket2;
  }
  if (normalizedName.includes('dslr')) return equipmentImages.dslr;
  if (normalizedName.includes('갤럭시탭')) return equipmentImages.galaxyTab;
  if (normalizedName.includes('짐벌') || normalizedName.includes('gimbal')) {
    return equipmentImages.gimbal;
  }
  if (normalizedName.includes('노트북')) return equipmentImages.notebook;
  if (normalizedName.includes('펜태블릿') || normalizedName.includes('와콤')) {
    return equipmentImages.penTablet;
  }
  if (normalizedName.includes('프로젝터')) return equipmentImages.projector;
  if (normalizedName.includes('sd카드')) return equipmentImages.sdCard;
  if (normalizedName.includes('삼각대')) return equipmentImages.tripod;

  return null;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F7',
  },
  headerSide: {
    width: 48,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#1A2035',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 20,
  },
  historyText: {
    color: '#1B2256',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 14,
  },
  scrollView: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { paddingBottom: 12 },
  heroSection: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 },
  sectionTitle: {
    color: '#1B2A4A',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 18,
  },
  heroContent: { alignItems: 'center', paddingTop: 24 },
  heroArtwork: {
    width: '100%',
    height: 200,
    alignItems: 'center',
    overflow: 'hidden',
  },
  heroImagePlaceholder: {
    width: 241,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#EEF0F4',
  },
  heroImage: {
    width: 241,
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  heroImagePlaceholderText: {
    color: '#9AA2B1',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 13,
  },
  nextPreview: {
    position: 'absolute',
    top: 52,
    right: -58,
    width: 90,
    height: 96,
    overflow: 'hidden',
    borderRadius: 8,
    opacity: 0.4,
  },
  previewImage: { width: '100%', height: '100%', backgroundColor: '#FFFFFF' },
  previewPlaceholder: { width: '100%', height: '100%', backgroundColor: '#D8DCE4' },
  heroMeta: { alignItems: 'center', gap: 6, paddingTop: 16 },
  heroName: {
    color: '#000000',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 14,
  },
  heroDescription: {
    color: '#6B7078',
    fontFamily: 'FreesentationRegular',
    fontSize: 12,
    textAlign: 'center',
  },
  heroStock: {
    color: '#000000',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 14,
  },
  sectionDivider: { height: 8, backgroundColor: '#F5F6FA' },
  formSection: { paddingHorizontal: 16, paddingTop: 16, gap: 24 },
  rentalBlock: { gap: 24 },
  additionalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  additionalTitle: {
    color: '#1B2A4A',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 18,
  },
  removeText: {
    color: '#8A94A6',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 12,
  },
  fieldGroup: { gap: 12 },
  fieldLabel: {
    color: '#1B2A4A',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 18,
  },
  selectField: {
    minHeight: 44,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E4E9F0',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  fieldValue: {
    color: '#333D4B',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 14,
  },
  chevronIcon: { width: 14, height: 14 },
  dateGroup: { gap: 8 },
  dateRow: { flexDirection: 'row', gap: 12 },
  dateField: { flex: 1, gap: 12 },
  dateButton: {
    minHeight: 44,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E4E9F0',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  dateValue: {
    color: '#333D4B',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 14,
  },
  calendarIcon: { width: 16, height: 16 },
  rangeSummary: {
    color: '#253E75',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 12,
  },
  addEquipmentButton: {
    height: 40,
    marginHorizontal: -16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#F5F6FA',
  },
  plusIcon: { width: 20, height: 20 },
  addEquipmentText: {
    color: '#000000',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 12,
  },
  purposeInput: {
    height: 140,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E4E9F0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    color: '#333D4B',
    fontFamily: 'FreesentationRegular',
    fontSize: 14,
    lineHeight: 20,
  },
  bottomCta: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  submitButton: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 26,
    backgroundColor: '#3550FF',
  },
  submitText: {
    color: '#FFFFFF',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 16,
  },
  stateBox: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorTitle: {
    color: COLORS.error,
    fontFamily: 'FreesentationExtraBold',
    fontSize: 15,
    textAlign: 'center',
  },
  stateText: {
    marginTop: 10,
    color: COLORS.subText,
    fontFamily: 'FreesentationRegular',
    fontSize: 13,
    textAlign: 'center',
  },
  retryButton: {
    minHeight: 42,
    marginTop: 18,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    backgroundColor: '#3550FF',
  },
  retryText: {
    color: '#FFFFFF',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 13,
  },
  dateSheet: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  quantitySheet: {
    maxHeight: '78%',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  sheetHandle: {
    width: 30,
    height: 5,
    alignSelf: 'center',
    borderRadius: 20,
    backgroundColor: '#626262',
  },
  sheetConfirmButton: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 26,
    backgroundColor: '#3550FF',
  },
  sheetConfirmText: {
    color: '#FFFFFF',
    fontFamily: 'FreesentationExtraBold',
    fontSize: 15,
  },
  dialViewport: {
    position: 'relative',
    height: QUANTITY_WHEEL_ITEM_HEIGHT * QUANTITY_WHEEL_VISIBLE_ITEMS,
    overflow: 'hidden',
  },
  dial: { flex: 1 },
  dialContent: {
    alignItems: 'center',
    paddingVertical: QUANTITY_WHEEL_PADDING,
  },
  dialSelection: {
    position: 'absolute',
    top: QUANTITY_WHEEL_PADDING,
    right: 36,
    left: 36,
    height: QUANTITY_WHEEL_ITEM_HEIGHT,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D7DBE5',
    backgroundColor: '#F8F9FF',
  },
  dialItem: {
    width: 271,
    height: QUANTITY_WHEEL_ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialText: {
    color: '#18181B',
    fontFamily: 'FreesentationSemiBold',
    fontSize: 38,
    opacity: 0.14,
  },
  dialTextNear: { fontSize: 32, opacity: 0.45, transform: [{ scale: 0.86 }] },
  dialTextFar: { fontSize: 26, opacity: 0.14, transform: [{ scale: 0.7 }] },
  dialTextAbove: { transform: [{ perspective: 600 }, { rotateX: '-32deg' }] },
  dialTextBelow: { transform: [{ perspective: 600 }, { rotateX: '32deg' }] },
  selectedDialText: {
    fontFamily: 'FreesentationExtraBold',
    fontSize: 48,
    opacity: 1,
    transform: [{ scale: 1 }],
  },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.65 },
});
