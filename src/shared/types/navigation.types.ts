export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  ScanTab: undefined;
  MapTab: undefined;
  HistoryTab: undefined;
  EducationTab: undefined;
  ProfileTab: undefined;
};

export type ScanStackParamList = {
  ScanScreen: undefined;
  CameraPreviewScreen: undefined;
  ClassificationResultScreen: { classificationId: string };
};

export type MapStackParamList = {
  MapScreen: undefined;
  ContainerDetailScreen: { containerId: string };
};

export type HistoryStackParamList = {
  HistoryScreen: undefined;
  DepositDetailScreen: { depositId: string };
};

export type EducationStackParamList = {
  LessonListScreen: undefined;
  LessonDetailScreen: { lessonId: string };
  FeedbackScreen: undefined;
};

export type ProfileStackParamList = {
  ProfileScreen: undefined;
  GamificationScreen: undefined;
  LeaderboardScreen: undefined;
  ChatScreen: undefined;
  EditProfileScreen: undefined;
  SettingsScreen: undefined;
};
