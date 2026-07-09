import { AppointmentData, ProfileFields } from "../services/api";

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
  BookingDetails: { bookingId: string, doctorId: string, apptData?: AppointmentData, doctorData?: ProfileFields };
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
  PaymentWebView: { url: string; reference?: string };
};

export type RootStackParamList = {
  Auth: undefined;
  Patient: undefined;
};
