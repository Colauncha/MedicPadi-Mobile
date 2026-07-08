export type AuthStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  UserType: undefined;
  SignUp: { userType?: string };
  Login: undefined;
};

export type PatientTabParamList = {
  Home: undefined;
  Appointment: undefined;
  Pharmacy: undefined;
  Settings: undefined;
};

export type PatientStackParamList = {
  PatientTabs: undefined;
  BookAppointment: { doctorName?: string; providerId?: string };
  MedicalHistory: undefined;
  Profile: undefined;
  PatientProfile: undefined;
  DrugDetails: { drugName?: string; drugId?: string };
  LabTest: undefined;
  Notifications: undefined;
  DoctorDetails: { doctorId?: string };
  EditProfile: undefined;
  VerifyEmail: undefined;
  Speciality: undefined;
  DoctorsBySpeciality: { speciality: string; label: string };
};

export type RootStackParamList = {
  Auth: undefined;
  Patient: undefined;
};
