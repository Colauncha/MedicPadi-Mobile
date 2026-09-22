import { storage } from '@/utils/storage';
import { File } from 'expo-file-system';
// import { truncate } from '@/utils';

const BASE_URL = 'https://api.medicpadi.com/api';
// const BASE_URL = 'http://localhost:3000/api';
const TOKEN_KEY = 'mp_token';
const USER_KEY = 'mp_user';

// ── Token / user storage ──────────────────────────────────────────────────────

export const storeToken = (token: string) => storage.setItem(TOKEN_KEY, token);
export const getStoredToken = () => storage.getItem(TOKEN_KEY);
export const clearStoredToken = () => storage.deleteItem(TOKEN_KEY);

export const storeUser = (user: AuthUser | null) => {
  if (!user) return storage.deleteItem(USER_KEY);
  return storage.setItem(USER_KEY, JSON.stringify(user));
};
export const getStoredUser = async (): Promise<AuthUser | null> => {
  const val = await storage.getItem(USER_KEY);
  return val ? JSON.parse(val) : null;
};

export const clearStoredUser = () => storage.deleteItem(USER_KEY);

// ── Unauthorized callback (registered by AuthContext) ─────────────────────────

let _onUnauthorized: (() => void) | null = null;
export const setUnauthorizedHandler = (cb: () => void) => {
  _onUnauthorized = cb;
};

// ── HTTP helper ───────────────────────────────────────────────────────────────

function toQS(params: Record<string, any>): string {
  const pairs: string[] = [];

  for (const [key, value] of Object.entries(params)) {
    // Skip null, undefined, and empty strings
    if (value == null || value === '') continue;

    if (Array.isArray(value)) {
      // Loop through array and repeat the key
      value.forEach((item) => {
        if (item != null && item !== '') {
          pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(item)}`);
        }
      });
    } else {
      // Handle primitive values
      pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    }
  }

  return pairs.length ? `?${pairs.join('&')}` : '';
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  token?: string | null,
  multipart?: boolean
): Promise<T> {
  let headers: Record<string, string> = {};

  if (!multipart) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) headers['Authorization'] = `Bearer ${token}`;

  let finalBody: BodyInit | undefined;
  if (body !== undefined) {
    finalBody = multipart ? (body as BodyInit) : JSON.stringify(body);
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: finalBody,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    if (res.status === 401) _onUnauthorized?.();
    const msg = data?.message ?? `HTTP ${res.status}`;
    throw new Error(Array.isArray(msg) ? msg.join(', ') : String(msg));
  }

  return data as T;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  fullName?: string;
  isEmailVerified?: boolean;
  isVerified?: boolean;
}

export interface LoginResponse {
  token: { access_token: string };
  message: string;
  user?: AuthUser;
}

export interface RegisterData {
  email: string;
  password: string;
  role: string;
  phoneNumber: string;
  fullName: string;
}

export interface NextOfKin {
  name?: string;
  phone?: string;
  email?: string;
  relationship?: string;
}

export interface DoctorEducation {
  institution?: string;
  degree?: string;
  year?: string | number;
}

type BusinessHoursDay = { start: number | 'closed'; end: number | 'closed' };

export interface BusinessHours {
  id?: string;
  monday?: BusinessHoursDay;
  tuesday?: BusinessHoursDay;
  wednesday?: BusinessHoursDay;
  thursday?: BusinessHoursDay;
  friday?: BusinessHoursDay;
  saturday?: BusinessHoursDay;
  sunday?: BusinessHoursDay;
}

// Flat profile fields — used when profiles are embedded in lists / appointments
export interface ProfileFields {
  id?: string;
  user_id?: string;
  // Patient fields
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  gender?: string;
  dateOfBirth?: string;
  height?: string;
  weight?: string;
  bloodGroup?: string;
  genotype?: string;
  allergies?: string[];
  emergencyContact?: string;
  nextOfKin?: NextOfKin;
  profilePicture?: { public_id: string; url: string };
  // Doctor-specific
  speciality?: string;
  licenceNumber?: string;
  bio?: string;
  costPerSession?: string;
  sessionLength?: number;
  placeOfWork?: string;
  yearsOfService?: number;
  awards?: string | null;
  education?: DoctorEducation[];
  businessHours?: BusinessHours;
  // Pharmacy / Lab
  name?: string;
  registrationNumber?: string;
  address?: string;
  isProfileComplete?: boolean;

  // rating
  rating?: number;
  totalReviews?: number;
}

// Shape returned by GET /profile/retrieve
export interface ProfileData {
  profile: ProfileFields;
  rest?: AuthUser;
}

// Payload accepted by PATCH /profile
export type ProfileUpdateData = Partial<ProfileFields>;

export interface AppointmentData {
  id: string;
  provider_id: string;
  patient_id: string;
  appointment_time: string;
  description?: string;
  meeting_link?: string;
  join_link?: string;
  meeting_id?: number;
  meeting_password?: string;
  sessionCost?: number;
  sessions?: number;
  status: string;
  paymentStatus?: string;
  provider?: ProfileFields;
  patient?: ProfileFields;
  createdAt?: string;
}

export interface CompleteAppointmentResponse {
  message: string;
  success: boolean;
}

export interface PaymentLinkAppointmentData extends AppointmentData {
  sessions: number;
  authorization_url: string;
  reference: string;
  access_code: string;
  total_amount: number;
  currency: string;
}

// Payment verify responses
export interface TransactionVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    domain: string;
    status: string;
    reference: string;
    gateway_response: string;
    channel: string;
    currency: string;
    ip_address: string;
    meta: {
      user_id: string;
      source_type: string;
      source_id: string;
      provider_id: string;
    };
  };
}

export interface DrugData {
  id: string;
  name: string;
  description?: string;
  price: number;
  available?: boolean;
  requiresPrescription?: boolean;
  dosage?: string;
  composition?: string;
  imageUrl?: string;
  category?: { id: string; name: string };
}

export interface LabTestData {
  id: string;
  name: string;
  shortName?: string;
  description?: string;
  price: number;
  available?: boolean;
  TAT?: string;
  department?: { id: string; name: string };
  lab?: ProfileFields;
  lab_id?: string;
}

export interface EHRRecord {
  id: string;
  patient_id: string;
  provider_id: string;
  diagnosis?: string;
  prescription?: string;
  notes?: string;
  createdAt: string;
  provider?: ProfileFields;
}

export interface Paginated<T> {
  data: T[];
  links: { first: string; last: string; next: string; previous: string };
  meta: {
    count: number;
    limit: number;
    page: number;
    total: number;
    total_pages: number;
  };
}

export enum ReviewProfileType {
  Doctor = 'doctor',
  Pharmacy = 'pharmacy',
  Laboratory = 'laboratory',
}

export interface ReviewResponseData {
  message: string;
  rating: number;
  profile_type: ReviewProfileType;
  doctor_id?: string | null;
  pharmacy_id?: string | null;
  laboratory_id?: string | null;
}

export interface DoctorsSpecialityResponse {
  general: string;
  oncology: string;
  cardiologists: string;
  dermatologists: string;
  endocrinologists: string;
  neurologists: string;
  psychiatrists: string;
  radiologists: string;
  pathologists: string;
  others: string;
}

export interface DoctorStatsResponse {
  totalPatients: number;
  totalAppointments: number;
  scheduledAppointments: number;
  returningPatientPercent: number;
  newPatientsThisWeek: number;
  totalPatientsThisWeek: number;
  weeklyChanges: {
    totalPatients: {
      currentWeek: number;
      previousWeek: number;
      percentChange: number | null;
    };
    totalAppointments: {
      currentWeek: number;
      previousWeek: number;
      percentChange: number | null;
    };
    scheduledAppointments: {
      currentWeek: number;
      previousWeek: number;
      percentChange: number | null;
    };
  };
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export const apiRegister = (data: RegisterData) =>
  request<AuthUser>('POST', '/auth', data);

export const apiLogin = (email: string, password: string) =>
  request<LoginResponse>('POST', '/auth/login', { email, password });

export const apiLogout = (token: string) =>
  request<void>('GET', '/auth/logout', undefined, token);

export const apiRequestPasswordReset = (email: string) =>
  request<{ message: string }>(
    'POST',
    `/auth/request-password-reset?email=${encodeURIComponent(email)}`,
    { email }
  );

export const apiResetPassword = (
  email: string,
  otp: number,
  newPassword: string
) =>
  request<{ message: string }>('POST', `/auth/reset-password`, {
    email,
    otp,
    newPassword,
  });

export const apiSendVerificationEmail = (token: string) =>
  request<void>('POST', '/auth/send-verification-mail', undefined, token);

export const apiVerifyEmail = (id: string, otp: string, token: string) =>
  request<void>(
    'GET',
    `/auth/verify-email?id=${encodeURIComponent(id)}&token=${encodeURIComponent(otp)}`,
    undefined,
    token
  );

// ── Profile ───────────────────────────────────────────────────────────────────

export const apiGetProfile = (token: string) =>
  request<ProfileData>('GET', '/profile/retrieve', undefined, token);

export const apiCreateProfile = (
  data: Record<string, unknown>,
  token: string
) => request<ProfileData>('POST', '/profile', data, token);

export const apiUpdateProfile = (data: ProfileUpdateData, token: string) =>
  request<ProfileData>('PATCH', '/profile', data, token);

// export const apiUploadProfilePicture = async (
//   imageUri: string,
//   token: string
// ): Promise<ProfileData> => {
//   const filename = imageUri.split('/').pop() ?? 'photo.jpg';
//   const match = /\.(\w+)$/.exec(filename);
//   const type = match ? `image/${match[1]}` : 'image/jpeg';

//   console.log('Image uri: ', imageUri);
//   const formData = new FormData();
//   formData.append('image', {
//     uri: imageUri,
//     name: filename,
//     type,
//   } as any);

//   console.log('formData: ', formData);

//   return request<ProfileData>(
//     'POST',
//     '/profile/profile-picture',
//     formData,
//     token,
//     true
//   );
// };

export const apiUploadProfilePicture = async (
  imageUri: string,
  token: string
): Promise<ProfileData> => {
  const file = new File(imageUri);
  const formData = new FormData();

  formData.append('image', file);

  console.log('formData: ', formData);

  return request<ProfileData>(
    'POST',
    '/profile/profile-picture',
    formData,
    token,
    true
  );
};

export const apiGetProfileById = (
  id: string,
  role: 'consultant' | 'lab' | 'pharmacy' | 'patient',
  token: string
) =>
  request<ProfileData>('GET', `/profile/${id}?role=${role}`, undefined, token);

export const apiListProfiles = (
  params: Record<
    string,
    string | number | string[] | number[] | undefined
  > = {},
  token: string
) =>
  request<Paginated<ProfileFields>>(
    'GET',
    `/profile${toQS(params)}`,
    undefined,
    token
  );

export const fetchDoctorsSpeciality = (token: string) =>
  request<DoctorsSpecialityResponse>(
    'GET',
    '/profile/doctors/speciality',
    undefined,
    token
  );

export const getDoctorsPatients = (
  params: Record<
    string,
    string | number | string[] | number[] | undefined
  > = {},
  token: string
) =>
  request<Paginated<ProfileFields>>(
    'GET',
    `/orders/appointments/list/patients${toQS(params)}`,
    undefined,
    token
  );

// ── Appointments ──────────────────────────────────────────────────────────────

export const apiGetAppointments = (
  params: Record<
    string,
    string | number | string[] | number[] | undefined
  > = {},
  token: string
) =>
  request<Paginated<AppointmentData>>(
    'GET',
    `/orders/appointments${toQS(params)}`,
    undefined,
    token
  );

export const apiGetOneAppointment = (id: string, token: string) =>
  request<AppointmentData | PaymentLinkAppointmentData>(
    'GET',
    `/orders/appointments/${id}`,
    undefined,
    token
  );

export interface ZoomSignatureResponse {
  signature: string;
}

export const apiGetZoomSignature = (id: string, token: string) =>
  request<ZoomSignatureResponse>(
    'GET',
    `/orders/appointments/${id}/signature`,
    undefined,
    token
  );

export const apiCompleteAppointment = (id: string, token: string) =>
  request<CompleteAppointmentResponse>(
    'GET',
    `/orders/appointments/${id}/complete`,
    undefined,
    token
  );

export const apiBookAppointment = (
  data: {
    provider_id: string;
    appointment_time: string;
    description?: string;
    meeting_link?: string;
    sessionCost?: number;
    sessions?: number;
  },
  token: string
) => request<AppointmentData>('POST', '/orders/appointments', data, token);

export const apiUpdateAppointment = (
  id: string,
  data: Partial<AppointmentData>,
  token: string
) =>
  request<AppointmentData>('PATCH', `/orders/appointments/${id}`, data, token);

export const apiCancelAppointment = (id: string, token: string) =>
  request<void>('DELETE', `/orders/appointments/${id}`, undefined, token);

export const apiGetDoctorAppointments = (doctorId: string, token: string) =>
  request<{ data: AppointmentData[] }>(
    'GET',
    `/orders/appointment?id=${doctorId}`,
    undefined,
    token
  );

// ── Pharmacy Drugs ────────────────────────────────────────────────────────────

export const apiGetDrugs = (
  params: Record<string, string | number> = {},
  token: string
) =>
  request<Paginated<DrugData>>(
    'GET',
    `/services/pharmacy/drugs${toQS(params)}`,
    undefined,
    token
  );

export const apiGetDrugById = (id: string, token: string) =>
  request<DrugData>('GET', `/services/pharmacy/drugs/${id}`, undefined, token);

// ── Lab Tests ─────────────────────────────────────────────────────────────────

export const apiGetLabTests = (
  params: Record<string, string | number> = {},
  token: string
) =>
  request<Paginated<LabTestData>>(
    'GET',
    `/services/lab/tests${toQS(params)}`,
    undefined,
    token
  );

// ── EHR Records ───────────────────────────────────────────────────────────────

export const apiGetEHRRecords = (
  params: Record<string, string | number> = {},
  token: string
) =>
  request<Paginated<EHRRecord>>(
    'GET',
    `/ehr/records${toQS(params)}`,
    undefined,
    token
  );

// ── Test Requisitions ─────────────────────────────────────────────────────────

export const apiGetTestRequisitions = (
  params: Record<string, string | number> = {},
  token: string
) =>
  request<Paginated<Record<string, unknown>>>(
    'GET',
    `/orders/test-requisitions${toQS(params)}`,
    undefined,
    token
  );

// ── Drug Requisitions ─────────────────────────────────────────────────────────

export const apiCreateDrugRequisition = (
  data: {
    pharmacy_id: string;
    items: { drug_id: string; quantity: number }[];
    delivery_address?: string;
    notes?: string;
  },
  token: string
) => request<unknown>('POST', '/orders/drug-requisitions', data, token);

// ── Transactions ─────────────────────────────────────────────────────────

export const apiVerifyTransaction = (reference: string, token: string) =>
  request<TransactionVerifyResponse>(
    'GET',
    `/transactions/verify/${reference}`,
    undefined,
    token
  );

// ── Reviews ─────────────────────────────────────────────────────────

export const apiSubmitReview = (
  id: string,
  data: ReviewResponseData,
  token: string
) => request<ReviewResponseData>('GET', `/profile/reviews/${id}`, data, token);

// ── Stats ─────────────────────────────────────────────────────────

export const apiGetDoctorStats = (token: string) =>
  request<DoctorStatsResponse>('GET', '/orders/stats/doctor', undefined, token);
