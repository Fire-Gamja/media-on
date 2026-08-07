import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { AssistantChatRoom } from "../../components/assistant/AssistantChatRoom";
import { AppIcon, type AppIconName } from "../../components/common/AppIcon";
import { COLORS } from "../../constants/colors";
import { isSupabaseConfigured } from "../../lib/supabase";
import {
  adminDeleteAssistantInquiry,
  getAdminAssistantInquiries,
  getAssistantCategoryLabel,
  getAssistantStatusLabel,
  type AdminAssistantInquiry,
} from "../../services/assistant-inquiries";
import {
  getApprovedStudentCount,
  getAuthErrorMessage,
  getCurrentProfile,
  getPendingStudents,
  reviewStudentAccount,
  signOutUser,
  type AdminStudentProfile,
  type StudentProfile,
} from "../../services/auth";
import {
  adminDeleteEquipmentRentalRequest,
  getAdminEquipmentRentalRequests,
  getEquipmentStatusLabel,
  transitionEquipmentRentalRequest,
  type AdminEquipmentRentalRequest,
  type EquipmentRequestStatus,
} from "../../services/equipment-rentals";
import {
  adminDeleteFacilityReport,
  getAdminFacilityReports,
  getFacilityCategoryLabel,
  getFacilityStatusLabel,
  transitionFacilityReport,
  type AdminFacilityReport,
  type FacilityReportStatus,
} from "../../services/facility-reports";
import {
  deleteNotice,
  formatNoticeTitle,
  getAdminNotices,
  type Notice,
} from "../../services/notices";
import {
  cancelPreGraduationReservation,
  getPreGraduationSchedule,
  getPreGraduationSettings,
  getPreGraduationWeekdayLabel,
  PRE_GRADUATION_WEEKDAYS,
  updatePreGraduationSettings,
  type PreGraduationSlot,
  type PreGraduationWeekday,
} from "../../services/pre-graduation";
import {
  adminDeleteRoomReservationRequest,
  getAdminRoomReservationRequests,
  getRoomStatusLabel,
  transitionRoomReservationRequest,
  type AdminRoomReservationRequest,
  type RoomReservationStatus,
} from "../../services/room-reservations";

type SectionId =
  | "overview"
  | "inquiry"
  | "equipment"
  | "room"
  | "facility"
  | "notice"
  | "graduation"
  | "students"
  | "settings";

type WorkspaceRecord =
  | { key: string; kind: "inquiry"; data: AdminAssistantInquiry }
  | { key: string; kind: "equipment"; data: AdminEquipmentRentalRequest }
  | { key: string; kind: "room"; data: AdminRoomReservationRequest }
  | { key: string; kind: "facility"; data: AdminFacilityReport }
  | { key: string; kind: "notice"; data: Notice }
  | { key: string; kind: "student"; data: AdminStudentProfile }
  | { key: string; kind: "graduation"; data: PreGraduationSlot };

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type NavItem = {
  id: SectionId;
  label: string;
  icon: AppIconName;
  badge?: number;
};

const SECTION_COPY: Record<SectionId, { title: string; description: string }> =
  {
    overview: {
      title: "업무 대기함",
      description: "처리가 필요한 신청과 문의를 오래된 순서로 확인합니다.",
    },
    inquiry: {
      title: "조교 문의",
      description:
        "학생 문의를 선택하면 오른쪽에서 바로 실시간 상담할 수 있습니다.",
    },
    equipment: {
      title: "기자재 대여",
      description: "신청부터 승인, 대여, 반납까지 상태를 관리합니다.",
    },
    room: {
      title: "실습실 대여",
      description: "신청 내용과 ERP 확인 상태를 관리합니다.",
    },
    facility: {
      title: "시설 신고",
      description: "접수된 시설 문제를 확인하고 처리 상태를 변경합니다.",
    },
    notice: {
      title: "공지사항",
      description: "학부 공지를 작성하고 게시 상태를 관리합니다.",
    },
    graduation: {
      title: "예비졸업사정",
      description: "학생 접근, 신청 요일, 예약 현황을 한 번에 관리합니다.",
    },
    students: {
      title: "가입 승인",
      description: "신규 학생의 학번과 정보를 확인해 가입을 처리합니다.",
    },
    settings: {
      title: "운영 설정",
      description: "홈 팝업, 운영시간, 계정 관련 설정을 관리합니다.",
    },
  };

export default function AdminDesktopHomeScreen() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [students, setStudents] = useState<AdminStudentProfile[]>([]);
  const [approvedStudentCount, setApprovedStudentCount] = useState(0);
  const [equipmentRequests, setEquipmentRequests] = useState<
    AdminEquipmentRentalRequest[]
  >([]);
  const [roomRequests, setRoomRequests] = useState<
    AdminRoomReservationRequest[]
  >([]);
  const [facilityReports, setFacilityReports] = useState<AdminFacilityReport[]>(
    [],
  );
  const [inquiries, setInquiries] = useState<AdminAssistantInquiry[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [graduationSlots, setGraduationSlots] = useState<PreGraduationSlot[]>(
    [],
  );
  const [graduationAccess, setGraduationAccess] = useState(false);
  const [graduationWeekdays, setGraduationWeekdays] = useState<
    PreGraduationWeekday[]
  >([]);
  const [activeSection, setActiveSection] = useState<SectionId>("overview");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [adminNote, setAdminNote] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(
    null,
  );

  const loadWorkspace = useCallback(async (refreshing = false) => {
    if (!isSupabaseConfigured) {
      setErrorMessage("Supabase 프로젝트 정보가 설정되지 않았습니다.");
      setIsLoading(false);
      return;
    }

    refreshing ? setIsRefreshing(true) : setIsLoading(true);

    try {
      setErrorMessage(null);
      const [
        nextProfile,
        nextStudents,
        nextApprovedStudentCount,
        nextEquipment,
        nextRooms,
        nextFacilities,
        nextInquiries,
        nextNotices,
        nextGraduationSettings,
        nextGraduationSlots,
      ] = await Promise.all([
        getCurrentProfile(),
        getPendingStudents(),
        getApprovedStudentCount(),
        getAdminEquipmentRentalRequests(),
        getAdminRoomReservationRequests(),
        getAdminFacilityReports(),
        getAdminAssistantInquiries(),
        getAdminNotices(),
        getPreGraduationSettings(),
        getPreGraduationSchedule(),
      ]);

      if (nextProfile.role !== "admin") {
        router.replace("/home");
        return;
      }

      setProfile(nextProfile);
      setStudents(nextStudents);
      setApprovedStudentCount(nextApprovedStudentCount);
      setEquipmentRequests(nextEquipment);
      setRoomRequests(nextRooms);
      setFacilityReports(nextFacilities);
      setInquiries(nextInquiries);
      setNotices(nextNotices);
      setGraduationAccess(nextGraduationSettings.access_enabled);
      setGraduationWeekdays(nextGraduationSettings.enabled_weekdays);
      setGraduationSlots(nextGraduationSlots);
    } catch (error) {
      const message = getAuthErrorMessage(error);
      if (message.includes("로그인")) {
        router.replace("/login");
      } else {
        setErrorMessage(message);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  useEffect(() => {
    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    return () =>
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
  }, []);

  const queue = useMemo<WorkspaceRecord[]>(
    () =>
      [
        ...inquiries
          .filter((item) => item.status !== "answered")
          .map((data) => ({
            key: `inquiry-${data.id}`,
            kind: "inquiry" as const,
            data,
          })),
        ...equipmentRequests
          .filter((item) => item.status === "submitted")
          .map((data) => ({
            key: `equipment-${data.id}`,
            kind: "equipment" as const,
            data,
          })),
        ...roomRequests
          .filter((item) =>
            ["submitted", "received", "erp_checking"].includes(item.status),
          )
          .map((data) => ({
            key: `room-${data.id}`,
            kind: "room" as const,
            data,
          })),
        ...facilityReports
          .filter((item) =>
            ["submitted", "received", "in_progress"].includes(item.status),
          )
          .map((data) => ({
            key: `facility-${data.id}`,
            kind: "facility" as const,
            data,
          })),
      ].sort(
        (left, right) =>
          new Date(left.data.created_at).getTime() -
          new Date(right.data.created_at).getTime(),
      ),
    [equipmentRequests, facilityReports, inquiries, roomRequests],
  );

  const sectionRecords = useMemo<WorkspaceRecord[]>(() => {
    if (activeSection === "overview") return queue;
    if (activeSection === "inquiry") {
      return inquiries.map((data) => ({
        key: `inquiry-${data.id}`,
        kind: "inquiry",
        data,
      }));
    }
    if (activeSection === "equipment") {
      return equipmentRequests.map((data) => ({
        key: `equipment-${data.id}`,
        kind: "equipment",
        data,
      }));
    }
    if (activeSection === "room") {
      return roomRequests.map((data) => ({
        key: `room-${data.id}`,
        kind: "room",
        data,
      }));
    }
    if (activeSection === "facility") {
      return facilityReports.map((data) => ({
        key: `facility-${data.id}`,
        kind: "facility",
        data,
      }));
    }
    if (activeSection === "notice") {
      return notices.map((data) => ({
        key: `notice-${data.id}`,
        kind: "notice",
        data,
      }));
    }
    if (activeSection === "students") {
      return students.map((data) => ({
        key: `student-${data.id}`,
        kind: "student",
        data,
      }));
    }
    if (activeSection === "graduation") {
      return graduationSlots
        .filter((data) => Boolean(data.reservation_id))
        .map((data) => ({
          key: `graduation-${data.reservation_id}`,
          kind: "graduation",
          data,
        }));
    }
    return [];
  }, [
    activeSection,
    equipmentRequests,
    facilityReports,
    graduationSlots,
    inquiries,
    notices,
    queue,
    roomRequests,
    students,
  ]);

  const statusOptions = useMemo(() => {
    const options = new Map<string, string>();
    sectionRecords.forEach((record) => {
      if (activeSection === "overview") {
        options.set(record.kind, getRecordKindLabel(record.kind));
      } else {
        const status = getRecordStatus(record);
        options.set(status.value, status.label);
      }
    });
    return [...options.entries()].map(([value, label]) => ({ value, label }));
  }, [activeSection, sectionRecords]);

  const visibleRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("ko-KR");
    return sectionRecords.filter((record) => {
      const matchesStatus =
        statusFilter === "all" ||
        (activeSection === "overview"
          ? record.kind === statusFilter
          : getRecordStatus(record).value === statusFilter);
      const matchesQuery =
        !normalizedQuery ||
        getRecordSearchText(record)
          .toLocaleLowerCase("ko-KR")
          .includes(normalizedQuery);
      return matchesStatus && matchesQuery;
    });
  }, [activeSection, query, sectionRecords, statusFilter]);

  const selectedRecord = useMemo(
    () => visibleRecords.find((record) => record.key === selectedKey) ?? null,
    [selectedKey, visibleRecords],
  );

  useEffect(() => {
    if (visibleRecords.length === 0) {
      setSelectedKey(null);
      return;
    }
    if (!visibleRecords.some((record) => record.key === selectedKey)) {
      setSelectedKey(visibleRecords[0].key);
    }
  }, [selectedKey, visibleRecords]);

  useEffect(() => {
    setQuery("");
    setStatusFilter("all");
    setSelectedKey(null);
    setAdminNote("");
  }, [activeSection]);

  const pendingCounts = useMemo(
    () => ({
      inquiry: inquiries.filter((item) => item.status !== "answered").length,
      equipment: equipmentRequests.filter((item) => item.status === "submitted")
        .length,
      room: roomRequests.filter(
        (item) => item.status !== "approved" && item.status !== "rejected",
      ).length,
      facility: facilityReports.filter(
        (item) => item.status !== "resolved" && item.status !== "rejected",
      ).length,
    }),
    [equipmentRequests, facilityReports, inquiries, roomRequests],
  );

  const navItems: NavItem[] = [
    { id: "overview", label: "업무 대기함", icon: "bell", badge: queue.length },
    {
      id: "inquiry",
      label: "조교 문의",
      icon: "assistant",
      badge: pendingCounts.inquiry,
    },
    {
      id: "equipment",
      label: "기자재 대여",
      icon: "equipment",
      badge: pendingCounts.equipment,
    },
    {
      id: "room",
      label: "실습실 대여",
      icon: "room",
      badge: pendingCounts.room,
    },
    {
      id: "facility",
      label: "시설 신고",
      icon: "report",
      badge: pendingCounts.facility,
    },
    { id: "notice", label: "공지사항", icon: "notice" },
    { id: "graduation", label: "예비졸업사정", icon: "graduation" },
    {
      id: "students",
      label: "가입 승인",
      icon: "check",
      badge: students.length,
    },
    { id: "settings", label: "운영 설정", icon: "settings" },
  ];

  const switchSection = (section: SectionId) => {
    setActiveSection(section);
  };

  const runAction = async (action: () => Promise<void>, success: string) => {
    try {
      setIsProcessing(true);
      await action();
      setAdminNote("");
      await loadWorkspace(true);
      Alert.alert("처리 완료", success);
    } catch (error) {
      Alert.alert("처리 실패", getAuthErrorMessage(error));
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmAction = (message: string, action: () => Promise<void>) => {
    if (!window.confirm(message)) return;
    void action();
  };

  const handleInstall = async () => {
    if (!installPrompt) {
      Alert.alert(
        "PC에 설치하기",
        "Chrome 또는 Edge 주소창 오른쪽의 설치 아이콘을 눌러 MEDIA ON을 설치해 주세요.",
      );
      return;
    }
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  const handleLogout = () => {
    confirmAction("관리자 계정에서 로그아웃하시겠습니까?", async () => {
      await signOutUser();
      router.replace("/login");
    });
  };

  const handleGraduationSave = () => {
    if (graduationAccess && graduationWeekdays.length === 0) {
      Alert.alert("요일 선택", "신청받을 요일을 한 개 이상 선택해 주세요.");
      return;
    }
    void runAction(
      async () => {
        await updatePreGraduationSettings({
          accessEnabled: graduationAccess,
          enabledWeekdays: graduationWeekdays,
        });
      },
      graduationAccess
        ? "4학년 학생의 예비졸업사정 신청을 열었습니다."
        : "예비졸업사정 신청 접근을 닫았습니다.",
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centeredState}>
        <ActivityIndicator color={COLORS.navy} size="large" />
        <Text style={styles.centeredStateText}>
          관리자 업무를 불러오고 있습니다.
        </Text>
      </View>
    );
  }

  if (errorMessage && !profile) {
    return (
      <View style={styles.centeredState}>
        <View style={styles.errorIcon}>
          <Text style={styles.errorIconText}>!</Text>
        </View>
        <Text style={styles.errorTitle}>관리자 화면을 열지 못했습니다.</Text>
        <Text style={styles.errorMessage}>{errorMessage}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => void loadWorkspace()}
          style={styles.primaryStandaloneButton}
        >
          <Text style={styles.primaryStandaloneButtonText}>다시 시도</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.app}>
      <StatusBar style="light" />
      <View style={styles.sidebar}>
        <View style={styles.brandArea}>
          <View style={styles.brandMark}>
            <Text style={styles.brandMarkText}>M</Text>
          </View>
          <View>
            <Text style={styles.brandName}>MEDIA ON</Text>
            <Text style={styles.brandCaption}>미디어콘텐츠학부 관리자</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.nav}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.navGroupLabel}>업무 관리</Text>
          {navItems.slice(0, 5).map((item) => (
            <SidebarItem
              active={activeSection === item.id}
              item={item}
              key={item.id}
              onPress={() => switchSection(item.id)}
            />
          ))}
          <Text style={styles.navGroupLabel}>콘텐츠 및 계정</Text>
          {navItems.slice(5).map((item) => (
            <SidebarItem
              active={activeSection === item.id}
              item={item}
              key={item.id}
              onPress={() => switchSection(item.id)}
            />
          ))}
        </ScrollView>

        <View style={styles.sidebarFooter}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/profile")}
            style={({ pressed }) => [
              styles.adminProfile,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.adminAvatar}>
              <Text style={styles.adminAvatarText}>
                {(profile?.name ?? "조교").slice(0, 1)}
              </Text>
            </View>
            <View style={styles.adminIdentity}>
              <Text numberOfLines={1} style={styles.adminName}>
                {profile?.name ?? "조교"}님
              </Text>
              <Text style={styles.adminRole}>관리자 계정</Text>
            </View>
            <Text style={styles.profileChevron}>›</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={handleLogout}
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.logoutText}>로그아웃</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.main}>
        <View style={styles.topbar}>
          <View>
            <Text style={styles.pageTitle}>
              {SECTION_COPY[activeSection].title}
            </Text>
            <Text style={styles.pageDescription}>
              {SECTION_COPY[activeSection].description}
            </Text>
          </View>
          <View style={styles.topbarActions}>
            {activeSection === "notice" ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push("/admin-notice-editor")}
                style={({ pressed }) => [
                  styles.installButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.installButtonText}>공지 작성</Text>
              </Pressable>
            ) : null}
            <Pressable
              accessibilityRole="button"
              onPress={() => void loadWorkspace(true)}
              style={({ pressed }) => [
                styles.secondaryTopbarButton,
                pressed && styles.pressed,
              ]}
            >
              {isRefreshing ? (
                <ActivityIndicator color={COLORS.navy} size="small" />
              ) : (
                <Text style={styles.secondaryTopbarButtonText}>새로고침</Text>
              )}
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => void handleInstall()}
              style={({ pressed }) => [
                styles.installButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.installButtonText}>PC에 설치</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.workspace}>
          <View style={styles.listPane}>
            {activeSection === "overview" ? (
              <View style={styles.metricGrid}>
                <MetricCard label="조치 대기" value={queue.length} />
                <MetricCard label="가입 대기" value={students.length} />
                <MetricCard label="재학생" value={approvedStudentCount} />
              </View>
            ) : null}

            {activeSection === "graduation" ? (
              <GraduationSettingsCard
                accessEnabled={graduationAccess}
                enabledWeekdays={graduationWeekdays}
                isSaving={isProcessing}
                onAccessChange={setGraduationAccess}
                onSave={handleGraduationSave}
                onToggleWeekday={(weekday) =>
                  setGraduationWeekdays((current) =>
                    current.includes(weekday)
                      ? current.filter((item) => item !== weekday)
                      : [...current, weekday].sort(
                          (left, right) => left - right,
                        ),
                  )
                }
              />
            ) : null}

            {activeSection === "settings" ? (
              <SettingsList />
            ) : (
              <>
                <View style={styles.searchBox}>
                  <AppIcon color={COLORS.placeholder} name="search" size={20} />
                  <TextInput
                    accessibilityLabel="목록 검색"
                    onChangeText={setQuery}
                    placeholder="이름, 학번, 내용 검색"
                    placeholderTextColor={COLORS.placeholder}
                    style={styles.searchInput}
                    value={query}
                  />
                </View>

                {statusOptions.length > 1 ? (
                  <ScrollView
                    contentContainerStyle={styles.filterRow}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                  >
                    <FilterChip
                      active={statusFilter === "all"}
                      label="전체"
                      onPress={() => setStatusFilter("all")}
                    />
                    {statusOptions.map((option) => (
                      <FilterChip
                        active={statusFilter === option.value}
                        key={option.value}
                        label={option.label}
                        onPress={() => setStatusFilter(option.value)}
                      />
                    ))}
                  </ScrollView>
                ) : null}

                <View style={styles.listHeading}>
                  <Text style={styles.listHeadingText}>
                    {activeSection === "graduation" ? "예약자" : "전체 목록"}
                  </Text>
                  <Text style={styles.listCount}>
                    {visibleRecords.length}건
                  </Text>
                </View>

                <ScrollView
                  contentContainerStyle={styles.recordList}
                  showsVerticalScrollIndicator={false}
                  style={styles.recordScroller}
                >
                  {visibleRecords.length === 0 ? (
                    <View style={styles.emptyList}>
                      <Text style={styles.emptyListTitle}>
                        표시할 항목이 없습니다.
                      </Text>
                      <Text style={styles.emptyListText}>
                        검색 조건을 바꾸거나 새로고침해 주세요.
                      </Text>
                    </View>
                  ) : (
                    visibleRecords.map((record) => (
                      <RecordCard
                        active={record.key === selectedKey}
                        key={record.key}
                        onPress={() => {
                          setSelectedKey(record.key);
                          setAdminNote("");
                        }}
                        record={record}
                      />
                    ))
                  )}
                </ScrollView>
              </>
            )}
          </View>

          <View style={styles.detailPane}>
            {activeSection === "settings" ? (
              <SettingsWelcome />
            ) : selectedRecord ? (
              <RecordDetail
                adminNote={adminNote}
                isProcessing={isProcessing}
                onAdminNoteChange={setAdminNote}
                onConfirm={confirmAction}
                onRefresh={() => void loadWorkspace(true)}
                onRunAction={runAction}
                record={selectedRecord}
              />
            ) : activeSection === "graduation" ? (
              <EmptyDetail
                description="왼쪽에서 학생 접근과 신청 요일을 설정할 수 있습니다. 예약자가 생기면 목록에서 선택해 상세 내용을 확인하세요."
                icon="graduation"
                title="예비졸업사정 예약 관리"
              />
            ) : (
              <EmptyDetail
                description="왼쪽 목록에서 항목을 선택하면 상세 내용과 처리 버튼이 표시됩니다."
                icon={getSectionIcon(activeSection)}
                title="확인할 항목을 선택해 주세요"
              />
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

function SidebarItem({
  active,
  item,
  onPress,
}: {
  active: boolean;
  item: NavItem;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.navItem,
        active && styles.navItemActive,
        pressed && styles.pressed,
      ]}
    >
      <AppIcon
        color={active ? COLORS.navy : "#CBD2EE"}
        monochrome
        name={item.icon}
        size={21}
      />
      <Text style={[styles.navItemText, active && styles.navItemTextActive]}>
        {item.label}
      </Text>
      {item.badge ? (
        <View style={[styles.navBadge, active && styles.navBadgeActive]}>
          <Text
            style={[styles.navBadgeText, active && styles.navBadgeTextActive]}
          >
            {item.badge > 99 ? "99+" : item.badge}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function FilterChip({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.filterChip, active && styles.filterChipActive]}
    >
      <Text
        style={[styles.filterChipText, active && styles.filterChipTextActive]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function RecordCard({
  active,
  onPress,
  record,
}: {
  active: boolean;
  onPress: () => void;
  record: WorkspaceRecord;
}) {
  const summary = getRecordSummary(record);
  const status = getRecordStatus(record);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.recordCard,
        active && styles.recordCardActive,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.recordIcon, active && styles.recordIconActive]}>
        <AppIcon
          color={active ? COLORS.white : COLORS.navy}
          monochrome
          name={summary.icon}
          size={21}
        />
      </View>
      <View style={styles.recordTextArea}>
        <View style={styles.recordTopRow}>
          <Text numberOfLines={1} style={styles.recordIdentity}>
            {summary.identity}
          </Text>
          <Text style={styles.recordDate}>{summary.date}</Text>
        </View>
        <Text numberOfLines={1} style={styles.recordTitle}>
          {summary.title}
        </Text>
        <View style={styles.recordBottomRow}>
          <View style={[styles.statusDot, { backgroundColor: status.color }]} />
          <Text style={styles.recordStatus}>{status.label}</Text>
          {summary.meta ? (
            <Text numberOfLines={1} style={styles.recordMeta}>
              · {summary.meta}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

function RecordDetail({
  adminNote,
  isProcessing,
  onAdminNoteChange,
  onConfirm,
  onRefresh,
  onRunAction,
  record,
}: {
  adminNote: string;
  isProcessing: boolean;
  onAdminNoteChange: (value: string) => void;
  onConfirm: (message: string, action: () => Promise<void>) => void;
  onRefresh: () => void;
  onRunAction: (action: () => Promise<void>, success: string) => Promise<void>;
  record: WorkspaceRecord;
}) {
  if (record.kind === "inquiry") {
    const inquiry = record.data;
    return (
      <View style={styles.chatDetail}>
        <AssistantChatRoom
          canStartChat
          header={
            <>
              <DetailHeader
                category={getAssistantCategoryLabel(inquiry.category)}
                identity={formatRequester(inquiry.requester)}
                status={getAssistantStatusLabel(inquiry.status)}
                title={inquiry.title}
              />
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionLabel}>문의 내용</Text>
                <Text style={styles.detailBody}>{inquiry.content}</Text>
              </View>
              <View style={styles.inlineActions}>
                <DangerButton
                  disabled={isProcessing}
                  label="문의 삭제"
                  onPress={() =>
                    onConfirm(
                      "이 조교 문의와 채팅 내용을 삭제하시겠습니까? 삭제하면 복구할 수 없습니다.",
                      () =>
                        onRunAction(
                          () => adminDeleteAssistantInquiry(inquiry.id),
                          "조교 문의를 삭제했습니다.",
                        ),
                    )
                  }
                />
              </View>
              <View style={styles.chatDivider} />
              <Text style={styles.chatSectionTitle}>실시간 상담</Text>
            </>
          }
          inquiryId={inquiry.id}
          onStatusChange={onRefresh}
          status={inquiry.status}
        />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.detailContent}
      showsVerticalScrollIndicator={false}
      style={styles.detailScroller}
    >
      {record.kind === "equipment" ? (
        <EquipmentDetail
          adminNote={adminNote}
          isProcessing={isProcessing}
          onAdminNoteChange={onAdminNoteChange}
          onConfirm={onConfirm}
          onRunAction={onRunAction}
          request={record.data}
        />
      ) : null}
      {record.kind === "room" ? (
        <RoomDetail
          adminNote={adminNote}
          isProcessing={isProcessing}
          onAdminNoteChange={onAdminNoteChange}
          onConfirm={onConfirm}
          onRunAction={onRunAction}
          request={record.data}
        />
      ) : null}
      {record.kind === "facility" ? (
        <FacilityDetail
          adminNote={adminNote}
          isProcessing={isProcessing}
          onAdminNoteChange={onAdminNoteChange}
          onConfirm={onConfirm}
          onRunAction={onRunAction}
          report={record.data}
        />
      ) : null}
      {record.kind === "notice" ? (
        <NoticeDetail
          isProcessing={isProcessing}
          notice={record.data}
          onConfirm={onConfirm}
          onRunAction={onRunAction}
        />
      ) : null}
      {record.kind === "student" ? (
        <StudentDetail
          isProcessing={isProcessing}
          onConfirm={onConfirm}
          onRunAction={onRunAction}
          student={record.data}
        />
      ) : null}
      {record.kind === "graduation" ? (
        <GraduationDetail
          isProcessing={isProcessing}
          onConfirm={onConfirm}
          onRunAction={onRunAction}
          slot={record.data}
        />
      ) : null}
    </ScrollView>
  );
}

type ActionProps = {
  adminNote: string;
  isProcessing: boolean;
  onAdminNoteChange: (value: string) => void;
  onConfirm: (message: string, action: () => Promise<void>) => void;
  onRunAction: (action: () => Promise<void>, success: string) => Promise<void>;
};

function EquipmentDetail({
  adminNote,
  isProcessing,
  onAdminNoteChange,
  onConfirm,
  onRunAction,
  request,
}: ActionProps & { request: AdminEquipmentRentalRequest }) {
  const transition = (status: EquipmentRequestStatus, success: string) => {
    if (status === "rejected" && !adminNote.trim()) {
      Alert.alert(
        "반려 사유 확인",
        "학생에게 표시할 반려 사유를 입력해 주세요.",
      );
      return;
    }
    onConfirm("이 대여 신청의 상태를 변경하시겠습니까?", () =>
      onRunAction(
        () =>
          transitionEquipmentRentalRequest(
            request.id,
            status,
            status === "rejected" ? adminNote : "",
          ),
        success,
      ),
    );
  };

  return (
    <>
      <DetailHeader
        category="기자재 대여"
        identity={formatRequester(request.requester)}
        status={getEquipmentStatusLabel(request.status)}
        title={`${request.equipment?.name ?? "기자재"} ${request.quantity}개`}
      />
      <DetailSection title="신청 정보">
        <DetailRow
          label="대여 기간"
          value={`${request.pickup_date} ~ ${request.return_date}`}
        />
        <DetailRow
          label="기자재 분류"
          value={request.equipment?.category ?? "미확인"}
        />
        <DetailRow label="신청일" value={formatDateTime(request.created_at)} />
        <DetailParagraph label="사용 목적" value={request.purpose} />
      </DetailSection>
      {request.admin_note ? (
        <DetailParagraph label="관리자 메모" value={request.admin_note} />
      ) : null}
      <WorkflowCard
        adminNote={adminNote}
        isProcessing={isProcessing}
        notePlaceholder="반려 사유를 입력해 주세요"
        onAdminNoteChange={onAdminNoteChange}
        showNote={request.status === "submitted"}
      >
        {request.status === "submitted" ? (
          <>
            <DangerButton
              disabled={isProcessing}
              label="반려"
              onPress={() =>
                transition("rejected", "대여 신청을 반려했습니다.")
              }
            />
            <PrimaryButton
              disabled={isProcessing}
              label="승인하기"
              onPress={() =>
                transition("approved", "대여 신청을 승인했습니다.")
              }
            />
          </>
        ) : null}
        {request.status === "approved" ? (
          <PrimaryButton
            disabled={isProcessing}
            label="대여 시작"
            onPress={() =>
              transition("checked_out", "기자재를 대여 중으로 변경했습니다.")
            }
          />
        ) : null}
        {request.status === "checked_out" ? (
          <PrimaryButton
            disabled={isProcessing}
            label="반납 완료"
            onPress={() =>
              transition("returned", "기자재 반납을 완료 처리했습니다.")
            }
          />
        ) : null}
      </WorkflowCard>
      <DeleteSection
        disabled={isProcessing}
        label="대여 신청 삭제"
        onPress={() =>
          onConfirm(
            "이 대여 신청을 삭제하시겠습니까? 삭제하면 복구할 수 없습니다.",
            () =>
              onRunAction(
                () => adminDeleteEquipmentRentalRequest(request.id),
                "대여 신청을 삭제했습니다.",
              ),
          )
        }
      />
    </>
  );
}

function RoomDetail({
  adminNote,
  isProcessing,
  onAdminNoteChange,
  onConfirm,
  onRunAction,
  request,
}: ActionProps & { request: AdminRoomReservationRequest }) {
  const transition = (status: RoomReservationStatus, success: string) => {
    if (status === "rejected" && !adminNote.trim()) {
      Alert.alert(
        "반려 사유 확인",
        "학생에게 표시할 반려 사유를 입력해 주세요.",
      );
      return;
    }
    onConfirm("이 실습실 신청의 상태를 변경하시겠습니까?", () =>
      onRunAction(
        () =>
          transitionRoomReservationRequest(
            request.id,
            status,
            status === "rejected" ? adminNote : "",
          ),
        success,
      ),
    );
  };

  return (
    <>
      <DetailHeader
        category="실습실 대여"
        identity={formatRequester(request.requester)}
        status={getRoomStatusLabel(request.status)}
        title={request.room?.name ?? "실습실 대여 신청"}
      />
      <DetailSection title="예약 정보">
        <DetailRow label="장소" value={request.room?.location ?? "미확인"} />
        <DetailRow
          label="예약 날짜"
          value={`${request.reservation_date} ~ ${request.end_date}`}
        />
        <DetailRow
          label="이용 시간"
          value={`${request.start_time.slice(0, 5)} ~ ${request.end_time.slice(0, 5)}`}
        />
        <DetailRow label="인원" value={`${request.attendee_count}명`} />
        <DetailParagraph label="사용 목적" value={request.purpose} />
      </DetailSection>
      <WorkflowCard
        adminNote={adminNote}
        isProcessing={isProcessing}
        notePlaceholder="반려 사유를 입력해 주세요"
        onAdminNoteChange={onAdminNoteChange}
        showNote={request.status === "submitted"}
      >
        {request.status === "submitted" ? (
          <>
            <DangerButton
              disabled={isProcessing}
              label="반려"
              onPress={() =>
                transition("rejected", "실습실 신청을 반려했습니다.")
              }
            />
            <PrimaryButton
              disabled={isProcessing}
              label="접수하기"
              onPress={() =>
                transition("received", "실습실 신청을 접수했습니다.")
              }
            />
          </>
        ) : null}
        {request.status === "received" ? (
          <PrimaryButton
            disabled={isProcessing}
            label="ERP 확인 시작"
            onPress={() =>
              transition("erp_checking", "ERP 확인 중으로 변경했습니다.")
            }
          />
        ) : null}
        {request.status === "erp_checking" ? (
          <PrimaryButton
            disabled={isProcessing}
            label="승인 완료"
            onPress={() =>
              transition("approved", "실습실 예약을 승인했습니다.")
            }
          />
        ) : null}
      </WorkflowCard>
      <DeleteSection
        disabled={isProcessing}
        label="실습실 신청 삭제"
        onPress={() =>
          onConfirm(
            "이 실습실 신청을 삭제하시겠습니까? 삭제하면 복구할 수 없습니다.",
            () =>
              onRunAction(
                () => adminDeleteRoomReservationRequest(request.id),
                "실습실 신청을 삭제했습니다.",
              ),
          )
        }
      />
    </>
  );
}

function FacilityDetail({
  adminNote,
  isProcessing,
  onAdminNoteChange,
  onConfirm,
  onRunAction,
  report,
}: ActionProps & { report: AdminFacilityReport }) {
  const transition = (status: FacilityReportStatus, success: string) => {
    if (["rejected", "resolved"].includes(status) && !adminNote.trim()) {
      Alert.alert(
        "처리 메모 확인",
        status === "rejected"
          ? "학생에게 표시할 반려 사유를 입력해 주세요."
          : "학생에게 표시할 조치 완료 내용을 입력해 주세요.",
      );
      return;
    }
    onConfirm("이 시설 신고의 상태를 변경하시겠습니까?", () =>
      onRunAction(
        () => transitionFacilityReport(report.id, status, adminNote),
        success,
      ),
    );
  };

  return (
    <>
      <DetailHeader
        category={getFacilityCategoryLabel(report.category)}
        identity={formatRequester(report.reporter)}
        status={getFacilityStatusLabel(report.status)}
        title={report.title}
      />
      <DetailSection title="신고 정보">
        <DetailRow label="장소" value={report.location} />
        <DetailRow label="신고일" value={formatDateTime(report.created_at)} />
        <DetailParagraph label="상세 내용" value={report.description} />
      </DetailSection>
      <WorkflowCard
        adminNote={adminNote}
        isProcessing={isProcessing}
        notePlaceholder={
          report.status === "in_progress"
            ? "완료한 조치 내용을 입력해 주세요"
            : "반려 사유를 입력해 주세요"
        }
        onAdminNoteChange={onAdminNoteChange}
        showNote={
          report.status === "submitted" || report.status === "in_progress"
        }
      >
        {report.status === "submitted" ? (
          <>
            <DangerButton
              disabled={isProcessing}
              label="반려"
              onPress={() =>
                transition("rejected", "시설 신고를 반려했습니다.")
              }
            />
            <PrimaryButton
              disabled={isProcessing}
              label="접수하기"
              onPress={() =>
                transition("received", "시설 신고를 접수했습니다.")
              }
            />
          </>
        ) : null}
        {report.status === "received" ? (
          <PrimaryButton
            disabled={isProcessing}
            label="조치 시작"
            onPress={() =>
              transition("in_progress", "시설 신고를 조치 중으로 변경했습니다.")
            }
          />
        ) : null}
        {report.status === "in_progress" ? (
          <PrimaryButton
            disabled={isProcessing}
            label="조치 완료"
            onPress={() =>
              transition("resolved", "시설 신고 조치를 완료했습니다.")
            }
          />
        ) : null}
      </WorkflowCard>
      {report.admin_note ? (
        <DetailParagraph label="처리 메모" value={report.admin_note} />
      ) : null}
      <DeleteSection
        disabled={isProcessing}
        label="시설 신고 삭제"
        onPress={() =>
          onConfirm(
            "이 시설 신고를 삭제하시겠습니까? 삭제하면 복구할 수 없습니다.",
            () =>
              onRunAction(
                () => adminDeleteFacilityReport(report.id),
                "시설 신고를 삭제했습니다.",
              ),
          )
        }
      />
    </>
  );
}

function NoticeDetail({
  isProcessing,
  notice,
  onConfirm,
  onRunAction,
}: {
  isProcessing: boolean;
  notice: Notice;
  onConfirm: (message: string, action: () => Promise<void>) => void;
  onRunAction: (action: () => Promise<void>, success: string) => Promise<void>;
}) {
  return (
    <>
      <DetailHeader
        category={notice.is_urgent ? "긴급 공지" : "학부 공지"}
        identity={notice.is_published ? "학생에게 게시 중" : "임시 저장"}
        status={notice.is_published ? "게시 중" : "임시 저장"}
        title={formatNoticeTitle(notice.title, notice.is_urgent)}
      />
      <DetailSection title="공지 내용">
        <DetailRow
          label="최근 수정"
          value={formatDateTime(notice.updated_at)}
        />
        <DetailParagraph label="본문" value={notice.content} />
      </DetailSection>
      <View style={styles.workflowCard}>
        <Text style={styles.workflowTitle}>공지 관리</Text>
        <View style={styles.workflowButtons}>
          <DangerButton
            disabled={isProcessing}
            label="삭제"
            onPress={() =>
              onConfirm("이 공지를 삭제하시겠습니까?", () =>
                onRunAction(
                  () => deleteNotice(notice.id),
                  "공지를 삭제했습니다.",
                ),
              )
            }
          />
          <PrimaryButton
            disabled={false}
            label="수정하기"
            onPress={() =>
              router.push({
                pathname: "/admin-notice-editor",
                params: { id: notice.id },
              })
            }
          />
        </View>
      </View>
    </>
  );
}

function StudentDetail({
  isProcessing,
  onConfirm,
  onRunAction,
  student,
}: {
  isProcessing: boolean;
  onConfirm: (message: string, action: () => Promise<void>) => void;
  onRunAction: (action: () => Promise<void>, success: string) => Promise<void>;
  student: AdminStudentProfile;
}) {
  const review = (decision: "approved" | "rejected") =>
    onConfirm(
      `${student.student_number} · ${student.name} 학생의 가입을 ${decision === "approved" ? "승인" : "거절"}하시겠습니까?`,
      () =>
        onRunAction(
          () => reviewStudentAccount(student.id, decision),
          decision === "approved"
            ? "학생 가입을 승인했습니다."
            : "학생 가입을 거절했습니다.",
        ),
    );

  return (
    <>
      <DetailHeader
        category="신규 가입 신청"
        identity={`${student.student_number} · ${student.name}`}
        status="승인 대기"
        title={`${student.name} 학생의 가입 정보`}
      />
      <DetailSection title="학생 정보">
        <DetailRow label="학번" value={student.student_number} />
        <DetailRow label="학년" value={`${student.grade}학년`} />
        <DetailRow label="전공" value={student.major} />
        <DetailRow label="재학 상태" value={student.enrollment_status} />
        <DetailRow label="휴대전화" value={student.phone_number || "미입력"} />
        <DetailRow label="신청일" value={formatDateTime(student.created_at)} />
      </DetailSection>
      <View style={styles.workflowCard}>
        <Text style={styles.workflowTitle}>가입 처리</Text>
        <Text style={styles.workflowDescription}>
          학번과 학생 정보를 확인한 뒤 승인 또는 거절해 주세요.
        </Text>
        <View style={styles.workflowButtons}>
          <DangerButton
            disabled={isProcessing}
            label="가입 거절"
            onPress={() => review("rejected")}
          />
          <PrimaryButton
            disabled={isProcessing}
            label="가입 승인"
            onPress={() => review("approved")}
          />
        </View>
      </View>
    </>
  );
}

function GraduationDetail({
  isProcessing,
  onConfirm,
  onRunAction,
  slot,
}: {
  isProcessing: boolean;
  onConfirm: (message: string, action: () => Promise<void>) => void;
  onRunAction: (action: () => Promise<void>, success: string) => Promise<void>;
  slot: PreGraduationSlot;
}) {
  return (
    <>
      <DetailHeader
        category="4학년 예비졸업사정"
        identity={`${slot.student_number ?? "학번 미확인"} · ${slot.student_name ?? "학생"}`}
        status="예약 완료"
        title={`${getPreGraduationWeekdayLabel(slot.weekday, true)} ${slot.slot_start} 예약`}
      />
      <DetailSection title="예약 정보">
        <DetailRow
          label="요일"
          value={getPreGraduationWeekdayLabel(slot.weekday, true)}
        />
        <DetailRow
          label="상담 시간"
          value={`${slot.slot_start} ~ ${slot.slot_end}`}
        />
        <DetailRow label="학생 이름" value={slot.student_name ?? "미확인"} />
        <DetailRow label="학번" value={slot.student_number ?? "미확인"} />
      </DetailSection>
      <DeleteSection
        disabled={isProcessing}
        label="예약 삭제"
        onPress={() => {
          if (!slot.reservation_id) return;
          onConfirm("이 예비졸업사정 예약을 삭제하시겠습니까?", () =>
            onRunAction(
              () => cancelPreGraduationReservation(slot.reservation_id!),
              "예비졸업사정 예약을 삭제했습니다.",
            ),
          );
        }}
      />
    </>
  );
}

function DetailHeader({
  category,
  identity,
  status,
  title,
}: {
  category: string;
  identity: string;
  status: string;
  title: string;
}) {
  return (
    <View style={styles.detailHeaderCard}>
      <View style={styles.detailHeaderTop}>
        <Text style={styles.detailCategory}>{category}</Text>
        <View style={styles.detailStatusBadge}>
          <Text style={styles.detailStatusText}>{status}</Text>
        </View>
      </View>
      <Text style={styles.detailTitle}>{title}</Text>
      <Text style={styles.detailIdentity}>{identity}</Text>
    </View>
  );
}

function DetailSection({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <View style={styles.detailSection}>
      <Text style={styles.detailSectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function DetailParagraph({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailParagraph}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailParagraphText}>{value}</Text>
    </View>
  );
}

function WorkflowCard({
  adminNote,
  children,
  isProcessing,
  notePlaceholder,
  onAdminNoteChange,
  showNote,
}: {
  adminNote: string;
  children: ReactNode;
  isProcessing: boolean;
  notePlaceholder: string;
  onAdminNoteChange: (value: string) => void;
  showNote: boolean;
}) {
  const hasActions = Array.isArray(children)
    ? children.some(Boolean)
    : Boolean(children);
  if (!hasActions) return null;

  return (
    <View style={styles.workflowCard}>
      <Text style={styles.workflowTitle}>상태 처리</Text>
      <Text style={styles.workflowDescription}>
        처리 결과는 학생 앱에 즉시 반영됩니다.
      </Text>
      {showNote ? (
        <TextInput
          editable={!isProcessing}
          maxLength={2000}
          multiline
          onChangeText={onAdminNoteChange}
          placeholder={notePlaceholder}
          placeholderTextColor={COLORS.placeholder}
          style={styles.noteInput}
          textAlignVertical="top"
          value={adminNote}
        />
      ) : null}
      <View style={styles.workflowButtons}>{children}</View>
    </View>
  );
}

function PrimaryButton({
  disabled,
  label,
  onPress,
}: {
  disabled: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryButton,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      {disabled ? (
        <ActivityIndicator color={COLORS.white} size="small" />
      ) : (
        <Text style={styles.primaryButtonText}>{label}</Text>
      )}
    </Pressable>
  );
}

function DangerButton({
  disabled,
  label,
  onPress,
}: {
  disabled: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.dangerButton,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={styles.dangerButtonText}>{label}</Text>
    </Pressable>
  );
}

function DeleteSection({
  disabled,
  label,
  onPress,
}: {
  disabled: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.deleteSection}>
      <View>
        <Text style={styles.deleteSectionTitle}>데이터 삭제</Text>
        <Text style={styles.deleteSectionDescription}>
          삭제 후에는 복구할 수 없습니다.
        </Text>
      </View>
      <DangerButton disabled={disabled} label={label} onPress={onPress} />
    </View>
  );
}

function GraduationSettingsCard({
  accessEnabled,
  enabledWeekdays,
  isSaving,
  onAccessChange,
  onSave,
  onToggleWeekday,
}: {
  accessEnabled: boolean;
  enabledWeekdays: PreGraduationWeekday[];
  isSaving: boolean;
  onAccessChange: (value: boolean) => void;
  onSave: () => void;
  onToggleWeekday: (weekday: PreGraduationWeekday) => void;
}) {
  return (
    <View style={styles.graduationSettings}>
      <View style={styles.graduationSettingsHeader}>
        <View>
          <Text style={styles.graduationSettingsTitle}>학생 접근 허용</Text>
          <Text style={styles.graduationSettingsDescription}>
            4학년 학생만 예약할 수 있습니다.
          </Text>
        </View>
        <Switch
          onValueChange={onAccessChange}
          thumbColor={COLORS.white}
          trackColor={{ false: COLORS.disabled, true: COLORS.navy }}
          value={accessEnabled}
        />
      </View>
      <Text style={styles.weekdayLabel}>신청받을 요일</Text>
      <View style={styles.weekdayRow}>
        {PRE_GRADUATION_WEEKDAYS.map((weekday) => {
          const selected = enabledWeekdays.includes(weekday.value);
          return (
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selected }}
              key={weekday.value}
              onPress={() => onToggleWeekday(weekday.value)}
              style={[
                styles.weekdayButton,
                selected && styles.weekdayButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.weekdayText,
                  selected && styles.weekdayTextActive,
                ]}
              >
                {weekday.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable
        accessibilityRole="button"
        disabled={isSaving}
        onPress={onSave}
        style={[styles.graduationSaveButton, isSaving && styles.disabled]}
      >
        <Text style={styles.graduationSaveText}>설정 저장</Text>
      </Pressable>
    </View>
  );
}

function SettingsList() {
  const links: Array<{
    title: string;
    description: string;
    route:
      | "/admin-home-popups"
      | "/admin-operating-hours"
      | "/admin-password-reset-requests"
      | "/notifications"
      | "/profile";
  }> = [
    {
      title: "첫 화면 팝업",
      description: "학생 홈에 표시할 팝업 이미지와 기간을 관리합니다.",
      route: "/admin-home-popups",
    },
    {
      title: "운영시간",
      description: "방학·학기 중 운영시간과 휴무 안내를 수정합니다.",
      route: "/admin-operating-hours",
    },
    {
      title: "비밀번호 재설정 요청",
      description: "학생의 비밀번호 재설정 요청을 확인합니다.",
      route: "/admin-password-reset-requests",
    },
    {
      title: "알림함",
      description: "관리자 계정으로 수신된 알림을 확인합니다.",
      route: "/notifications",
    },
    {
      title: "관리자 프로필",
      description: "내 정보와 비밀번호를 변경합니다.",
      route: "/profile",
    },
  ];

  return (
    <ScrollView contentContainerStyle={styles.settingsList}>
      {links.map((item) => (
        <Pressable
          accessibilityRole="button"
          key={item.route}
          onPress={() => router.push(item.route)}
          style={({ pressed }) => [
            styles.settingsItem,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.settingsItemIcon}>
            <AppIcon color={COLORS.navy} name="settings" size={21} />
          </View>
          <View style={styles.settingsItemText}>
            <Text style={styles.settingsItemTitle}>{item.title}</Text>
            <Text style={styles.settingsItemDescription}>
              {item.description}
            </Text>
          </View>
          <Text style={styles.settingsChevron}>›</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function SettingsWelcome() {
  return (
    <EmptyDetail
      description="왼쪽에서 관리할 설정을 선택하면 해당 화면으로 이동합니다. 모바일 앱과 같은 설정값을 사용합니다."
      icon="settings"
      title="MEDIA ON 운영 설정"
    />
  );
}

function EmptyDetail({
  description,
  icon,
  title,
}: {
  description: string;
  icon: AppIconName;
  title: string;
}) {
  return (
    <View style={styles.emptyDetail}>
      <View style={styles.emptyDetailIcon}>
        <AppIcon color={COLORS.navy} monochrome name={icon} size={36} />
      </View>
      <Text style={styles.emptyDetailTitle}>{title}</Text>
      <Text style={styles.emptyDetailText}>{description}</Text>
    </View>
  );
}

function getRecordSummary(record: WorkspaceRecord) {
  if (record.kind === "inquiry") {
    return {
      icon: "assistant" as const,
      identity: formatRequester(record.data.requester),
      title: record.data.title,
      meta: getAssistantCategoryLabel(record.data.category),
      date: formatShortDate(record.data.created_at),
    };
  }
  if (record.kind === "equipment") {
    return {
      icon: "equipment" as const,
      identity: formatRequester(record.data.requester),
      title: `${record.data.equipment?.name ?? "기자재"} ${record.data.quantity}개`,
      meta: record.data.pickup_date,
      date: formatShortDate(record.data.created_at),
    };
  }
  if (record.kind === "room") {
    return {
      icon: "room" as const,
      identity: formatRequester(record.data.requester),
      title: record.data.room?.name ?? "실습실 대여 신청",
      meta: record.data.reservation_date,
      date: formatShortDate(record.data.created_at),
    };
  }
  if (record.kind === "facility") {
    return {
      icon: "report" as const,
      identity: formatRequester(record.data.reporter),
      title: record.data.title,
      meta: record.data.location,
      date: formatShortDate(record.data.created_at),
    };
  }
  if (record.kind === "notice") {
    return {
      icon: "notice" as const,
      identity: record.data.is_published ? "게시 중" : "임시 저장",
      title: formatNoticeTitle(record.data.title, record.data.is_urgent),
      meta: record.data.is_urgent ? "긴급 공지" : "일반 공지",
      date: formatShortDate(record.data.updated_at),
    };
  }
  if (record.kind === "student") {
    return {
      icon: "check" as const,
      identity: `${record.data.student_number} · ${record.data.name}`,
      title: `${record.data.grade}학년 · ${record.data.major}`,
      meta: record.data.enrollment_status,
      date: formatShortDate(record.data.created_at),
    };
  }
  return {
    icon: "graduation" as const,
    identity: `${record.data.student_number ?? "학번 미확인"} · ${record.data.student_name ?? "학생"}`,
    title: `${getPreGraduationWeekdayLabel(record.data.weekday, true)} ${record.data.slot_start}`,
    meta: `${record.data.slot_start} ~ ${record.data.slot_end}`,
    date: getPreGraduationWeekdayLabel(record.data.weekday),
  };
}

function getRecordStatus(record: WorkspaceRecord) {
  if (record.kind === "inquiry") {
    return {
      value: record.data.status,
      label: getAssistantStatusLabel(record.data.status),
      color:
        record.data.status === "answered"
          ? COLORS.success
          : record.data.status === "in_progress"
            ? "#2563EB"
            : COLORS.warning,
    };
  }
  if (record.kind === "equipment") {
    return {
      value: record.data.status,
      label: getEquipmentStatusLabel(record.data.status),
      color: getStatusColor(record.data.status),
    };
  }
  if (record.kind === "room") {
    return {
      value: record.data.status,
      label: getRoomStatusLabel(record.data.status),
      color: getStatusColor(record.data.status),
    };
  }
  if (record.kind === "facility") {
    return {
      value: record.data.status,
      label: getFacilityStatusLabel(record.data.status),
      color: getStatusColor(record.data.status),
    };
  }
  if (record.kind === "notice") {
    return {
      value: record.data.is_published ? "published" : "draft",
      label: record.data.is_published ? "게시 중" : "임시 저장",
      color: record.data.is_published ? COLORS.success : COLORS.placeholder,
    };
  }
  if (record.kind === "student") {
    return { value: "pending", label: "승인 대기", color: COLORS.warning };
  }
  return { value: "reserved", label: "예약 완료", color: COLORS.success };
}

function getRecordSearchText(record: WorkspaceRecord) {
  const summary = getRecordSummary(record);
  if (record.kind === "inquiry")
    return `${summary.identity} ${summary.title} ${record.data.content}`;
  if (record.kind === "equipment")
    return `${summary.identity} ${summary.title} ${record.data.purpose}`;
  if (record.kind === "room")
    return `${summary.identity} ${summary.title} ${record.data.purpose}`;
  if (record.kind === "facility")
    return `${summary.identity} ${summary.title} ${record.data.description} ${record.data.location}`;
  if (record.kind === "notice")
    return `${summary.title} ${record.data.content}`;
  return `${summary.identity} ${summary.title} ${summary.meta}`;
}

function getSectionIcon(section: SectionId): AppIconName {
  if (section === "overview") return "bell";
  if (section === "inquiry") return "assistant";
  if (section === "equipment") return "equipment";
  if (section === "room") return "room";
  if (section === "facility") return "report";
  if (section === "notice") return "notice";
  if (section === "graduation") return "graduation";
  if (section === "students") return "check";
  return "settings";
}

function getStatusColor(status: string) {
  if (["approved", "returned", "resolved"].includes(status))
    return COLORS.success;
  if (["rejected"].includes(status)) return COLORS.error;
  if (
    ["received", "checked_out", "in_progress", "erp_checking"].includes(status)
  )
    return "#2563EB";
  return COLORS.warning;
}

function getRecordKindLabel(kind: WorkspaceRecord["kind"]) {
  if (kind === "inquiry") return "조교 문의";
  if (kind === "equipment") return "기자재";
  if (kind === "room") return "실습실";
  if (kind === "facility") return "시설 신고";
  if (kind === "notice") return "공지";
  if (kind === "student") return "가입 승인";
  return "예졸사";
}

function formatRequester(
  profile: { name: string; student_number: string } | null,
) {
  return profile
    ? `${profile.student_number} · ${profile.name}`
    : "학번 미확인 · 학생";
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    minWidth: 1024,
    height: "100%",
    flexDirection: "row",
    backgroundColor: "#F2F4F8",
  },
  centeredState: {
    flex: 1,
    minHeight: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4F6FA",
  },
  centeredStateText: {
    marginTop: 16,
    color: COLORS.subText,
    fontFamily: "FreesentationRegular",
    fontSize: 15,
  },
  errorIcon: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 28,
    backgroundColor: "#FEE2E2",
  },
  errorIconText: {
    color: COLORS.error,
    fontFamily: "FreesentationExtraBold",
    fontSize: 26,
  },
  errorTitle: {
    marginTop: 18,
    color: COLORS.text,
    fontFamily: "FreesentationExtraBold",
    fontSize: 22,
  },
  errorMessage: {
    maxWidth: 520,
    marginTop: 9,
    color: COLORS.subText,
    fontFamily: "FreesentationRegular",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  primaryStandaloneButton: {
    minWidth: 140,
    height: 46,
    marginTop: 22,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: COLORS.navy,
  },
  primaryStandaloneButtonText: {
    color: COLORS.white,
    fontFamily: "FreesentationSemiBold",
    fontSize: 14,
  },
  sidebar: { width: 252, paddingTop: 28, backgroundColor: COLORS.navy },
  brandArea: {
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  brandMark: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: COLORS.white,
  },
  brandMarkText: {
    color: COLORS.navy,
    fontFamily: "FreesentationExtraBold",
    fontSize: 20,
  },
  brandName: {
    color: COLORS.white,
    fontFamily: "FreesentationExtraBold",
    fontSize: 18,
    letterSpacing: 0.4,
  },
  brandCaption: {
    marginTop: 3,
    color: "#BFC7E9",
    fontFamily: "FreesentationRegular",
    fontSize: 11,
  },
  nav: { paddingHorizontal: 14, paddingTop: 30, paddingBottom: 22 },
  navGroupLabel: {
    marginTop: 18,
    marginBottom: 8,
    marginLeft: 12,
    color: "#8F9ACB",
    fontFamily: "FreesentationSemiBold",
    fontSize: 11,
    letterSpacing: 0.4,
  },
  navItem: {
    height: 46,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
  },
  navItemActive: { backgroundColor: COLORS.white },
  navItemText: {
    flex: 1,
    color: "#D9DDF2",
    fontFamily: "FreesentationSemiBold",
    fontSize: 14,
  },
  navItemTextActive: { color: COLORS.navy },
  navBadge: {
    minWidth: 24,
    height: 22,
    paddingHorizontal: 7,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.13)",
  },
  navBadgeActive: { backgroundColor: COLORS.softNavy },
  navBadgeText: {
    color: COLORS.white,
    fontFamily: "FreesentationSemiBold",
    fontSize: 10,
  },
  navBadgeTextActive: { color: COLORS.navy },
  sidebarFooter: {
    padding: 14,
    gap: 9,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  adminProfile: {
    minHeight: 62,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  adminAvatar: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    backgroundColor: "#43519B",
  },
  adminAvatarText: {
    color: COLORS.white,
    fontFamily: "FreesentationExtraBold",
    fontSize: 15,
  },
  adminIdentity: { flex: 1, marginLeft: 10 },
  adminName: {
    color: COLORS.white,
    fontFamily: "FreesentationSemiBold",
    fontSize: 13,
  },
  adminRole: {
    marginTop: 3,
    color: "#AAB4DC",
    fontFamily: "FreesentationRegular",
    fontSize: 10,
  },
  profileChevron: { color: "#AAB4DC", fontSize: 20 },
  logoutButton: {
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  logoutText: {
    color: "#BFC7E9",
    fontFamily: "FreesentationSemiBold",
    fontSize: 12,
  },
  main: { flex: 1 },
  topbar: {
    height: 90,
    paddingHorizontal: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E5EE",
    backgroundColor: COLORS.white,
  },
  pageTitle: {
    color: COLORS.text,
    fontFamily: "FreesentationExtraBold",
    fontSize: 23,
  },
  pageDescription: {
    marginTop: 5,
    color: COLORS.subText,
    fontFamily: "FreesentationRegular",
    fontSize: 13,
  },
  topbarActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  secondaryTopbarButton: {
    minWidth: 88,
    height: 40,
    paddingHorizontal: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 11,
    backgroundColor: COLORS.white,
  },
  secondaryTopbarButtonText: {
    color: COLORS.navy,
    fontFamily: "FreesentationSemiBold",
    fontSize: 13,
  },
  installButton: {
    height: 40,
    paddingHorizontal: 17,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    backgroundColor: COLORS.navy,
  },
  installButtonText: {
    color: COLORS.white,
    fontFamily: "FreesentationSemiBold",
    fontSize: 13,
  },
  workspace: { flex: 1, flexDirection: "row", minHeight: 0 },
  listPane: {
    width: 400,
    minWidth: 330,
    padding: 20,
    borderRightWidth: 1,
    borderRightColor: "#E2E5EE",
    backgroundColor: "#F7F8FB",
  },
  detailPane: { flex: 1, minWidth: 360, backgroundColor: COLORS.white },
  metricGrid: { marginBottom: 16, flexDirection: "row", gap: 8 },
  metricCard: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 13,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: "#E2E5EE",
    borderRadius: 12,
    backgroundColor: COLORS.white,
  },
  metricValue: {
    color: COLORS.navy,
    fontFamily: "FreesentationExtraBold",
    fontSize: 20,
  },
  metricLabel: {
    marginTop: 3,
    color: COLORS.subText,
    fontFamily: "FreesentationRegular",
    fontSize: 10,
  },
  searchBox: {
    height: 44,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderWidth: 1,
    borderColor: "#DDE1EB",
    borderRadius: 12,
    backgroundColor: COLORS.white,
  },
  searchInput: {
    flex: 1,
    height: 42,
    color: COLORS.text,
    fontFamily: "FreesentationRegular",
    fontSize: 13,
  },
  filterRow: { paddingVertical: 12, gap: 7 },
  filterChip: {
    height: 30,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 15,
    backgroundColor: COLORS.white,
  },
  filterChipActive: { borderColor: COLORS.navy, backgroundColor: COLORS.navy },
  filterChipText: {
    color: COLORS.subText,
    fontFamily: "FreesentationSemiBold",
    fontSize: 11,
  },
  filterChipTextActive: { color: COLORS.white },
  listHeading: {
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  listHeadingText: {
    color: COLORS.text,
    fontFamily: "FreesentationExtraBold",
    fontSize: 14,
  },
  listCount: {
    color: COLORS.subText,
    fontFamily: "FreesentationRegular",
    fontSize: 12,
  },
  recordScroller: { flex: 1, minHeight: 0 },
  recordList: { paddingTop: 8, paddingBottom: 20, gap: 8 },
  recordCard: {
    minHeight: 90,
    padding: 13,
    flexDirection: "row",
    gap: 11,
    borderWidth: 1,
    borderColor: "#E2E5EE",
    borderRadius: 13,
    backgroundColor: COLORS.white,
  },
  recordCardActive: { borderColor: "#8B96CA", backgroundColor: "#F0F2FA" },
  recordIcon: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    backgroundColor: COLORS.softNavy,
  },
  recordIconActive: { backgroundColor: COLORS.navy },
  recordTextArea: { flex: 1, minWidth: 0 },
  recordTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  recordIdentity: {
    flex: 1,
    color: COLORS.text,
    fontFamily: "FreesentationSemiBold",
    fontSize: 13,
  },
  recordDate: {
    color: COLORS.placeholder,
    fontFamily: "FreesentationRegular",
    fontSize: 10,
  },
  recordTitle: {
    marginTop: 6,
    color: COLORS.text,
    fontFamily: "FreesentationExtraBold",
    fontSize: 14,
  },
  recordBottomRow: { marginTop: 7, flexDirection: "row", alignItems: "center" },
  statusDot: { width: 6, height: 6, marginRight: 5, borderRadius: 3 },
  recordStatus: {
    color: COLORS.subText,
    fontFamily: "FreesentationSemiBold",
    fontSize: 10,
  },
  recordMeta: {
    flex: 1,
    color: COLORS.placeholder,
    fontFamily: "FreesentationRegular",
    fontSize: 10,
  },
  emptyList: {
    minHeight: 210,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyListTitle: {
    color: COLORS.text,
    fontFamily: "FreesentationExtraBold",
    fontSize: 15,
  },
  emptyListText: {
    marginTop: 7,
    color: COLORS.subText,
    fontFamily: "FreesentationRegular",
    fontSize: 12,
  },
  detailScroller: { flex: 1 },
  detailContent: { padding: 28, paddingBottom: 44 },
  detailHeaderCard: {
    padding: 22,
    borderRadius: 17,
    backgroundColor: COLORS.navy,
  },
  detailHeaderTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  detailCategory: {
    color: "#C9D0ED",
    fontFamily: "FreesentationSemiBold",
    fontSize: 12,
  },
  detailStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  detailStatusText: {
    color: COLORS.white,
    fontFamily: "FreesentationSemiBold",
    fontSize: 11,
  },
  detailTitle: {
    marginTop: 14,
    color: COLORS.white,
    fontFamily: "FreesentationExtraBold",
    fontSize: 23,
    lineHeight: 31,
  },
  detailIdentity: {
    marginTop: 8,
    color: "#D4D9EF",
    fontFamily: "FreesentationRegular",
    fontSize: 13,
  },
  detailSection: {
    marginTop: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E2E5EE",
    borderRadius: 15,
    backgroundColor: COLORS.white,
  },
  detailSectionTitle: {
    marginBottom: 12,
    color: COLORS.text,
    fontFamily: "FreesentationExtraBold",
    fontSize: 15,
  },
  detailSectionLabel: {
    color: COLORS.subText,
    fontFamily: "FreesentationSemiBold",
    fontSize: 12,
  },
  detailBody: {
    marginTop: 9,
    color: COLORS.text,
    fontFamily: "FreesentationRegular",
    fontSize: 14,
    lineHeight: 22,
  },
  detailRow: {
    minHeight: 38,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: "#EEF0F4",
  },
  detailLabel: {
    width: 110,
    color: COLORS.subText,
    fontFamily: "FreesentationSemiBold",
    fontSize: 12,
  },
  detailValue: {
    flex: 1,
    color: COLORS.text,
    fontFamily: "FreesentationRegular",
    fontSize: 13,
    lineHeight: 19,
  },
  detailParagraph: {
    marginTop: 15,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E2E5EE",
    borderRadius: 14,
    backgroundColor: "#F8F9FC",
  },
  detailParagraphText: {
    marginTop: 9,
    color: COLORS.text,
    fontFamily: "FreesentationRegular",
    fontSize: 14,
    lineHeight: 22,
  },
  workflowCard: {
    marginTop: 18,
    padding: 20,
    borderRadius: 15,
    backgroundColor: "#F0F2FA",
  },
  workflowTitle: {
    color: COLORS.text,
    fontFamily: "FreesentationExtraBold",
    fontSize: 15,
  },
  workflowDescription: {
    marginTop: 6,
    color: COLORS.subText,
    fontFamily: "FreesentationRegular",
    fontSize: 12,
    lineHeight: 18,
  },
  noteInput: {
    minHeight: 96,
    marginTop: 15,
    padding: 13,
    borderWidth: 1,
    borderColor: "#CFD5E5",
    borderRadius: 11,
    backgroundColor: COLORS.white,
    color: COLORS.text,
    fontFamily: "FreesentationRegular",
    fontSize: 13,
    lineHeight: 20,
  },
  workflowButtons: {
    marginTop: 15,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 9,
  },
  primaryButton: {
    minWidth: 122,
    height: 43,
    paddingHorizontal: 17,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    backgroundColor: COLORS.navy,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontFamily: "FreesentationSemiBold",
    fontSize: 13,
  },
  dangerButton: {
    minWidth: 102,
    height: 43,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F3B7B7",
    borderRadius: 11,
    backgroundColor: "#FFF7F7",
  },
  dangerButtonText: {
    color: COLORS.error,
    fontFamily: "FreesentationSemiBold",
    fontSize: 13,
  },
  deleteSection: {
    marginTop: 24,
    paddingTop: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#E2E5EE",
  },
  deleteSectionTitle: {
    color: COLORS.text,
    fontFamily: "FreesentationSemiBold",
    fontSize: 13,
  },
  deleteSectionDescription: {
    marginTop: 4,
    color: COLORS.placeholder,
    fontFamily: "FreesentationRegular",
    fontSize: 11,
  },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.72 },
  chatDetail: { flex: 1 },
  inlineActions: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  chatDivider: { height: 1, marginTop: 20, backgroundColor: "#E2E5EE" },
  chatSectionTitle: {
    marginTop: 18,
    color: COLORS.text,
    fontFamily: "FreesentationExtraBold",
    fontSize: 16,
  },
  emptyDetail: {
    flex: 1,
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyDetailIcon: {
    width: 76,
    height: 76,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: COLORS.softNavy,
  },
  emptyDetailTitle: {
    marginTop: 22,
    color: COLORS.text,
    fontFamily: "FreesentationExtraBold",
    fontSize: 20,
  },
  emptyDetailText: {
    maxWidth: 440,
    marginTop: 9,
    color: COLORS.subText,
    fontFamily: "FreesentationRegular",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
  graduationSettings: {
    marginBottom: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: "#E2E5EE",
    borderRadius: 14,
    backgroundColor: COLORS.white,
  },
  graduationSettingsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  graduationSettingsTitle: {
    color: COLORS.text,
    fontFamily: "FreesentationExtraBold",
    fontSize: 14,
  },
  graduationSettingsDescription: {
    marginTop: 4,
    color: COLORS.subText,
    fontFamily: "FreesentationRegular",
    fontSize: 10,
  },
  weekdayLabel: {
    marginTop: 16,
    color: COLORS.text,
    fontFamily: "FreesentationSemiBold",
    fontSize: 12,
  },
  weekdayRow: { marginTop: 8, flexDirection: "row", gap: 7 },
  weekdayButton: {
    flex: 1,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 9,
    backgroundColor: COLORS.white,
  },
  weekdayButtonActive: {
    borderColor: COLORS.navy,
    backgroundColor: COLORS.navy,
  },
  weekdayText: {
    color: COLORS.subText,
    fontFamily: "FreesentationSemiBold",
    fontSize: 12,
  },
  weekdayTextActive: { color: COLORS.white },
  graduationSaveButton: {
    height: 40,
    marginTop: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: COLORS.navy,
  },
  graduationSaveText: {
    color: COLORS.white,
    fontFamily: "FreesentationSemiBold",
    fontSize: 12,
  },
  settingsList: { gap: 9 },
  settingsItem: {
    minHeight: 82,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#E2E5EE",
    borderRadius: 13,
    backgroundColor: COLORS.white,
  },
  settingsItemIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    backgroundColor: COLORS.softNavy,
  },
  settingsItemText: { flex: 1 },
  settingsItemTitle: {
    color: COLORS.text,
    fontFamily: "FreesentationExtraBold",
    fontSize: 14,
  },
  settingsItemDescription: {
    marginTop: 5,
    color: COLORS.subText,
    fontFamily: "FreesentationRegular",
    fontSize: 11,
    lineHeight: 16,
  },
  settingsChevron: { color: COLORS.placeholder, fontSize: 24 },
});
