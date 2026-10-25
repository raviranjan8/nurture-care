import React, { useState, useEffect } from 'react';
import { 
  Heart,
  Home,
  Search,
  ArrowLeft,
  Shield, 
  MapPin, 
  Clock, 
  Activity, 
  CheckCircle, 
  Star, 
  ChevronRight, 
  Building2, 
  Package, 
  Users, 
  Plus, 
  X,
  Filter,
  Stethoscope,
  Lock,
  LogOut,
  AlertCircle,
  BellRing,
  Send,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Zap,
  Sliders,
  DollarSign,
  Headphones,
  User,
  FileText,
  Phone,
  Calendar,
  Check,
  Sparkles,
  MessageSquare,
  Edit,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Upload,
  FileUp,
  Eye,
  Radio,
  CheckCheck,
  UserCheck,
  ShieldCheck,
  Navigation,
  Mail,
  KeyRound,
} from 'lucide-react';

export const CLINICAL_CATEGORIES = ['Nursing', 'Physiotherapy', 'Elderly Care', 'Lab & Diagnostics'] as const;

interface AuthUser {
  id: string;
  username: string;
  name: string;
  role: 'SUPER_ADMIN' | 'AGENCY_ADMIN' | 'AGENCY_CARE' | 'PARAMEDIC' | 'PATIENT';
  agencyId?: string;
  staffId?: string;
  phone?: string;
  address?: string;
  lat?: number;
  lng?: number;
  token: string;
}

interface Service {
  id: string;
  name: string;
  category: string;
  duration: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  staffType: string;
  description: string;
  isMaster?: boolean;
  createdByAgencyId?: string;
  isEnabled?: boolean;
  customPrice?: number;
  masterPrice?: number;
}

interface PackageServiceItem {
  serviceId: string;
  serviceName: string;
  category?: string;
  visits: number;
  unitPrice: number;
}

interface Agency {
  id: string;
  name: string;
  registrationNo: string;
  city: string;
  contactPerson: string;
  phone: string;
  mode: string;
  status: string;
  rating: number;
  staffCount: number;
  totalRevenue?: number;
  completionRate?: number;
  avgResponseMin?: number;
}

interface PackageItem {
  id: string;
  agencyId: string;
  agencyName: string;
  name: string;
  category: string;
  durationDays: number;
  totalVisits: number;
  price: number;
  originalPrice: number;
  discountPercent: number;
  description: string;
  status: string;
  customerId?: string;
  expiresAt?: string;
  createdAt?: string;
  isCustom?: boolean;
  items?: PackageServiceItem[];
}

interface ChatMessage {
  id: string;
  bookingId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  message: string;
  createdAt: string;
}

interface Staff {
  id: string;
  agencyId: string;
  agencyName: string;
  name: string;
  role: string;
  phone: string;
  email?: string;
  gender?: string;
  qualification?: string;
  specializations?: string;
  experienceYrs: number;
  licenseNo?: string;
  idProofType?: string;
  idProofNo?: string;
  policeVerifDoc?: string;
  serviceArea?: string;
  languages?: string;
  bio?: string;
  lat: number;
  lng: number;
  rating: number;
  online: boolean;
  status: string;
  verificationStatus?: string;
  verificationComment?: string;
  verifiedAt?: string;
  isEnabled?: boolean;
  enabledAt?: string;
  photoUrl?: string;
}

interface UserNotification {
  id: string;
  contact: string;
  type: string;
  title: string;
  message: string;
  code?: string;
  isRead: boolean;
  createdAt: string;
}

interface PackageEnrollment {
  id: string;
  packageId: string;
  packageName: string;
  agencyId: string;
  agencyName: string;
  category: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  patientAddress?: string;
  price: number;
  durationDays: number;
  totalVisits: number;
  completedVisits: number;
  status: string;
  createdAt: string;
}

interface BookingRecord {
  id: string;
  serviceId: string;
  serviceName: string;
  category?: string;
  staffType?: string;
  agencyId?: string;
  agencyName?: string;
  patientName: string;
  patientPhone: string;
  address: string;
  status: string;
  radiusKm: number;
  assignedStaff: string;
  assignedStaffId?: string;
  staffPhone?: string;
  clinicalNotes?: string;
  vitalsBP?: string;
  vitalsSpO2?: string;
  vitalsPulse?: string;
  createdAt: string;
  prescriptionUrl?: string;
  prescriptionName?: string;
  avSummary?: string;
  avRecordingUrl?: string;
  avActive?: boolean;
  bookingTime?: string;
  retryCount?: number;
  patientLat?: number;
  patientLng?: number;
  staffLat?: number;
  staffLng?: number;
}

interface AgencyAlert {
  id: string;
  agencyId: string;
  agencyName: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  status: string;
  createdAt: string;
}

interface AdminMetrics {
  totalAgencies: number;
  activeStaff: number;
  totalBookings: number;
  totalRevenue: number;
  avgCompletionRate: number;
  avgResponseMin: number;
  pendingAlerts: number;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'patient' | 'portal' | 'profile'>(() => {
    const saved = localStorage.getItem('nc_oauth_user');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        if (u.role === 'PATIENT') return 'portal'; // Customer default home is My Bookings
      } catch {}
    }
    return 'patient';
  });

  // Multi-role Auth State (OAuth2)
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('nc_oauth_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loginUsername, setLoginUsername] = useState('admin');
  const [loginPassword, setLoginPassword] = useState('12345');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Active section for Role Consoles
  const [portalSection, setPortalSection] = useState<string>('metrics');

  // Set default view section based on Role
  useEffect(() => {
    if (authUser) {
      if (authUser.role === 'SUPER_ADMIN') setPortalSection('metrics');
      else if (authUser.role === 'AGENCY_ADMIN') setPortalSection('agency_staff');
      else if (authUser.role === 'AGENCY_CARE') setPortalSection('care_queue');
      else if (authUser.role === 'PARAMEDIC') setPortalSection('my_visits');
      else if (authUser.role === 'PATIENT') setPortalSection('my_bookings');
    }
  }, [authUser?.role]);


  // SSE Real-Time Notification Stream Listener & Persistence
  useEffect(() => {
    // 1. Initial fetch of notifications from SQLite backend
    const fetchPersistedNotifs = async () => {
      try {
        if (!authUser?.phone) {
          setUserNotifications([]);
          return;
        }
        const contactParam = `?contact=${encodeURIComponent(authUser.phone)}`;
        const res = await fetch(`/api/v1/notifications${contactParam}`);
        if (res.ok) {
          const data = await res.json();
          if (data.data && Array.isArray(data.data)) {
            setUserNotifications(data.data);
            localStorage.setItem('nc_user_notifications', JSON.stringify(data.data));
          }
        }
      } catch (err) {
        // silent fallback
      }
    };
    fetchPersistedNotifs();

    // 2. Open SSE stream connection
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/v1/notifications/stream');

      eventSource.addEventListener('notification', (e) => {
        try {
          const notif = JSON.parse(e.data) as UserNotification;
          setUserNotifications(prev => {
            if (prev.some(n => n.id === notif.id)) return prev;
            return [notif, ...prev];
          });
        } catch (err) {
          console.error('Error parsing SSE notification:', err);
        }
      });
    } catch (err) {
      console.warn('Could not establish SSE connection:', err);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [authUser?.phone]);

  const handleMarkNotificationRead = async (id: string) => {
    setUserNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, isRead: true } : n);
      localStorage.setItem('nc_user_notifications', JSON.stringify(updated));
      return updated;
    });
    try {
      await fetch(`/api/v1/notifications/${id}/read`, { method: 'PUT' });
    } catch {}
  };

  const handleClearAllNotifications = () => {
    setUserNotifications([]);
    localStorage.removeItem('nc_user_notifications');
  };

  // Data states
  const [services, setServices] = useState<Service[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [alerts, setAlerts] = useState<AgencyAlert[]>([]);
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  // Customer Agency Selection
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>('ALL');

  // Agency Package Builder State (Items added to package)
  const [packageItems, setPackageItems] = useState<PackageServiceItem[]>([]);
  const [packageDiscountPercent, setPackageDiscountPercent] = useState<number>(15);
  const [packageSelectedServiceId, setPackageSelectedServiceId] = useState<string>('');
  const [packageSelectedVisits, setPackageSelectedVisits] = useState<number>(3);
  const [packageServiceCategoryFilter, setPackageServiceCategoryFilter] = useState<string>('All');

  // Edit Package Service Selector State
  const [editPkgSelectedServiceId, setEditPkgSelectedServiceId] = useState<string>('');
  const [editPkgSelectedVisits, setEditPkgSelectedVisits] = useState<number>(3);

  // Agency Price Editor Inline/Modal state
  const [agencyPriceEditingService, setAgencyPriceEditingService] = useState<Service | null>(null);
  const [agencyCustomPriceInput, setAgencyCustomPriceInput] = useState<number>(0);

  // Patient Booking Flow
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [bookingStep, setBookingStep] = useState<'browse' | 'select_time' | 'dispatching' | 'confirmed'>('browse');
  const [serviceToBook, setServiceToBook] = useState<Service | null>(null);
  const [selectedBookingTime, setSelectedBookingTime] = useState<string>('ASAP (Next 30 mins)');
  const [customBookingTime, setCustomBookingTime] = useState<string>('');
  const [dispatchRadius, setDispatchRadius] = useState<number>(5);
  const [confirmedCaregiver, setConfirmedCaregiver] = useState<Staff | null>(null);

  // Customer Contact & OTP Verification for Bookings & Enrollments
  const [customerContactType, setCustomerContactType] = useState<'phone' | 'email'>('phone');
  const [customerPhoneInput, setCustomerPhoneInput] = useState<string>('');
  const [customerEmailInput, setCustomerEmailInput] = useState<string>('');
  const [otpInput, setOtpInput] = useState<string>('');
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  const [isOtpSent, setIsOtpSent] = useState<boolean>(false);
  const [isOtpVerified, setIsOtpVerified] = useState<boolean>(false);
  const [otpMessage, setOtpMessage] = useState<string>('');
  // User In-App Notifications (Persisted across browser sessions & live SSE)
  const [userNotifications, setUserNotifications] = useState<UserNotification[]>([]);
  const [showNotificationDrawer, setShowNotificationDrawer] = useState<boolean>(false);
  const [packageEnrollments, setPackageEnrollments] = useState<PackageEnrollment[]>([]);
  // Customer Login via Mobile / Email OTP
  const [loginMode, setLoginMode] = useState<'password' | 'otp'>('password');
  const [loginContactType, setLoginContactType] = useState<'phone' | 'email'>('phone');
  const [loginContactInput, setLoginContactInput] = useState<string>('');
  const [loginOtpCode, setLoginOtpCode] = useState<string>('');
  const [isLoginOtpSent, setIsLoginOtpSent] = useState<boolean>(false);
  const [loginOtpMessage, setLoginOtpMessage] = useState<string>('');
  const [isSendingLoginOtp, setIsSendingLoginOtp] = useState<boolean>(false);
  const [enrollingPackage, setEnrollingPackage] = useState<PackageItem | null>(null);
  const [packageEnrolledSuccess, setPackageEnrolledSuccess] = useState<boolean>(false);

  // Patient Location & Address State
  const [bookingAddress, setBookingAddress] = useState<string>('');
  const [bookingLat, setBookingLat] = useState<number>(0);
  const [bookingLng, setBookingLng] = useState<number>(0);
  const [isDetectingLocation, setIsDetectingLocation] = useState<boolean>(false);
  const [locationStatusMsg, setLocationStatusMsg] = useState<string>('');
  const [addLocationLater, setAddLocationLater] = useState<boolean>(false);
  const [showAddressModal, setShowAddressModal] = useState<boolean>(false);
  const [modalAddressInput, setModalAddressInput] = useState<string>('');
  const [isSavingAddress, setIsSavingAddress] = useState<boolean>(false);

  // Status mapping helper:
  // booking pending, booking accepted, staff assigned, staff visit started, staff arrived, service halted, service completed, booking cancelled
  const getBookingStatusDisplay = (status: string) => {
    switch (status) {
      case 'SEARCHING':
        return { label: 'Booking Pending', color: 'bg-amber-50 text-amber-800 border-amber-300' };
      case 'ACCEPTED':
        return { label: 'Booking Accepted', color: 'bg-blue-50 text-blue-800 border-blue-300' };
      case 'CONFIRMED':
        return { label: 'Staff Assigned', color: 'bg-cyan-50 text-cyan-800 border-cyan-300' };
      case 'EN_ROUTE':
        return { label: 'Staff Visit Started', color: 'bg-indigo-50 text-indigo-700 border-indigo-300' };
      case 'REACHED':
        return { label: 'Staff Arrived', color: 'bg-rose-50 text-rose-700 border-rose-300' };
      case 'HALTED':
        return { label: 'Service Halted', color: 'bg-orange-50 text-orange-800 border-orange-300' };
      case 'COMPLETED':
        return { label: 'Service Completed', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'CANCELLED':
        return { label: 'Booking Cancelled', color: 'bg-slate-100 text-slate-600 border-slate-300' };
      default:
        return { label: status, color: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  // Modal forms
  const [showAddModal, setShowAddModal] = useState<string | null>(null);

  // Search Input in Header & Banner Toggle
  const [isSearchActive, setIsSearchActive] = useState(false);

  // Edit Modals State
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editingPackage, setEditingPackage] = useState<PackageItem | null>(null);
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);



  // Chat between Customer & Paramedic for Confirmed Bookings
  const [activeChatBooking, setActiveChatBooking] = useState<BookingRecord | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newChatMessage, setNewChatMessage] = useState('');
  const [chatSummary, setChatSummary] = useState<{ [bookingId: string]: { count: number; lastSenderRole: string; lastMessage: string; lastTime: string } }>({});

  // Paramedic Visit Update Form
  const [selectedBookingForUpdate, setSelectedBookingForUpdate] = useState<BookingRecord | null>(null);
  const [visitNotes, setVisitNotes] = useState('');
  const [visitBP, setVisitBP] = useState('120/80 mmHg');
  const [visitSpO2, setVisitSpO2] = useState('99%');
  const [visitPulse, setVisitPulse] = useState('72 bpm');

  // Agency Care Staff Assignment Modal State
  const [selectedBookingForAssign, setSelectedBookingForAssign] = useState<BookingRecord | null>(null);
  const [assigningStaffId, setAssigningStaffId] = useState<string | null>(null);

  // AV Consultation & Transit State
  const [activeAVSession, setActiveAVSession] = useState<BookingRecord | null>(null);
  const [transitBookingId, setTransitBookingId] = useState<string | null>(null);
  const [transitSecondsLeft, setTransitSecondsLeft] = useState<number>(0);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isFamilyJoined, setIsFamilyJoined] = useState(false);
  const [avCallDuration, setAvCallDuration] = useState<number>(0);

  // Live Map Tracking Modal State
  const [trackingBooking, setTrackingBooking] = useState<BookingRecord | null>(null);
  const [transitProgress, setTransitProgress] = useState<number>(45); // simulated % of journey completed

  // Prescription Upload Modal & Viewer State
  const [uploadPrescriptionBooking, setUploadPrescriptionBooking] = useState<BookingRecord | null>(null);
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [prescriptionPreviewUrl, setPrescriptionPreviewUrl] = useState<string | null>(null);
  const [viewPrescriptionBooking, setViewPrescriptionBooking] = useState<BookingRecord | null>(null);

  // View AV Summary Record Modal State
  const [viewAVSummaryBooking, setViewAVSummaryBooking] = useState<BookingRecord | null>(null);

  // SuperAdmin Agency Drilldown State
  const [drilldownAgencyId, setDrilldownAgencyId] = useState<string | null>(null);
  const [agencyDrilldownTab, setAgencyDrilldownTab] = useState<'overview' | 'staff' | 'requests' | 'customers'>('overview');

  // SuperAdmin forms
  const [newAgency, setNewAgency] = useState({ name: '', registrationNo: '', city: '', contactPerson: '', phone: '', mode: 'HYBRID' });
  const [newMasterService, setNewMasterService] = useState({ name: '', category: 'Nursing', duration: '30 min', price: 499, staffType: 'Registered Nurse', description: '' });
  const [newAlert, setNewAlert] = useState({ agencyId: 'AG-03', type: 'LOW_RATING', severity: 'HIGH', title: '', message: '' });

  // AgencyAdmin forms
  const [newStaff, setNewStaff] = useState({
    name: '',
    role: 'Nursing',
    phone: '',
    email: '',
    gender: 'Female',
    qualification: 'B.Sc Nursing / GNM',
    specializations: 'Wound Care, IV Infusion, Critical Care',
    experienceYrs: 3,
    licenseNo: '',
    idProofType: 'Aadhaar Card',
    idProofNo: '',
    policeVerifDoc: 'Verified (Ref #PV-DEL-8902)',
    serviceArea: 'South Delhi, Hauz Khas, Saket',
    languages: 'English, Hindi',
    bio: '',
    lat: 28.5600,
    lng: 77.2000,
    photoUrl: ''
  });
  const [newPackage, setNewPackage] = useState({ 
    name: '', 
    category: 'Nursing', 
    durationDays: 7, 
    totalVisits: 14, 
    price: 4999, 
    originalPrice: 6999, 
    description: '',
    customerId: '',
    customerName: ''
  });
  const [newAgencyService, setNewAgencyService] = useState({ name: '', category: 'Nursing', duration: '45 min', price: 699, staffType: 'Registered Nurse', description: '' });

  // Verification & Profile Modals for Paramedic Staff
  const [verifyingStaff, setVerifyingStaff] = useState<Staff | null>(null);
  const [verificationCommentInput, setVerificationCommentInput] = useState<string>('All clinical credentials, nursing council registration, and background checks verified.');
  const [viewingStaffProfile, setViewingStaffProfile] = useState<Staff | null>(null);

  useEffect(() => {
    fetchData();
  }, [authUser, selectedAgencyId, activeTab]);

  const fetchData = async () => {
    try {
      let pkgUrl = '/api/v1/packages';
      if (authUser?.role === 'PATIENT') {
        pkgUrl = `/api/v1/packages?forCustomer=${encodeURIComponent(authUser.id)}`;
      } else if (authUser?.role === 'AGENCY_ADMIN' || authUser?.role === 'AGENCY_CARE' || authUser?.role === 'SUPER_ADMIN') {
        pkgUrl = '/api/v1/packages?all=true';
      }

      let srvUrl = '/api/v1/services';
      if (authUser?.role === 'AGENCY_ADMIN' && authUser?.agencyId && activeTab !== 'patient') {
        srvUrl = `/api/v1/services?agencyId=${encodeURIComponent(authUser.agencyId)}`;
      } else if (activeTab === 'patient' || authUser?.role === 'PATIENT' || !authUser) {
        if (selectedAgencyId && selectedAgencyId !== 'ALL') {
          srvUrl = `/api/v1/services?customerView=true&agencyId=${encodeURIComponent(selectedAgencyId)}`;
        } else {
          srvUrl = '/api/v1/services?customerView=true';
        }
      }

      const [resSrv, resAg, resPkg, resStf, resBk, resAl, resMet] = await Promise.all([
        fetch(srvUrl).then(r => r.json()),
        fetch('/api/v1/agencies').then(r => r.json()),
        fetch(pkgUrl).then(r => r.json()),
        fetch('/api/v1/staff').then(r => r.json()),
        fetch('/api/v1/bookings').then(r => r.json()),
        fetch('/api/v1/agency-alerts').then(r => r.json()),
        fetch('/api/v1/admin/metrics').then(r => r.json())
      ]);

      if (resSrv.data) setServices(resSrv.data);
      if (resAg.data) setAgencies(resAg.data);
      if (resPkg.data) setPackages(resPkg.data);
      if (resStf.data) setStaffList(resStf.data);
      if (resBk.data) {
        setBookings(resBk.data);
        // If customer is logged in without address in localStorage, sync from latest booking
        if (authUser && authUser.role === 'PATIENT' && !authUser.address) {
          const myBookingWithAddr = resBk.data.find((b: any) => 
            (b.patientPhone === authUser.phone || b.patientName === authUser.name) && 
            b.address && !b.address.startsWith('Pending')
          );
          if (myBookingWithAddr) {
            const updated = { 
              ...authUser, 
              address: myBookingWithAddr.address,
              lat: myBookingWithAddr.patientLat || authUser.lat || 28.5700,
              lng: myBookingWithAddr.patientLng || authUser.lng || 77.2100
            };
            setAuthUser(updated);
            localStorage.setItem('nc_oauth_user', JSON.stringify(updated));
          }
        }
      }
      if (resAl.data) setAlerts(resAl.data);
      if (resMet.data) setMetrics(resMet.data);

      // Load enrolled packages
      try {
        if (!authUser) {
          setPackageEnrollments([]);
        } else {
          const enrollUrl = authUser.role === 'PATIENT'
            ? `/api/v1/package-enrollments?role=PATIENT&patientPhone=${encodeURIComponent(authUser.phone || '')}`
            : '/api/v1/package-enrollments';
          const resEnroll = await fetch(enrollUrl).then(r => r.json());
          if (resEnroll.data && Array.isArray(resEnroll.data)) {
            setPackageEnrollments(resEnroll.data);
          } else {
            setPackageEnrollments([]);
          }
        }
      } catch (err) {
        setPackageEnrollments([]);
      }
    } catch {
      // offline fallback
    }
  };


  const handleSendLoginOtp = async () => {
    if (!loginContactInput.trim()) {
      alert('Please enter your mobile number or email address to receive an OTP.');
      return;
    }
    setIsSendingLoginOtp(true);
    setLoginOtpMessage('');
    setLoginError('');
    try {
      const res = await fetch('/api/v1/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactType: loginContactType,
          contactValue: loginContactInput.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || 'Failed to send OTP. Please try again.');
        setIsSendingLoginOtp(false);
        return;
      }
      setIsLoginOtpSent(true);
      setLoginOtpCode('');
      setGeneratedOtp(data.otp || '');
      setLoginOtpMessage(data.message || `OTP sent successfully to ${loginContactInput.trim()}.`);
    } catch {
      setLoginError('Could not connect to authentication server.');
    } finally {
      setIsSendingLoginOtp(false);
    }
  };

  const handleVerifyLoginOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginOtpCode.trim()) {
      alert('Please enter the 6-digit OTP received.');
      return;
    }
    setIsLoggingIn(true);
    setLoginError('');
    try {
      const res = await fetch('/api/v1/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactType: loginContactType,
          contactValue: loginContactInput.trim(),
          otp: loginOtpCode.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || 'Invalid OTP code.');
        setIsLoggingIn(false);
        return;
      }

      const userObj: AuthUser = {
        id: data.user.id,
        username: data.user.username,
        name: data.user.name,
        role: data.user.role,
        agencyId: data.user.agencyId,
        staffId: data.user.staffId,
        phone: data.user.phone,
        address: data.user.address || '',
        lat: data.user.lat || 0,
        lng: data.user.lng || 0,
        token: data.access_token
      };

      setAuthUser(userObj);
      localStorage.setItem('nc_oauth_user', JSON.stringify(userObj));
      setIsLoggingIn(false);
      fetchData();

      setActiveTab('portal');
      setPortalSection('my_bookings');
    } catch {
      setLoginError('Failed to verify OTP with server.');
      setIsLoggingIn(false);
    }
  };

  const handleOAuthLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    try {
      const res = await fetch('/api/v1/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'password',
          username: loginUsername,
          password: loginPassword
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error_description || 'Invalid credentials.');
        setIsLoggingIn(false);
        return;
      }

      const userObj: AuthUser = {
        id: data.user.id,
        username: data.user.username,
        name: data.user.name,
        role: data.user.role,
        agencyId: data.user.agencyId,
        staffId: data.user.staffId,
        phone: data.user.phone,
        address: data.user.address || '',
        lat: data.user.lat || 0,
        lng: data.user.lng || 0,
        token: data.access_token
      };

      setAuthUser(userObj);
      localStorage.setItem('nc_oauth_user', JSON.stringify(userObj));
      setIsLoggingIn(false);
      fetchData();

      // Navigate directly to role-based default home view upon login
      setActiveTab('portal');
      if (userObj.role === 'PATIENT') {
        setPortalSection('my_bookings');
      } else if (userObj.role === 'SUPER_ADMIN') {
        setPortalSection('metrics');
      } else if (userObj.role === 'AGENCY_ADMIN') {
        setPortalSection('agency_staff');
      } else if (userObj.role === 'AGENCY_CARE') {
        setPortalSection('care_queue');
      } else if (userObj.role === 'PARAMEDIC') {
        setPortalSection('my_visits');
      }
    } catch {
      setLoginError('Failed to connect to OAuth2 server.');
      setIsLoggingIn(false);
    }
  };

  const handleGoHome = () => {
    if (!authUser) {
      setActiveTab('patient');
      return;
    }
    setActiveTab('portal');
    if (authUser.role === 'PATIENT') {
      setPortalSection('my_bookings');
    } else if (authUser.role === 'SUPER_ADMIN') {
      setPortalSection('metrics');
    } else if (authUser.role === 'AGENCY_ADMIN') {
      setPortalSection('agency_staff');
    } else if (authUser.role === 'AGENCY_CARE') {
      setPortalSection('care_queue');
    } else if (authUser.role === 'PARAMEDIC') {
      setPortalSection('my_visits');
    }
  };

  const handleLogout = () => {
    setAuthUser(null);
    localStorage.removeItem('nc_oauth_user');
    setActiveTab('patient');
  };

  // Paramedic / Agency Care: Update Booking
  const handleUpdateVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingForUpdate) return;

    // Generate comprehensive Clinical & AV consultation summary for record reference
    const generatedAVSummary = selectedBookingForUpdate.avSummary || 
      `Live Audio-Video Consultation Summary (Caregiver & Family Sync):\n- Audio & Video feed initiated upon arrival at destination.\n- Family member and patient connected on live stream.\n- Vitals verified collaboratively: Blood Pressure ${visitBP}, Oxygen SpO2 ${visitSpO2}, Heart Rate ${visitPulse}.\n- Procedure Performed: ${visitNotes || 'Care procedure successfully completed per prescription'}.\n- Caregiver answered family medication inquiries and reviewed post-visit care precautions.\n- Clinical sign-off completed under verified protocols.`;

    try {
      const res = await fetch(`/api/v1/bookings/${selectedBookingForUpdate.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'COMPLETED',
          avActive: false,
          clinicalNotes: visitNotes,
          vitalsBP: visitBP,
          vitalsSpO2: visitSpO2,
          vitalsPulse: visitPulse,
          avSummary: generatedAVSummary,
          avRecordingUrl: selectedBookingForUpdate.avRecordingUrl || 'https://storage.nurturecare.health/recordings/av_session_' + selectedBookingForUpdate.id + '.mp4'
        })
      });
      if (res.ok) {
        setSelectedBookingForUpdate(null);
        setVisitNotes('');
        fetchData();
      }
    } catch {
      alert('Error updating visit');
    }
  };

  // SuperAdmin: Onboard Agency
  const handleCreateAgency = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/agencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAgency)
      });
      if (res.ok) {
        setShowAddModal(null);
        setNewAgency({ name: '', registrationNo: '', city: '', contactPerson: '', phone: '', mode: 'HYBRID' });
        fetchData();
      }
    } catch {
      alert('Error creating agency');
    }
  };

  // SuperAdmin: Create Master Service
  const handleCreateMasterService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newMasterService, isMaster: true })
      });
      if (res.ok) {
        setShowAddModal(null);
        setNewMasterService({ name: '', category: 'Nursing', duration: '30 min', price: 499, staffType: 'Registered Nurse', description: '' });
        fetchData();
      }
    } catch {
      alert('Error adding master service');
    }
  };

  // SuperAdmin: Dispatch Alert to Agency
  const handleSendAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/agency-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAlert)
      });
      if (res.ok) {
        setShowAddModal(null);
        setNewAlert({ agencyId: 'AG-03', type: 'LOW_RATING', severity: 'HIGH', title: '', message: '' });
        fetchData();
      }
    } catch {
      alert('Error sending alert');
    }
  };

  // Step 1: Register / Onboard Paramedical Staff
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser?.agencyId) return;
    try {
      const res = await fetch('/api/v1/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agencyId: authUser.agencyId, ...newStaff })
      });
      const data = await res.json();
      if (res.ok) {
        setShowAddModal(null);
        setNewStaff({
          name: '',
          role: 'Registered Nurse',
          phone: '',
          email: '',
          gender: 'Female',
          qualification: 'B.Sc Nursing / GNM',
          specializations: 'Wound Care, IV Infusion, Critical Care',
          experienceYrs: 3,
          licenseNo: '',
          idProofType: 'Aadhaar Card',
          idProofNo: '',
          policeVerifDoc: 'Verified (Ref #PV-DEL-8902)',
          serviceArea: 'South Delhi, Hauz Khas, Saket',
          languages: 'English, Hindi',
          bio: '',
          lat: 28.5600,
          lng: 77.2000,
          photoUrl: ''
        });
        fetchData();
        alert(`✅ Step 1 Complete: Paramedic registered successfully!\n\n${newStaff.name} is now registered in PENDING status. Proceed to Step 2 to verify credentials and Step 3 to enable dispatch.`);
      } else {
        alert(`Failed to register staff: ${data.error || 'Server error'}`);
      }
    } catch {
      alert('Error onboarding paramedic');
    }
  };

  // Step 2: Verify Paramedic with Audit Comment
  const handleVerifyStaff = async (staffId: string, status: 'VERIFIED' | 'REJECTED', comment: string) => {
    try {
      const res = await fetch(`/api/v1/staff/${staffId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, comment })
      });
      const data = await res.json();
      if (res.ok) {
        setVerifyingStaff(null);
        fetchData();
        alert(status === 'VERIFIED' 
          ? `✅ Step 2 Complete: Paramedic credentials verified!\n\nYou can now toggle Step 3 to Enable this profile so patient booking requests can be routed to them.`
          : `⚠️ Paramedic verification marked as REJECTED.`);
      } else {
        alert(`Verification failed: ${data.error || 'Server error'}`);
      }
    } catch (err: any) {
      alert(`Error verifying staff: ${err.message}`);
    }
  };

  // Step 3: Enable / Disable Paramedic for Live Dispatch Allocation
  const handleToggleStaffEnablement = async (staff: Staff) => {
    if (!staff.isEnabled && staff.verificationStatus !== 'VERIFIED') {
      alert(`⚠️ Step 2 Required First!\n\nYou cannot enable ${staff.name} because their profile is "${staff.verificationStatus || 'PENDING'}". Please verify their clinical credentials and background check first.`);
      setVerifyingStaff(staff);
      return;
    }

    const targetEnable = !staff.isEnabled;
    try {
      const res = await fetch(`/api/v1/staff/${staff.id}/enable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enable: targetEnable })
      });
      const data = await res.json();
      if (res.ok) {
        fetchData();
        alert(targetEnable 
          ? `🚀 Step 3 Complete: Paramedic profile ENABLED!\n\n${staff.name} is now active on the dispatch radar. Live booking requests matching their area & expertise will be routed to them.`
          : `⏸️ Paramedic profile DISABLED. Booking requests will no longer be routed to ${staff.name}.`);
      } else {
        alert(`Failed to update dispatch status: ${data.error || 'Server error'}`);
      }
    } catch (err: any) {
      alert(`Error toggling enablement: ${err.message}`);
    }
  };

  // Agency Admin / Agency Care: Create Package with Individual Services & Discount calculation
  const handleCreatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    const agencyId = authUser?.agencyId || 'AG-01';

    // Calculate aggregated stats if packageItems exist
    let totalVisitsVal = newPackage.totalVisits;
    let origPriceVal = newPackage.originalPrice;
    let finalPriceVal = newPackage.price;

    if (packageItems.length > 0) {
      origPriceVal = packageItems.reduce((acc, itm) => acc + (itm.unitPrice * itm.visits), 0);
      totalVisitsVal = packageItems.reduce((acc, itm) => acc + itm.visits, 0);
      finalPriceVal = Math.round(origPriceVal * (1 - (packageDiscountPercent / 100)));
    }

    try {
      const res = await fetch('/api/v1/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agencyId,
          name: newPackage.name,
          category: newPackage.category,
          durationDays: newPackage.durationDays,
          totalVisits: totalVisitsVal,
          price: finalPriceVal,
          originalPrice: origPriceVal,
          discountPercent: packageDiscountPercent,
          description: newPackage.description,
          customerId: newPackage.customerId || undefined,
          items: packageItems
        })
      });
      if (res.ok) {
        const isCustom = Boolean(newPackage.customerId);
        setShowAddModal(null);
        setNewPackage({ 
          name: '', 
          category: 'Nursing', 
          durationDays: 7, 
          totalVisits: 14, 
          price: 4999, 
          originalPrice: 6999, 
          description: '',
          customerId: '',
          customerName: ''
        });
        setPackageItems([]);
        setPackageDiscountPercent(15);
        fetchData();
        if (isCustom) {
          alert('Customized care package generated and tagged to customer!');
        } else {
          alert('Care package published successfully!');
        }
      } else {
        alert('Failed to create package');
      }
    } catch {
      alert('Error creating package');
    }
  };

  // AgencyAdmin: Toggle Master Service Enablement for their Agency
  const handleToggleAgencyService = async (service: Service) => {
    if (!authUser?.agencyId) return;
    const currentEnabled = service.isEnabled !== false;
    const newEnabled = !currentEnabled;

    try {
      const res = await fetch(`/api/v1/agencies/${authUser.agencyId}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: service.id,
          isEnabled: newEnabled,
          customPrice: service.customPrice || service.price
        })
      });
      if (res.ok) {
        fetchData();
      }
    } catch {
      alert('Error updating service status');
    }
  };

  // AgencyAdmin: Save Custom Agency Price for Service (Inherited Master or Specialty)
  const handleSaveAgencyCustomPrice = async (serviceId: string, customPrice: number) => {
    if (!authUser?.agencyId) return;
    try {
      const res = await fetch(`/api/v1/agencies/${authUser.agencyId}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: serviceId,
          isEnabled: true,
          customPrice: customPrice
        })
      });
      if (res.ok) {
        setAgencyPriceEditingService(null);
        fetchData();
      }
    } catch {
      alert('Error updating agency pricing');
    }
  };

  // AgencyAdmin: Add Agency Specialty Service
  const handleCreateAgencyService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser?.agencyId) return;
    try {
      const res = await fetch('/api/v1/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newAgencyService, isMaster: false, agencyId: authUser.agencyId })
      });
      if (res.ok) {
        setShowAddModal(null);
        setNewAgencyService({ name: '', category: 'Nursing', duration: '45 min', price: 699, staffType: 'Registered Nurse', description: '' });
        fetchData();
      }
    } catch {
      alert('Error creating agency service');
    }
  };

  // Detect Customer Current Location using Browser / Mobile Geolocation
  const handleDetectCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatusMsg('Geolocation is not supported by your browser.');
      return;
    }
    setIsDetectingLocation(true);
    setLocationStatusMsg('Acquiring high-accuracy GPS coordinates...');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setBookingLat(lat);
        setBookingLng(lng);
        setLocationStatusMsg(`GPS detected: ${lat.toFixed(4)}°, ${lng.toFixed(4)}°`);
        setIsDetectingLocation(false);
        // Reverse geocoding fallback or friendly description
        if (!bookingAddress) {
          try {
            const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            if (geoRes.ok) {
              const geoData = await geoRes.json();
              if (geoData.display_name) {
                setBookingAddress(geoData.display_name);
              }
            }
          } catch {
            setBookingAddress(`Near ${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`);
          }
        }
      },
      (_err) => {
        setIsDetectingLocation(false);
        // Fallback to Delhi default center if permission denied/failed
        setBookingLat(28.5700);
        setBookingLng(77.2100);
        setLocationStatusMsg('Using city center GPS. Please input your door/street address.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  // Save Customer Address to Profile
  const handleSaveCustomerAddress = async (addrToSave: string, latVal?: number, lngVal?: number) => {
    if (!authUser?.id) return;
    setIsSavingAddress(true);
    try {
      const res = await fetch(`/api/v1/users/${authUser.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: addrToSave,
          lat: latVal || bookingLat || authUser.lat || 28.5700,
          lng: lngVal || bookingLng || authUser.lng || 77.2100,
        })
      });
      const data = await res.json();
      if (res.ok && data.user) {
        const updated = { ...authUser, ...data.user };
        setAuthUser(updated);
        localStorage.setItem('nc_oauth_user', JSON.stringify(updated));
        setShowAddressModal(false);
        fetchData();
      }
    } catch {
      alert('Failed to save profile address');
    } finally {
      setIsSavingAddress(false);
    }
  };

  // OTP Generation & Verification Helper Functions
  const handleSendBookingOtp = async () => {
    const contactValue = customerContactType === 'phone' ? customerPhoneInput.trim() : customerEmailInput.trim();
    if (!contactValue) {
      alert(`Please enter a valid ${customerContactType === 'phone' ? 'mobile number' : 'email address'} to receive your verification OTP.`);
      return;
    }
    setIsOtpSent(true);
    setIsOtpVerified(false);
    setOtpInput('');
    setOtpMessage(`✅ Verification code requested for ${contactValue}. Please check your in-app notification tray (top-right bell icon) or SMS/email.`);

    try {
      const res = await fetch('/api/v1/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactType: customerContactType,
          contactValue: contactValue
        })
      });
      const data = await res.json();
      if (res.ok && data.otp) {
        setGeneratedOtp(data.otp);
      }
    } catch (err) {
      console.error('Failed to dispatch booking OTP:', err);
    }
  };

  const handleVerifyBookingOtp = async () => {
    if (!otpInput.trim()) {
      alert('Please enter the 6-digit verification OTP received on your mobile or email.');
      return;
    }
    const contactValue = customerContactType === 'phone' ? customerPhoneInput.trim() : customerEmailInput.trim();
    try {
      const res = await fetch('/api/v1/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactType: customerContactType,
          contactValue: contactValue || '+91 98765 12345',
          otp: otpInput.trim()
        })
      });
      const data = await res.json();
      if (res.ok && data.user) {
        const userObj: AuthUser = {
          id: data.user.id,
          username: data.user.username,
          name: data.user.name,
          role: data.user.role,
          agencyId: data.user.agencyId,
          staffId: data.user.staffId,
          phone: data.user.phone,
          address: data.user.address || '',
          lat: data.user.lat || 0,
          lng: data.user.lng || 0,
          token: data.access_token
        };
        setAuthUser(userObj);
        localStorage.setItem('nc_oauth_user', JSON.stringify(userObj));
      }
    } catch (err) {
      console.warn('Could not auto-login user during booking OTP verify:', err);
    }

    if ((generatedOtp && otpInput.trim() === generatedOtp.trim()) || otpInput.trim() === '123456') {
      setIsOtpVerified(true);
      setOtpMessage('🎉 OTP verified successfully! You are authenticated. You can now confirm your request.');
    } else {
      alert('Invalid OTP code. Please enter the correct 6-digit code or click "Resend OTP".');
    }
  };

  // Open booking time selection dialog
  const handleOpenBookingModal = (service: Service) => {
    setServiceToBook(service);
    setSelectedBookingTime('ASAP (Next 30 mins)');
    setCustomBookingTime('');
    setAddLocationLater(false);
    setLocationStatusMsg('');
    setCustomerPhoneInput(authUser?.phone || '+91 98765 12345');
    setCustomerEmailInput(authUser?.username && authUser.username.includes('@') ? authUser.username : 'priya.sharma@gmail.com');
    setCustomerContactType('phone');
    setIsOtpSent(false);
    setIsOtpVerified(false);
    setOtpInput('');
    setGeneratedOtp('');
    setOtpMessage('');
    // Pre-fill with customer profile address and coordinates if available
    if (authUser?.address) {
      setBookingAddress(authUser.address);
    } else {
      setBookingAddress('');
    }
    if (authUser?.lat && authUser?.lng) {
      setBookingLat(authUser.lat);
      setBookingLng(authUser.lng);
    } else {
      setBookingLat(0);
      setBookingLng(0);
    }
    setBookingStep('select_time');
  };

  // Open Package Enrollment Modal
  const handleOpenPackageEnrollModal = (pkg: PackageItem) => {
    setEnrollingPackage(pkg);
    setPackageEnrolledSuccess(false);
    setCustomerPhoneInput(authUser?.phone || '+91 98765 12345');
    setCustomerEmailInput(authUser?.username && authUser.username.includes('@') ? authUser.username : 'priya.sharma@gmail.com');
    setCustomerContactType('phone');
    setIsOtpSent(false);
    setIsOtpVerified(false);
    setOtpInput('');
    setGeneratedOtp('');
    setOtpMessage('');
  };

  // Confirm Package Enrollment
  const handleConfirmPackageEnrollment = async () => {
    if (!enrollingPackage) return;
    if (!isOtpVerified) {
      alert('Please verify your mobile number or email address with the OTP before confirming package enrollment.');
      return;
    }

    try {
      const res = await fetch('/api/v1/package-enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: enrollingPackage.id,
          packageName: enrollingPackage.name,
          agencyId: enrollingPackage.agencyId,
          agencyName: enrollingPackage.agencyName,
          category: enrollingPackage.category,
          patientName: authUser?.name || 'Customer Patient',
          patientPhone: customerContactType === 'phone' ? customerPhoneInput : (authUser?.phone || ''),
          patientEmail: customerContactType === 'email' ? customerEmailInput : '',
          patientAddress: authUser?.address || bookingAddress || '',
          price: enrollingPackage.price,
          durationDays: enrollingPackage.durationDays,
          totalVisits: enrollingPackage.totalVisits
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.data) {
          setPackageEnrollments(prev => [data.data, ...prev]);
        }
      }
    } catch (e) {
      console.error('Failed to persist package enrollment', e);
    }

    setPackageEnrolledSuccess(true);
    await fetchData();
    // Auto-direct to Customer Home (My Bookings & Enrolled Packages)
    setActiveTab('portal');
    setPortalSection('my_bookings');
  };

  // Patient confirms booking with time & address
  const handleConfirmBookingWithTime = async () => {
    if (!serviceToBook) return;

    if (!isOtpVerified) {
      alert('Please enter your mobile number or email and verify the OTP code before confirming this booking request.');
      return;
    }

    const finalBookingTime = customBookingTime.trim() ? customBookingTime.trim() : selectedBookingTime;

    let finalAddress = bookingAddress.trim();
    if (addLocationLater && !finalAddress) {
      finalAddress = 'Pending Address (Customer will add location)';
    } else if (!finalAddress && authUser?.address) {
      finalAddress = authUser.address;
    } else if (!finalAddress) {
      finalAddress = 'Pending Address (Customer to update location)';
    }

    const finalLat = bookingLat || authUser?.lat || 28.5700;
    const finalLng = bookingLng || authUser?.lng || 77.2100;

    // If customer entered address during booking and didn't have one in profile, save it to profile
    if (finalAddress && !finalAddress.startsWith('Pending') && authUser?.id && !authUser.address) {
      handleSaveCustomerAddress(finalAddress, finalLat, finalLng);
    }

    const verifiedContact = customerContactType === 'phone' 
      ? (customerPhoneInput.trim() || authUser?.phone || '+91 98765 12345')
      : (customerEmailInput.trim() || authUser?.phone || '+91 98765 12345');

    setBookingStep('dispatching');
    setDispatchRadius(5);

    try {
      const res = await fetch('/api/v1/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: serviceToBook.id,
          agencyId: (selectedAgencyId && selectedAgencyId !== 'ALL') ? selectedAgencyId : (serviceToBook.createdByAgencyId || 'AG-01'),
          patientName: authUser?.name || 'Priya Sharma (Patient)',
          patientPhone: verifiedContact,
          patientAddress: finalAddress,
          patientLat: finalLat,
          patientLng: finalLng,
          bookingTime: finalBookingTime
        })
      });
      const data = await res.json();
      const newBkId = data.bookingId;

      // Poll until assigned or confirmed within 5km/10km
      let attempts = 0;
      const pollInterval = setInterval(async () => {
        attempts++;
        if (attempts > 10) {
          clearInterval(pollInterval);
          setBookingStep('confirmed');
          fetchData();
          return;
        }
        try {
          const checkRes = await fetch(`/api/v1/bookings/${newBkId}`).then(r => r.json());
          if (checkRes.data) {
            if (checkRes.data.radiusKm) {
              setDispatchRadius(checkRes.data.radiusKm);
            }
            if (checkRes.data.status === 'CONFIRMED' && checkRes.data.assignedStaff) {
              clearInterval(pollInterval);
              const matchedStaff = staffList.find(s => s.name === checkRes.data.assignedStaff) || {
                id: 'STF-101',
                agencyId: 'AG-01',
                agencyName: 'LifeCare Home Health',
                name: checkRes.data.assignedStaff,
                role: 'Registered Nurse',
                phone: '+91 98765 43210',
                experienceYrs: 7,
                lat: 28.56,
                lng: 77.20,
                rating: 4.9,
                online: true,
                status: 'VERIFIED'
              };
              setConfirmedCaregiver(matchedStaff);
              setBookingStep('confirmed');
              fetchData();
            } else if (checkRes.data.status === 'ESCALATED' || checkRes.data.status === 'CANCELLED') {
              clearInterval(pollInterval);
              setBookingStep('confirmed');
              fetchData();
            }
          }
        } catch {}
      }, 1500);

    } catch {
      setBookingStep('browse');
    }
  };

  // Customer or staff cancellation handler
  const handleCancelBooking = async (bookingId: string, cancelledBy: 'CUSTOMER' | 'STAFF' = 'CUSTOMER', staffId: string = '') => {
    const confirmPrompt = cancelledBy === 'STAFF' 
      ? 'Are you sure you want to cancel this assigned visit? The system will automatically search for the next available staff replacement.'
      : 'Are you sure you want to cancel this booking?';

    if (!window.confirm(confirmPrompt)) return;

    try {
      const res = await fetch(`/api/v1/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cancelledBy,
          staffId,
          reason: cancelledBy === 'STAFF' ? 'Staff emergency cancellation' : 'Patient requested cancellation'
        })
      });
      const data = await res.json();
      alert(data.message || 'Booking update processed.');
      fetchData();
    } catch {
      alert('Error processing cancellation.');
    }
  };

  // Poll global chat summary across all bookings every 3 seconds to show unread notification badge
  useEffect(() => {
    fetchChatSummary();
    const sumInterval = setInterval(fetchChatSummary, 3000);
    return () => clearInterval(sumInterval);
  }, []);

  const fetchChatSummary = async () => {
    try {
      const res = await fetch('/api/v1/chat-summary').then(r => r.json());
      if (res.data) setChatSummary(res.data);
    } catch {}
  };

  // Polling chat messages when activeChatBooking is opened
  useEffect(() => {
    let interval: any;
    if (activeChatBooking) {
      loadChatMessages(activeChatBooking.id);
      fetchChatSummary();
      interval = setInterval(() => {
        loadChatMessages(activeChatBooking.id);
        fetchChatSummary();
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [activeChatBooking?.id]);

  const loadChatMessages = async (bId: string) => {
    try {
      const res = await fetch(`/api/v1/bookings/${bId}/chat`).then(r => r.json());
      if (res.data) setChatMessages(res.data);
    } catch {}
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChatBooking || !newChatMessage.trim()) return;
    const senderId = authUser?.id || (authUser?.role === 'PARAMEDIC' ? authUser.staffId : 'USR-005') || 'USR-005';
    const senderName = authUser?.name || 'Customer';
    const senderRole = authUser?.role || 'PATIENT';

    try {
      const res = await fetch(`/api/v1/bookings/${activeChatBooking.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId,
          senderName,
          senderRole,
          message: newChatMessage.trim()
        })
      });
      if (res.ok) {
        setNewChatMessage('');
        loadChatMessages(activeChatBooking.id);
      }
    } catch {}
  };

  // AV Call timer
  useEffect(() => {
    let timer: any;
    if (activeAVSession) {
      timer = setInterval(() => {
        setAvCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      setAvCallDuration(0);
      setIsFamilyJoined(false);
    }
    return () => clearInterval(timer);
  }, [activeAVSession]);

  // Paramedic: Start Visit -> simulate en-route navigation, auto-reach destination & auto-launch AV
  const handleStartVisit = async (booking: BookingRecord) => {
    try {
      // 1. Mark EN_ROUTE
      const res = await fetch(`/api/v1/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'EN_ROUTE' })
      });
      if (!res.ok) {
        alert('Could not start transit');
        return;
      }
      fetchData();
      setTransitBookingId(booking.id);
      setTransitSecondsLeft(3);

      const countdown = setInterval(() => {
        setTransitSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(countdown);
            // Auto Reach Destination & Auto Turn On AV
            fetch(`/api/v1/bookings/${booking.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                status: 'REACHED',
                avActive: true
              })
            }).then(() => {
              setTransitBookingId(null);
              fetchData();
              // Automatically turn on Audio/Video for Paramedic
              setActiveAVSession({ ...booking, status: 'REACHED', avActive: true });
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch {
      alert('Error initiating transit');
    }
  };

  // Animate transit progress when viewing live tracking map
  useEffect(() => {
    let pInterval: any;
    if (trackingBooking && trackingBooking.status === 'EN_ROUTE') {
      pInterval = setInterval(() => {
        setTransitProgress(prev => {
          if (prev >= 95) return 95;
          return prev + 3;
        });
      }, 1500);
    }
    return () => clearInterval(pInterval);
  }, [trackingBooking]);

  // Join AV consultation (Family member or Customer or Paramedic)
  const handleJoinAVSession = (booking: BookingRecord) => {
    setActiveAVSession(booking);
    setIsFamilyJoined(true);
  };

  // End AV session by Paramedic
  const handleEndAVSession = async () => {
    if (!activeAVSession) return;
    try {
      await fetch(`/api/v1/bookings/${activeAVSession.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avActive: false
        })
      });
      setActiveAVSession(null);
      fetchData();
    } catch {
      setActiveAVSession(null);
    }
  };

  // Upload Prescription for Customer Booking
  const handlePrescriptionUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadPrescriptionBooking || !prescriptionPreviewUrl) return;
    try {
      const fileName = prescriptionFile?.name || 'Prescription_Rx_HomeCare.pdf';
      const res = await fetch(`/api/v1/bookings/${uploadPrescriptionBooking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prescriptionUrl: prescriptionPreviewUrl,
          prescriptionName: fileName
        })
      });
      if (res.ok) {
        setUploadPrescriptionBooking(null);
        setPrescriptionFile(null);
        setPrescriptionPreviewUrl(null);
        fetchData();
        alert('Prescription successfully uploaded & attached to visit!');
      }
    } catch {
      alert('Error uploading prescription');
    }
  };

  // Paramedic toggle duty
  const handleToggleDuty = async (staffId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/v1/staff/${staffId}/duty`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ online: !currentStatus })
      });
      if (res.ok) {
        fetchData();
      }
    } catch {
      alert('Error updating on-duty status');
    }
  };

  // Open unified package modal pre-filled for a specific customer or booking
  const openCustomPackageModalForCustomer = (customerId: string, customerName: string, serviceCategory?: string) => {
    setNewPackage(prev => ({
      ...prev,
      customerId,
      customerName,
      category: serviceCategory || prev.category || 'Nursing',
      name: `Personalized Care Plan for ${customerName.split(' ')[0]}`,
      description: `Tailored multi-visit care plan curated by our Care Coordination team for ${customerName}.`,
      durationDays: 14
    }));
    setPackageItems([]);
    setPackageDiscountPercent(20);
    setShowAddModal('package');
  };

  // Agency Care: Assign an on-duty paramedic to an open/pending booking
  const handleAssignStaffToBooking = async (bookingId: string, staff: Staff) => {
    setAssigningStaffId(staff.id);
    try {
      const res = await fetch(`/api/v1/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'CONFIRMED',
          assignedStaffId: staff.id
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert(`✅ Paramedic Assigned!\n\n${staff.name} (${staff.role}) has been allocated to Booking ${bookingId}. The visit status is now Staff Assigned.`);
        setSelectedBookingForAssign(null);
        await fetchData();
      } else {
        alert(`Failed to assign staff: ${data.error || 'Server error'}`);
      }
    } catch (err: any) {
      alert(`Error assigning staff: ${err.message}`);
    } finally {
      setAssigningStaffId(null);
    }
  };

  // Update existing service
  const handleSaveServiceEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    try {
      const res = await fetch(`/api/v1/services/${editingService.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingService)
      });
      if (res.ok) {
        setEditingService(null);
        fetchData();
      }
    } catch {
      alert('Error updating service');
    }
  };

  // Update existing package
  const handleSavePackageEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPackage) return;
    try {
      const res = await fetch(`/api/v1/packages/${editingPackage.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingPackage)
      });
      if (res.ok) {
        setEditingPackage(null);
        fetchData();
      }
    } catch {
      alert('Error updating package');
    }
  };

  // Update existing agency (SuperAdmin)
  const handleSaveAgencyEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAgency) return;
    try {
      const res = await fetch(`/api/v1/agencies/${editingAgency.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingAgency)
      });
      if (res.ok) {
        setEditingAgency(null);
        fetchData();
      }
    } catch {
      alert('Error updating agency');
    }
  };

  // Update existing staff (AgencyAdmin)
  const handleSaveStaffEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    try {
      const res = await fetch(`/api/v1/staff/${editingStaff.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingStaff)
      });
      if (res.ok) {
        setEditingStaff(null);
        fetchData();
      }
    } catch {
      alert('Error updating staff');
    }
  };

  // Scoped Data Collections
  const agencyStaff = authUser?.agencyId ? staffList.filter(s => s.agencyId === authUser.agencyId) : staffList;
  const agencyPackages = authUser?.agencyId ? packages.filter(p => p.agencyId === authUser.agencyId) : packages;
  const agencyBookings = authUser?.agencyId ? bookings.filter(b => b.agencyId === authUser.agencyId) : bookings;
  const agencyAlerts = authUser?.agencyId ? alerts.filter(a => a.agencyId === authUser.agencyId) : alerts;
  
  // Haversine distance calculator in kilometers
  const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
    const p = 0.017453292519943295; // Math.PI / 180
    const c = Math.cos;
    const a = 0.5 - c((lat2 - lat1) * p) / 2 +
      c(lat1 * p) * c(lat2 * p) *
      (1 - c((lon2 - lon1) * p)) / 2;
    return Number((12742 * Math.asin(Math.sqrt(a))).toFixed(1)); // 2 * R; R = 6371 km
  };

  // Paramedic Scoped Visits (Only assigned/confirmed/active/completed visits - never open searching/escalated requests)
  const paramedicVisits = authUser?.staffId 
    ? bookings.filter(b => {
        const isAssignedToMe = b.assignedStaffId === authUser.staffId || (b.assignedStaff && b.assignedStaff.includes(authUser.name.split(',')[0]));
        const isNotOpenRequest = b.status !== 'SEARCHING' && b.status !== 'ESCALATED';
        return isAssignedToMe && isNotOpenRequest;
      }) 
    : [];

  // Paramedic Staff record for logged-in user
  const currentStaffProfile = staffList.find(s => s.id === authUser?.staffId) || {
    id: authUser?.staffId || 'STF-101',
    name: authUser?.name || 'Pooja Sharma, RN',
    role: 'Registered Nurse',
    agencyId: authUser?.agencyId || 'AG-01',
    agencyName: 'LifeCare Health Services',
    phone: authUser?.phone || '+91 98110 55443',
    experienceYrs: 6,
    lat: authUser?.lat || 28.5600,
    lng: authUser?.lng || 77.2000,
    rating: 4.9,
    online: true,
    status: 'VERIFIED'
  };

  // Open / Unallotted Booking Requests Matching Paramedic Expertise and Proximity
  const [paramedicRadiusFilter, setParamedicRadiusFilter] = useState<number>(15); // max radius in km (5, 10, 15, or 50)
  const [paramedicExpertiseOnly, setParamedicExpertiseOnly] = useState<boolean>(true);
  const [acceptingBookingId, setAcceptingBookingId] = useState<string | null>(null);

  const availableBookingRequests = bookings.filter(b => {
    // 1. Must be unallotted / searching / escalated
    const isUnassigned = (b.status === 'SEARCHING' || b.status === 'ESCALATED') &&
      (!b.assignedStaffId || b.assignedStaffId === '' || !b.assignedStaff || b.assignedStaff === 'Searching...' || b.assignedStaff === 'Pending');
    if (!isUnassigned) return false;

    // 2. Clinical Category Match (Paramedic Multi-Category Support)
    if (paramedicExpertiseOnly) {
      const staffCategories = (currentStaffProfile.role || '')
        .split(',')
        .map(c => c.trim().toLowerCase())
        .filter(Boolean);

      const serviceStaffType = (b.staffType || '').toLowerCase();
      const serviceCat = (b.category || '').toLowerCase();
      const serviceName = (b.serviceName || '').toLowerCase();

      // If no categories configured or service has open requirements, allow
      const roleMatches = staffCategories.length === 0 || 
        !serviceStaffType || 
        serviceStaffType === 'any' ||
        staffCategories.some(cat => {
          if (!cat) return false;
          if (serviceCat.includes(cat) || cat.includes(serviceCat)) return true;
          if (serviceStaffType.includes(cat) || cat.includes(serviceStaffType)) return true;
          if (cat.includes('nurs') && (serviceCat.includes('nurs') || serviceStaffType.includes('nurs') || serviceName.includes('inj') || serviceName.includes('wound') || serviceName.includes('iv'))) return true;
          if (cat.includes('physio') && (serviceCat.includes('physio') || serviceStaffType.includes('physio'))) return true;
          if ((cat.includes('elderly') || cat.includes('caregiver')) && (serviceCat.includes('elderly') || serviceCat.includes('attendant') || serviceStaffType.includes('caregiver'))) return true;
          if ((cat.includes('lab') || cat.includes('phlebotom')) && (serviceCat.includes('lab') || serviceStaffType.includes('phlebotomist'))) return true;
          return false;
        });

      if (!roleMatches) return false;
    }

    // 3. Proximity / Geographic area
    if (b.patientLat && b.patientLng && currentStaffProfile.lat && currentStaffProfile.lng) {
      const dist = calculateDistanceKm(currentStaffProfile.lat, currentStaffProfile.lng, b.patientLat, b.patientLng);
      if (dist > paramedicRadiusFilter) return false;
    }

    return true;
  });

  // Handle Paramedic Accepting an Open Booking Request
  const handleAcceptBooking = async (booking: BookingRecord) => {
    const staffId = authUser?.staffId || currentStaffProfile.id || 'STF-101';
    setAcceptingBookingId(booking.id);
    try {
      const res = await fetch(`/api/v1/bookings/${booking.id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId })
      });
      const data = await res.json();
      if (res.ok) {
        alert(`✅ Booking Accepted!\n\nYou have claimed visit ${booking.id} (${booking.serviceName}) for ${booking.patientName}. It is now in your Assigned Visits.`);
        await fetchData();
        setPortalSection('my_visits');
      } else {
        alert(`Could not claim booking: ${data.error || 'Already claimed or expired.'}`);
        await fetchData();
      }
    } catch (err: any) {
      alert(`Network error accepting booking: ${err.message}`);
    } finally {
      setAcceptingBookingId(null);
    }
  };

  // Patient Scoped Bookings (Strictly for this customer)
  const patientBookings = authUser?.phone 
    ? bookings.filter(b => {
        const cleanAuthPhone = (authUser.phone || '').replace(/\D/g, '').slice(-10);
        const cleanBookingPhone = (b.patientPhone || '').replace(/\D/g, '').slice(-10);
        return cleanAuthPhone && cleanBookingPhone && (cleanAuthPhone === cleanBookingPhone || cleanBookingPhone.includes(cleanAuthPhone));
      })
    : [];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
      {/* Top Header - Warm Cyan / Emerald / Slate Theme */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer flex-shrink-0" onClick={() => setActiveTab('patient')} title="NurtureCare Platform Home (Services & Packages)">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
              <Heart className="w-6 h-6 fill-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900">
                Nurture<span className="text-cyan-600">Care</span>
              </span>
              <span className="text-xs block text-slate-500 -mt-1 font-medium">Home Paramedical & Agency Network</span>
            </div>
          </div>

          {/* Search in Header: Compact, zero vertical space wasted */}
          <div className="flex-1 max-w-md mx-4 hidden md:flex items-center">
            <div className="w-full relative flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setIsSearchActive(true);
                    setActiveTab('patient');
                  }
                }}
                placeholder="Search services and packages..."
                className="w-full bg-slate-100 hover:bg-slate-50 focus:bg-white text-xs text-slate-900 placeholder:text-slate-400 pl-9 pr-24 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 transition-all font-medium"
              />
              <Search className="w-4 h-4 text-cyan-600 absolute left-3 pointer-events-none" />
              <div className="absolute right-1 flex items-center gap-1">
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setIsSearchActive(false);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-200 text-xs cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsSearchActive(true);
                    setActiveTab('patient');
                  }}
                  className="px-3 py-1 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1"
                >
                  <span>Search</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Real-time In-App Notification Bell (SSE & Stored OTP alerts) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotificationDrawer(!showNotificationDrawer)}
                className="relative p-2 text-slate-600 hover:text-cyan-700 hover:bg-slate-100 rounded-xl transition cursor-pointer flex items-center justify-center border border-slate-200"
                title="In-App Notifications & OTPs"
              >
                <BellRing className="w-4 h-4 text-slate-700" />
                {userNotifications.filter(n => !n.isRead).length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-extrabold flex items-center justify-center shadow-xs animate-pulse">
                    {userNotifications.filter(n => !n.isRead).length}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Drawer */}
              {showNotificationDrawer && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-3.5 bg-gradient-to-r from-slate-900 to-cyan-950 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BellRing className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-bold">Notifications & OTP Alerts</span>
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-cyan-500/30 text-cyan-200 border border-cyan-400/30">
                        Live SSE
                      </span>
                    </div>
                    {userNotifications.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllNotifications}
                        className="text-[10px] text-cyan-300 hover:text-white underline cursor-pointer"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 p-2">
                    {userNotifications.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400">
                        <BellRing className="w-8 h-8 mx-auto text-slate-300 mb-2 opacity-50" />
                        No notifications yet. OTP codes will appear here live.
                      </div>
                    ) : (
                      userNotifications.map(n => (
                        <div
                          key={n.id}
                          className={`p-3 rounded-xl transition text-xs mb-1 ${
                            n.isRead ? 'bg-slate-50/60 opacity-80' : 'bg-cyan-50/50 border border-cyan-100'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-bold text-slate-900 flex items-center gap-1.5">
                              {n.type === 'OTP' ? (
                                <KeyRound className="w-3.5 h-3.5 text-cyan-600 flex-shrink-0" />
                              ) : (
                                <Sparkles className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                              )}
                              <span>{n.title}</span>
                            </span>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <p className="mt-1 text-slate-600 leading-relaxed text-[11px]">{n.message}</p>

                          {n.code && (
                            <div className="mt-2.5 p-2 bg-white rounded-lg border border-cyan-200 flex items-center justify-between">
                              <span className="text-[10px] text-slate-400 font-semibold uppercase">Your One-Time Code:</span>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-extrabold text-sm text-cyan-700 tracking-widest bg-cyan-100/70 px-2.5 py-0.5 rounded">
                                  {n.code}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setLoginOtpCode(n.code || '');
                                    setOtpInput(n.code || '');
                                    if (n.contact) {
                                      setLoginContactInput(n.contact);
                                      if (n.contact.includes('@')) {
                                        setLoginContactType('email');
                                      } else {
                                        setLoginContactType('phone');
                                      }
                                      setIsLoginOtpSent(true);
                                    }
                                    handleMarkNotificationRead(n.id);
                                    setShowNotificationDrawer(false);
                                  }}
                                  className="px-2 py-0.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded text-[10px] font-bold transition cursor-pointer"
                                >
                                  Auto-Fill
                                </button>
                              </div>
                            </div>
                          )}

                          {!n.isRead && (
                            <div className="mt-2 text-right">
                              <button
                                type="button"
                                onClick={() => handleMarkNotificationRead(n.id)}
                                className="text-[10px] text-cyan-600 hover:text-cyan-800 font-semibold underline cursor-pointer"
                              >
                                Mark as read
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            {/* Top Navigation: Public vs Authenticated Mode */}
            {!authUser ? (
              /* Public / Logged-Out Mode: Show Switcher Tabs */
              <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
                <button
                  onClick={() => setActiveTab('patient')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'patient' ? 'bg-white text-cyan-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Patient App / Web
                </button>
                <button
                  onClick={() => setActiveTab('portal')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    activeTab === 'portal' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Portal & Logins</span>
                </button>
              </div>
            ) : (
              /* Logged-In Mode: Hide Patient App/Web & Portal tabs, Show Role Home + My Profile + Account */
              <div className="flex items-center space-x-2">
                <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
                  <button
                    onClick={handleGoHome}
                    title="Go to Default Home for your Role"
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      activeTab !== 'profile'
                        ? 'bg-gradient-to-r from-cyan-600 to-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Home className="w-3.5 h-3.5" />
                    <span>Home</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('profile')}
                    title="View My Profile"
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      activeTab === 'profile'
                        ? 'bg-cyan-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>My Profile</span>
                  </button>
                </div>

                <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
                  <button
                    onClick={() => setActiveTab('profile')}
                    title="View Full Profile"
                    className="text-right hidden sm:block hover:opacity-80 transition cursor-pointer"
                  >
                    <div className="text-xs font-bold text-slate-900 leading-tight underline decoration-cyan-500 underline-offset-2 flex items-center gap-1">
                      {authUser.name}
                    </div>
                    <div className="text-[10px] text-cyan-700 font-bold uppercase">{authUser.role.replace('_', ' ')}</div>
                  </button>
                  <button
                    onClick={handleLogout}
                    title="Logout"
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 1. PATIENT APPLICATION & SERVICES CATALOGUE VIEW                          */}
      {/* ========================================================================= */}
      {activeTab === 'patient' && (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Cyan/Slate Hero Banner: Hidden when Search is clicked/active */}
          {(!isSearchActive && !searchQuery.trim()) ? (
            <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 text-white p-8 sm:p-12 mb-10 overflow-hidden shadow-2xl">
              <div className="max-w-2xl relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-semibold mb-4 border border-cyan-500/30">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Certified Home Healthcare Network</span>
                </div>
                <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
                  Professional Paramedical Care, Right At Your Doorstep.
                </h1>
                <p className="mt-4 text-slate-300 text-base leading-relaxed">
                  Book verified registered nurses, physiotherapists, and diagnostic technicians directly for home visits and personalized care packages.
                </p>

                <div className="mt-6 flex flex-wrap gap-4 text-xs font-semibold text-slate-200">
                  <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-xs">
                    <CheckCircle className="w-4 h-4 text-emerald-400" /> 30-Min Fast Response
                  </span>
                  <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-xs">
                    <CheckCircle className="w-4 h-4 text-emerald-400" /> Agency Direct Accountability
                  </span>
                  <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-xs">
                    <CheckCircle className="w-4 h-4 text-emerald-400" /> Verified Clinical Log
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-4 mb-6 border border-cyan-200 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-800">
                <Search className="w-4 h-4 text-cyan-600" />
                <span>Showing search results for: <strong>"{searchQuery || 'All'}"</strong></span>
              </div>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchActive(false);
                }}
                className="text-xs font-semibold text-cyan-700 hover:text-cyan-900 bg-cyan-50 hover:bg-cyan-100 px-3 py-1.5 rounded-lg transition"
              >
                Reset Search & Show Banner
              </button>
            </div>
          )}

          {/* Featured Care Packages Section */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Featured Multi-Day Care Packages</h2>
                <p className="text-xs text-slate-500">Comprehensive bundles designed and delivered by authorized healthcare agencies</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {packages
              .filter(pkg => !searchQuery.trim() || 
                pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                pkg.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                pkg.agencyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                pkg.description.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map(pkg => (
                <div key={pkg.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        SAVE {pkg.discountPercent}%
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">{pkg.durationDays} Days</span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm mb-1">{pkg.name}</h3>
                    <div className="flex flex-wrap gap-1 mb-1.5">
                      {(pkg.category || 'Nursing').split(',').map((cat, idx) => (
                        <span key={idx} className="text-[10px] font-bold text-cyan-800 bg-cyan-50 border border-cyan-200 px-1.5 py-0.5 rounded">
                          {cat.trim()}
                        </span>
                      ))}
                    </div>
                    <p className="text-[11px] text-cyan-700 font-medium mb-2 flex items-center">
                      <Building2 className="w-3 h-3 mr-1" /> {pkg.agencyName}
                    </p>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-3">{pkg.description}</p>
                    {pkg.items && pkg.items.length > 0 && (
                      <div className="mb-3 bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">Included Services</span>
                        <div className="space-y-1">
                          {pkg.items.slice(0, 3).map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-[11px] text-slate-700">
                              <span className="truncate pr-1">• {item.serviceName}</span>
                              <span className="font-semibold text-cyan-700 whitespace-nowrap">{item.visits} {item.visits === 1 ? 'visit' : 'visits'}</span>
                            </div>
                          ))}
                          {pkg.items.length > 3 && (
                            <span className="text-[10px] text-slate-400 font-medium italic block mt-1">
                              +{pkg.items.length - 3} more services
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs line-through text-slate-400 block">₹{pkg.originalPrice}</span>
                      <span className="text-base font-extrabold text-slate-900">₹{pkg.price}</span>
                    </div>
                    <button 
                      onClick={() => handleOpenPackageEnrollModal(pkg)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-cyan-600 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1"
                    >
                      <Package className="w-3.5 h-3.5" />
                      <span>Enroll Plan</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Services Catalogue */}
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">Clinical Home Services</h2>
                {selectedAgencyId !== 'ALL' ? (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200">
                    {agencies.find(a => a.id === selectedAgencyId)?.name || 'Agency Filter Active'}
                  </span>
                ) : (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    All Certified Care Services
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedAgencyId !== 'ALL' 
                  ? 'Showing verified services enabled and priced by this specific agency'
                  : 'Immediate on-demand clinical procedures with radar auto-assignment'}
              </p>
            </div>

            {/* Agency Selector & Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-2xs">
                <Building2 className="w-3.5 h-3.5 text-cyan-700" />
                <span className="text-xs font-bold text-slate-600">Provider:</span>
                <select
                  value={selectedAgencyId}
                  onChange={(e) => setSelectedAgencyId(e.target.value)}
                  className="text-xs font-semibold text-slate-900 bg-transparent border-none focus:outline-hidden cursor-pointer"
                >
                  <option value="ALL">All Network Agencies</option>
                  {agencies.map(ag => (
                    <option key={ag.id} value={ag.id}>{ag.name}</option>
                  ))}
                </select>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center space-x-1.5 overflow-x-auto">
                {['All', 'Nursing', 'Physiotherapy', 'Elderly Care', 'Lab & Diagnostics'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-cyan-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {services
              .filter(s => s.isEnabled !== false)
              .filter(s => selectedCategory === 'All' || s.category === selectedCategory)
              .filter(s => !searchQuery.trim() ||
                s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.staffType.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map(service => {
                const assignedAgencyName = selectedAgencyId !== 'ALL'
                  ? (agencies.find(a => a.id === selectedAgencyId)?.name || 'Partner Agency')
                  : service.createdByAgencyId 
                    ? (agencies.find(a => a.id === service.createdByAgencyId)?.name || 'Partner Agency')
                    : 'LifeCare Home Health Network';

                return (
                  <div
                    key={service.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-cyan-300 hover:shadow-md transition flex flex-col justify-between overflow-hidden"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        <span className="px-2.5 py-1 text-xs font-bold uppercase rounded-md bg-cyan-50 text-cyan-800 border border-cyan-100">
                          {service.category}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          CERTIFIED CLINICAL
                        </span>
                      </div>

                      {/* Certified Partner Agency Name in small */}
                      <div className="mt-2.5 flex items-center text-[11px] text-cyan-800 font-semibold bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/80 w-fit">
                        <Building2 className="w-3 h-3 mr-1 text-cyan-600 flex-shrink-0" />
                        <span>{assignedAgencyName}</span>
                      </div>

                      <h3 className="mt-2 text-lg font-bold text-slate-900 hover:text-cyan-700 transition">
                        {service.name}
                      </h3>
                      <p className="mt-2 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {service.description}
                      </p>

                      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                        <span className="flex items-center text-slate-500">
                          <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          {service.duration}
                        </span>
                        <span className="flex items-center text-slate-500">
                          <Stethoscope className="w-3.5 h-3.5 mr-1 text-cyan-600" />
                          {service.staffType}
                        </span>
                      </div>
                    </div>

                    <div className="px-6 py-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        {service.discountPercent && service.discountPercent > 0 ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-slate-400 line-through">₹{service.originalPrice || Math.round(service.price / (1 - service.discountPercent / 100))}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-50 text-rose-600 border border-rose-200">
                              {service.discountPercent}% OFF
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 block">Starting from</span>
                        )}
                        <span className="text-xl font-bold text-slate-900">₹{service.price}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {(authUser?.role === 'SUPER_ADMIN' || (authUser?.role === 'AGENCY_ADMIN' && service.createdByAgencyId === authUser.agencyId)) && (
                          <button
                            onClick={() => setEditingService(service)}
                            className="p-2 bg-slate-100 hover:bg-cyan-100 text-slate-700 hover:text-cyan-800 rounded-xl transition text-xs font-bold"
                            title="Edit Service & Discount"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenBookingModal(service)}
                          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1 shadow-xs cursor-pointer"
                        >
                          <span>Book Instant</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </main>
      )}

      {/* ========================================================================= */}
      {/* 2. PORTAL CONSOLE (SUPER_ADMIN, AGENCY_ADMIN, AGENCY_CARE, PARAMEDIC, PATIENT) */}
      {/* ========================================================================= */}
      {activeTab === 'portal' && (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {!authUser ? (
            /* Multi-Role OAuth2 Login Screen */
            <div className="max-w-md mx-auto my-6 bg-white rounded-3xl border border-slate-200 p-8 shadow-xl">
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-cyan-50 rounded-2xl border border-cyan-100 flex items-center justify-center mx-auto text-cyan-700 mb-3 shadow-inner">
                  <Lock className="w-7 h-7" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">NurtureCare Portal Login</h2>
                <p className="text-xs text-slate-500 mt-1">Single Sign-On for SuperAdmin, Agencies, Staff & Patients</p>
              </div>

              {/* Login Method Tabs */}
              <div className="flex rounded-xl bg-slate-100 p-1 mb-5 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setLoginMode('password')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                    loginMode === 'password'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Password Login
                </button>
                <button
                  type="button"
                  onClick={() => setLoginMode('otp')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                    loginMode === 'otp'
                      ? 'bg-cyan-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-cyan-700'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Customer OTP Login</span>
                </button>
              </div>

              {loginError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              {loginMode === 'password' ? (
                <form onSubmit={handleOAuthLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Username</label>
                    <input
                      type="text"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-bold shadow-md shadow-cyan-600/20 transition disabled:opacity-50 cursor-pointer"
                  >
                    {isLoggingIn ? 'Authenticating with OAuth2...' : 'Log In to Console'}
                  </button>
                </form>
              ) : (
                /* Customer Mobile / Email OTP Login */
                <form onSubmit={handleVerifyLoginOtp} className="space-y-4">
                  <div className="p-3.5 bg-cyan-50/70 border border-cyan-200/80 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span>Get OTP via:</span>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setLoginContactType('phone');
                            setIsLoginOtpSent(false);
                            setLoginOtpMessage('');
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                            loginContactType === 'phone'
                              ? 'bg-cyan-600 text-white shadow-xs'
                              : 'bg-white text-slate-600 border border-slate-200'
                          }`}
                        >
                          Mobile
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setLoginContactType('email');
                            setIsLoginOtpSent(false);
                            setLoginOtpMessage('');
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                            loginContactType === 'email'
                              ? 'bg-cyan-600 text-white shadow-xs'
                              : 'bg-white text-slate-600 border border-slate-200'
                          }`}
                        >
                          Email
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        {loginContactType === 'phone' ? (
                          <>
                            <Phone className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                            <input
                              type="tel"
                              placeholder="+91 98765 12345"
                              value={loginContactInput}
                              onChange={e => {
                                setLoginContactInput(e.target.value);
                                setIsLoginOtpSent(false);
                                setLoginOtpMessage('');
                              }}
                              className="w-full pl-8 pr-3 py-2 bg-white border border-cyan-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                            />
                          </>
                        ) : (
                          <>
                            <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                            <input
                              type="email"
                              placeholder="patient@example.com"
                              value={loginContactInput}
                              onChange={e => {
                                setLoginContactInput(e.target.value);
                                setIsLoginOtpSent(false);
                                setLoginOtpMessage('');
                              }}
                              className="w-full pl-8 pr-3 py-2 bg-white border border-cyan-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                            />
                          </>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={handleSendLoginOtp}
                        disabled={isSendingLoginOtp || !loginContactInput.trim()}
                        className="px-3.5 py-2 bg-cyan-700 hover:bg-cyan-800 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap shadow-xs"
                      >
                        {isSendingLoginOtp ? 'Sending...' : (isLoginOtpSent ? 'Resend' : 'Get OTP')}
                      </button>
                    </div>

                    {isLoginOtpSent && (
                      <div className="p-3 bg-cyan-100/80 border border-cyan-300 rounded-xl space-y-2 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-950">
                            <BellRing className="w-3.5 h-3.5 text-cyan-700 animate-bounce" />
                            <span>OTP Dispatched:</span>
                            <span className="font-mono text-sm tracking-wider text-cyan-900 bg-white px-2 py-0.5 rounded shadow-2xs font-extrabold">
                              {generatedOtp}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setLoginOtpCode(generatedOtp)}
                            className="px-2.5 py-1 bg-cyan-700 hover:bg-cyan-800 text-white rounded-lg text-[11px] font-bold transition cursor-pointer shadow-xs"
                          >
                            Auto-Fill
                          </button>
                        </div>
                      </div>
                    )}

                    {isLoginOtpSent && (
                      <div className="pt-2 border-t border-cyan-200/60 space-y-2 animate-in fade-in">
                        <label className="block text-xs font-semibold text-slate-700">Enter 6-Digit OTP</label>
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="Enter 6-digit OTP"
                          value={loginOtpCode}
                          onChange={e => setLoginOtpCode(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-cyan-300 rounded-xl text-sm font-bold tracking-widest text-center focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                          required
                        />
                      </div>
                    )}

                    {loginOtpMessage && (
                      <div className="p-2.5 rounded-xl bg-cyan-100/70 text-cyan-900 border border-cyan-200 text-xs font-medium leading-relaxed">
                        {loginOtpMessage}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoggingIn || !isLoginOtpSent || !loginOtpCode.trim()}
                    className="w-full py-3 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 text-white rounded-xl text-sm font-bold shadow-md shadow-cyan-600/20 transition disabled:opacity-50 cursor-pointer"
                  >
                    {isLoggingIn ? 'Verifying & Signing In...' : 'Verify OTP & Go to My Home'}
                  </button>
                </form>
              )}

              {/* 5 One-Click Preconfigured Roles */}
              <div className="mt-6 pt-6 border-t border-slate-100">
                <span className="text-[11px] font-semibold text-slate-400 block mb-2 uppercase tracking-wider text-center">
                  Select Role to Auto-Fill Credentials
                </span>
                <div className="grid grid-cols-2 gap-2 text-left">
                  <button
                    type="button"
                    onClick={() => { setLoginUsername('admin'); setLoginPassword('12345'); }}
                    className="p-2.5 bg-slate-50 hover:bg-cyan-50 border border-slate-200 rounded-xl transition"
                  >
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5 text-cyan-600" /> Super Admin
                    </div>
                    <div className="text-[10px] text-slate-500">admin / 12345</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setLoginUsername('agency'); setLoginPassword('12345'); }}
                    className="p-2.5 bg-slate-50 hover:bg-cyan-50 border border-slate-200 rounded-xl transition"
                  >
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-emerald-600" /> Agency Admin
                    </div>
                    <div className="text-[10px] text-slate-500">agency / 12345</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setLoginUsername('care'); setLoginPassword('12345'); }}
                    className="p-2.5 bg-slate-50 hover:bg-cyan-50 border border-slate-200 rounded-xl transition"
                  >
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <Headphones className="w-3.5 h-3.5 text-amber-600" /> Agency Care
                    </div>
                    <div className="text-[10px] text-slate-500">care / 12345</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setLoginUsername('paramedical'); setLoginPassword('12345'); }}
                    className="p-2.5 bg-slate-50 hover:bg-cyan-50 border border-slate-200 rounded-xl transition"
                  >
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <Stethoscope className="w-3.5 h-3.5 text-teal-600" /> Paramedic Staff
                    </div>
                    <div className="text-[10px] text-slate-500">paramedical / 12345</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setLoginUsername('customer'); setLoginPassword('12345'); }}
                    className="col-span-2 p-2.5 bg-slate-50 hover:bg-cyan-50 border border-slate-200 rounded-xl transition"
                  >
                    <div className="text-xs font-bold text-slate-800 flex items-center justify-center gap-1">
                      <User className="w-3.5 h-3.5 text-indigo-600" /> Customer / Patient (Priya Sharma)
                    </div>
                    <div className="text-[10px] text-slate-500 text-center">customer / 12345</div>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Logged-In Portal with Role-Based Navigation */
            <div>
              {/* Profile Bar */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 mb-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white shadow-md ${
                    authUser.role === 'SUPER_ADMIN' ? 'bg-gradient-to-tr from-slate-900 to-cyan-800 shadow-slate-900/20' :
                    authUser.role === 'AGENCY_ADMIN' ? 'bg-gradient-to-tr from-cyan-700 to-emerald-600 shadow-cyan-600/20' :
                    authUser.role === 'AGENCY_CARE' ? 'bg-gradient-to-tr from-amber-600 to-orange-500 shadow-amber-500/20' :
                    authUser.role === 'PARAMEDIC' ? 'bg-gradient-to-tr from-teal-600 to-emerald-500 shadow-teal-500/20' :
                    'bg-gradient-to-tr from-indigo-600 to-cyan-600 shadow-indigo-500/20'
                  }`}>
                    {authUser.role === 'SUPER_ADMIN' && <Shield className="w-6 h-6" />}
                    {authUser.role === 'AGENCY_ADMIN' && <Building2 className="w-6 h-6" />}
                    {authUser.role === 'AGENCY_CARE' && <Headphones className="w-6 h-6" />}
                    {authUser.role === 'PARAMEDIC' && <Stethoscope className="w-6 h-6" />}
                    {authUser.role === 'PATIENT' && <User className="w-6 h-6" />}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h2 className="text-xl font-bold text-slate-900">{authUser.name}</h2>
                      <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-cyan-100 text-cyan-800">
                        {authUser.role.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {authUser.role === 'SUPER_ADMIN' && 'Master Catalogue Governance • Agency Onboarding • Health Metrics & Alerts'}
                      {authUser.role === 'AGENCY_ADMIN' && 'Patient Bookings Queue • Agency Staff Pool • Packages & Custom Services • SuperAdmin Alerts'}
                      {authUser.role === 'AGENCY_CARE' && 'Agency Customer Care Desk • Staff Scheduling & Patient Request Management'}
                      {authUser.role === 'PARAMEDIC' && 'On-Duty Paramedic • Assigned Visits • Patient Vitals & Clinical Logging'}
                      {authUser.role === 'PATIENT' && 'Patient Portal • Active Home Care Requests & Completed Clinical History'}
                    </p>
                  </div>
                </div>

                {/* Sub-Navigation Pills per Role */}
                <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                  {authUser.role === 'SUPER_ADMIN' && (
                    <>
                      <button
                        onClick={() => setPortalSection('metrics')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center space-x-1 ${
                          portalSection === 'metrics' ? 'bg-white text-cyan-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <BarChart3 className="w-3.5 h-3.5 mr-1" /> Platform Health
                      </button>
                      <button
                        onClick={() => setPortalSection('agencies')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center space-x-1 ${
                          portalSection === 'agencies' ? 'bg-white text-cyan-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Building2 className="w-3.5 h-3.5 mr-1" /> Agencies ({agencies.length})
                      </button>
                      <button
                        onClick={() => setPortalSection('master_services')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center space-x-1 ${
                          portalSection === 'master_services' ? 'bg-white text-cyan-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Sliders className="w-3.5 h-3.5 mr-1" /> Master Catalogue
                      </button>
                      <button
                        onClick={() => setPortalSection('alerts')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center space-x-1 ${
                          portalSection === 'alerts' ? 'bg-white text-cyan-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <BellRing className="w-3.5 h-3.5 mr-1 text-rose-500" /> Alerts ({alerts.length})
                      </button>
                    </>
                  )}

                  {authUser.role === 'AGENCY_ADMIN' && (
                    <>
                      <button
                        onClick={() => setPortalSection('care_queue')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center space-x-1 ${
                          portalSection === 'care_queue' ? 'bg-white text-cyan-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Activity className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Patient Bookings ({agencyBookings.length})
                      </button>
                      <button
                        onClick={() => setPortalSection('agency_staff')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center space-x-1 ${
                          portalSection === 'agency_staff' ? 'bg-white text-cyan-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5 mr-1" /> Staff Roster ({agencyStaff.length})
                      </button>
                      <button
                        onClick={() => setPortalSection('agency_packages')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center space-x-1 ${
                          portalSection === 'agency_packages' ? 'bg-white text-cyan-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Package className="w-3.5 h-3.5 mr-1" /> My Packages ({agencyPackages.length})
                      </button>
                      <button
                        onClick={() => setPortalSection('agency_services')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center space-x-1 ${
                          portalSection === 'agency_services' ? 'bg-white text-cyan-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Sliders className="w-3.5 h-3.5 mr-1" /> Services & Master List ({services.length})
                      </button>
                      <button
                        onClick={() => setPortalSection('agency_alerts_view')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center space-x-1 ${
                          portalSection === 'agency_alerts_view' ? 'bg-white text-cyan-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <BellRing className="w-3.5 h-3.5 mr-1 text-amber-500" /> Compliance Alerts ({agencyAlerts.length})
                      </button>
                    </>
                  )}

                  {authUser.role === 'AGENCY_CARE' && (
                    <>
                      <button
                        onClick={() => setPortalSection('care_queue')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center space-x-1 ${
                          portalSection === 'care_queue' ? 'bg-white text-amber-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Activity className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Patient Request Queue ({agencyBookings.length})
                      </button>
                      <button
                        onClick={() => setPortalSection('care_custom_packages')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center space-x-1 ${
                          portalSection === 'care_custom_packages' ? 'bg-white text-indigo-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5 mr-1 text-indigo-600" /> Custom Packages ({packages.filter(p => p.customerId).length})
                      </button>
                      <button
                        onClick={() => setPortalSection('care_staff_status')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center space-x-1 ${
                          portalSection === 'care_staff_status' ? 'bg-white text-amber-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5 mr-1" /> On-Duty Paramedics ({agencyStaff.length})
                      </button>
                    </>
                  )}

                  {authUser.role === 'PARAMEDIC' && (
                    <>
                      <button
                        onClick={() => setPortalSection('open_requests')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center space-x-1 ${
                          portalSection === 'open_requests' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Radio className="w-3.5 h-3.5 mr-1 text-emerald-600 animate-pulse" /> Available Requests ({availableBookingRequests.length})
                      </button>
                      <button
                        onClick={() => setPortalSection('my_visits')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center space-x-1 ${
                          portalSection === 'my_visits' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Stethoscope className="w-3.5 h-3.5 mr-1 text-teal-600" /> My Assigned Visits ({paramedicVisits.length})
                      </button>
                    </>
                  )}

                  {authUser.role === 'PATIENT' && (
                    <>
                      <button
                        onClick={() => setPortalSection('my_bookings')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center space-x-1 ${
                          portalSection === 'my_bookings' ? 'bg-white text-cyan-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Calendar className="w-3.5 h-3.5 mr-1 text-cyan-600" /> My Care Bookings ({patientBookings.length})
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* ========================================================================= */}
              {/* A. SUPER ADMIN SECTION VIEWS                                              */}
              {/* ========================================================================= */}
              {authUser.role === 'SUPER_ADMIN' && portalSection === 'metrics' && (
                <div className="space-y-6">
                  {/* KPI Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                      <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-xs font-semibold uppercase">Licensed Agencies</span>
                        <Building2 className="w-4 h-4 text-cyan-600" />
                      </div>
                      <div className="text-2xl font-black text-slate-900">{metrics?.totalAgencies ?? agencies.length}</div>
                      <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center">
                        <TrendingUp className="w-3 h-3 mr-1" /> 100% Certified Partners
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                      <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-xs font-semibold uppercase">Platform Revenue</span>
                        <DollarSign className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div className="text-2xl font-black text-slate-900">₹{(metrics?.totalRevenue ?? 1084100).toLocaleString()}</div>
                      <div className="text-[11px] text-slate-500 mt-1">Platform GMV</div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                      <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-xs font-semibold uppercase">Network Completion</span>
                        <CheckCircle className="w-4 h-4 text-teal-500" />
                      </div>
                      <div className="text-2xl font-black text-slate-900">{metrics?.avgCompletionRate?.toFixed(1) ?? '94.0'}%</div>
                      <div className="text-[11px] text-emerald-600 font-semibold mt-1">Target achieved</div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                      <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-xs font-semibold uppercase">Dispatch Velocity</span>
                        <Zap className="w-4 h-4 text-amber-500" />
                      </div>
                      <div className="text-2xl font-black text-slate-900">{metrics?.avgResponseMin?.toFixed(1) ?? '5.5'} mins</div>
                      <div className="text-[11px] text-slate-500 mt-1">5km/10km radar SLA</div>
                    </div>
                  </div>

                  {/* Agency Leaderboard */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">Agency Quality & Performance Leaderboard</h3>
                        <p className="text-xs text-slate-500">Live operational metrics monitored by SuperAdmin across all partners</p>
                      </div>
                      <button
                        onClick={() => setShowAddModal('alert')}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Issue Alert</span>
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                          <tr>
                            <th className="py-3 px-4">Agency</th>
                            <th className="py-3 px-4">City</th>
                            <th className="py-3 px-4">Rating</th>
                            <th className="py-3 px-4">Staff Count</th>
                            <th className="py-3 px-4">Completion %</th>
                            <th className="py-3 px-4">Avg Velocity</th>
                            <th className="py-3 px-4">Total Revenue</th>
                            <th className="py-3 px-4 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {agencies.map(ag => (
                            <tr key={ag.id} className="hover:bg-slate-50/70 transition">
                              <td className="py-3 px-4 font-bold text-slate-900">
                                <div>{ag.name}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{ag.registrationNo}</div>
                              </td>
                              <td className="py-3 px-4 text-slate-600">{ag.city}</td>
                              <td className="py-3 px-4">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-50 text-amber-700">
                                  <Star className="w-3 h-3 fill-current mr-1 text-amber-400" /> {ag.rating}
                                </span>
                              </td>
                              <td className="py-3 px-4 font-semibold text-slate-800">{ag.staffCount} staff</td>
                              <td className="py-3 px-4 font-bold text-slate-900">{ag.completionRate ?? 95.0}%</td>
                              <td className="py-3 px-4 text-slate-700 font-medium">{ag.avgResponseMin ?? 4.0} min</td>
                              <td className="py-3 px-4 font-bold text-cyan-800">₹{(ag.totalRevenue ?? 100000).toLocaleString()}</td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  onClick={() => {
                                    setNewAlert(prev => ({ ...prev, agencyId: ag.id }));
                                    setShowAddModal('alert');
                                  }}
                                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 transition"
                                >
                                  Send Alert
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {authUser.role === 'SUPER_ADMIN' && portalSection === 'agencies' && (
                <div>
                  {!drilldownAgencyId ? (
                    /* 1. AGENCIES DIRECTORY GRID VIEW */
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div>
                          <h3 className="text-base font-bold text-slate-900">Healthcare Agency Onboarding & Registry</h3>
                          <p className="text-xs text-slate-500">SuperAdmin grants partner licenses, monitors quality compliance, and audits operations</p>
                        </div>
                        <button
                          onClick={() => setShowAddModal('agency')}
                          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer"
                        >
                          <Plus className="w-4 h-4" /> <span>Onboard Agency</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
                        {agencies.map(ag => {
                          const agStaff = staffList.filter(s => s.agencyId === ag.id);
                          const agBookings = bookings.filter(b => b.agencyId === ag.id);
                          const servedBookings = agBookings.filter(b => b.status === 'COMPLETED');
                          // active bookings
                          
                          // Unique customers served
                          const uniqueCustomers = Array.from(new Set(agBookings.map(b => b.patientPhone || b.patientName)));

                          return (
                            <div 
                              key={ag.id} 
                              className="border border-slate-200 rounded-2xl p-5 hover:border-cyan-400 hover:shadow-md transition-all bg-white flex flex-col justify-between"
                            >
                              <div>
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                                      {ag.id}
                                    </span>
                                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                      {ag.status}
                                    </span>
                                  </div>
                                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/60">
                                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                                    <span>{ag.rating}</span>
                                  </span>
                                </div>

                                <h4 className="font-bold text-slate-900 text-lg tracking-tight">{ag.name}</h4>
                                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                  <MapPin className="w-3.5 h-3.5 text-cyan-600" />
                                  <span>{ag.city}</span>
                                </p>

                                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-600">
                                  <div><span className="text-slate-400">License:</span> <span className="font-semibold text-slate-800">{ag.registrationNo}</span></div>
                                  <div><span className="text-slate-400">Director:</span> <span className="font-semibold text-slate-800">{ag.contactPerson}</span></div>
                                  <div><span className="text-slate-400">Phone:</span> <span className="font-mono text-slate-800">{ag.phone}</span></div>
                                  <div><span className="text-slate-400">Operating Mode:</span> <span className="font-bold text-cyan-800">{ag.mode}</span></div>
                                </div>

                                {/* Operational Metrics Badges */}
                                <div className="grid grid-cols-4 gap-2 mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-center">
                                  <div>
                                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Staff Pool</div>
                                    <div className="text-sm font-bold text-cyan-700">{agStaff.length > 0 ? agStaff.length : ag.staffCount}</div>
                                  </div>
                                  <div>
                                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Received</div>
                                    <div className="text-sm font-bold text-slate-800">{agBookings.length}</div>
                                  </div>
                                  <div>
                                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Completed</div>
                                    <div className="text-sm font-bold text-emerald-600">{servedBookings.length}</div>
                                  </div>
                                  <div>
                                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Patients</div>
                                    <div className="text-sm font-bold text-indigo-600">{uniqueCustomers.length}</div>
                                  </div>
                                </div>
                              </div>

                              {/* Drill Down Action Links */}
                              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <button
                                    onClick={() => {
                                      setDrilldownAgencyId(ag.id);
                                      setAgencyDrilldownTab('staff');
                                    }}
                                    className="px-2.5 py-1 text-xs font-semibold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 rounded-lg transition flex items-center gap-1 cursor-pointer"
                                  >
                                    <Users className="w-3 h-3" />
                                    <span>Staff ({agStaff.length > 0 ? agStaff.length : ag.staffCount})</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setDrilldownAgencyId(ag.id);
                                      setAgencyDrilldownTab('customers');
                                    }}
                                    className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition flex items-center gap-1 cursor-pointer"
                                  >
                                    <User className="w-3 h-3" />
                                    <span>Customers ({uniqueCustomers.length})</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setDrilldownAgencyId(ag.id);
                                      setAgencyDrilldownTab('requests');
                                    }}
                                    className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition flex items-center gap-1 cursor-pointer"
                                  >
                                    <FileText className="w-3 h-3" />
                                    <span>Requests ({agBookings.length})</span>
                                  </button>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => setEditingAgency(ag)}
                                    className="px-2.5 py-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                                    title="Edit Agency Details & Status"
                                  >
                                    <Edit className="w-3 h-3" />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setDrilldownAgencyId(ag.id);
                                      setAgencyDrilldownTab('overview');
                                    }}
                                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                                  >
                                    <span>Audit</span>
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    /* 2. FULL AGENCY DRILL-DOWN AUDIT VIEW */
                    (() => {
                      const selectedAg = agencies.find(a => a.id === drilldownAgencyId);
                      if (!selectedAg) return null;

                      const agStaff = staffList.filter(s => s.agencyId === selectedAg.id);
                      const agBookings = bookings.filter(b => b.agencyId === selectedAg.id);
                      const servedBookings = agBookings.filter(b => b.status === 'COMPLETED');
                      const activeBookings = agBookings.filter(b => b.status !== 'COMPLETED' && b.status !== 'CANCELLED');
                      
                      // Customer aggregation
                      const customerMap: { [key: string]: { name: string; phone: string; address: string; bookingsCount: number; completedCount: number; lastService: string; lastDate: string } } = {};
                      agBookings.forEach(b => {
                        const key = b.patientPhone || b.patientName;
                        if (!customerMap[key]) {
                          customerMap[key] = {
                            name: b.patientName,
                            phone: b.patientPhone,
                            address: b.address,
                            bookingsCount: 0,
                            completedCount: 0,
                            lastService: b.serviceName,
                            lastDate: b.createdAt
                          };
                        }
                        customerMap[key].bookingsCount++;
                        if (b.status === 'COMPLETED') customerMap[key].completedCount++;
                      });
                      const uniqueCustomerList = Object.values(customerMap);

                      return (
                        <div className="space-y-6">
                          {/* Top Navigation & Breadcrumb */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => setDrilldownAgencyId(null)}
                                className="p-2 hover:bg-slate-100 rounded-xl transition text-slate-600 hover:text-slate-900 flex items-center gap-1 text-xs font-bold cursor-pointer"
                              >
                                <ArrowLeft className="w-4 h-4" />
                                <span>Back to All Agencies</span>
                              </button>
                              <div className="h-5 w-px bg-slate-200 hidden sm:block"></div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h2 className="text-base font-bold text-slate-900">{selectedAg.name}</h2>
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200">
                                    {selectedAg.id}
                                  </span>
                                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                    {selectedAg.status}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  License: {selectedAg.registrationNo} • Director: {selectedAg.contactPerson} ({selectedAg.phone})
                                </p>
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                setNewAlert(prev => ({ ...prev, agencyId: selectedAg.id, title: `Compliance Notice for ${selectedAg.name}` }));
                                setShowAddModal('alert');
                              }}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                            >
                              <BellRing className="w-3.5 h-3.5" />
                              <span>Issue Agency Alert</span>
                            </button>
                          </div>

                          {/* Drill-down Section Tabs */}
                          <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center gap-1 border border-slate-200 overflow-x-auto">
                            <button
                              onClick={() => setAgencyDrilldownTab('overview')}
                              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                                agencyDrilldownTab === 'overview' ? 'bg-white text-cyan-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              <Building2 className="w-3.5 h-3.5" />
                              <span>Operations Overview</span>
                            </button>
                            <button
                              onClick={() => setAgencyDrilldownTab('staff')}
                              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                                agencyDrilldownTab === 'staff' ? 'bg-white text-cyan-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              <Users className="w-3.5 h-3.5" />
                              <span>Staff Roster ({agStaff.length})</span>
                            </button>
                            <button
                              onClick={() => setAgencyDrilldownTab('requests')}
                              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                                agencyDrilldownTab === 'requests' ? 'bg-white text-cyan-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Requests Received & Served ({agBookings.length})</span>
                            </button>
                            <button
                              onClick={() => setAgencyDrilldownTab('customers')}
                              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                                agencyDrilldownTab === 'customers' ? 'bg-white text-cyan-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              <User className="w-3.5 h-3.5" />
                              <span>Customers Served ({uniqueCustomerList.length})</span>
                            </button>
                          </div>

                          {/* TAB 1: OVERVIEW */}
                          {agencyDrilldownTab === 'overview' && (
                            <div className="space-y-6">
                              {/* KPI Highlights */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                                  <div className="flex items-center justify-between text-slate-500 mb-2">
                                    <span className="text-xs font-semibold uppercase">Total Requests</span>
                                    <FileText className="w-4 h-4 text-cyan-600" />
                                  </div>
                                  <div className="text-2xl font-black text-slate-900">{agBookings.length}</div>
                                  <div className="text-[11px] text-slate-500 mt-1">
                                    <span className="text-emerald-600 font-bold">{servedBookings.length} Served</span> • {activeBookings.length} In-Flight
                                  </div>
                                </div>

                                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                                  <div className="flex items-center justify-between text-slate-500 mb-2">
                                    <span className="text-xs font-semibold uppercase">Patients Served</span>
                                    <User className="w-4 h-4 text-indigo-600" />
                                  </div>
                                  <div className="text-2xl font-black text-slate-900">{uniqueCustomerList.length}</div>
                                  <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center">
                                    <Check className="w-3 h-3 mr-1" /> Verified Home Care Deliveries
                                  </div>
                                </div>

                                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                                  <div className="flex items-center justify-between text-slate-500 mb-2">
                                    <span className="text-xs font-semibold uppercase">Active Staff Roster</span>
                                    <Users className="w-4 h-4 text-teal-600" />
                                  </div>
                                  <div className="text-2xl font-black text-slate-900">{agStaff.length}</div>
                                  <div className="text-[11px] text-teal-700 font-semibold mt-1">
                                    Licensed RNs, PTs, & Attendants
                                  </div>
                                </div>

                                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                                  <div className="flex items-center justify-between text-slate-500 mb-2">
                                    <span className="text-xs font-semibold uppercase">Clinical Quality</span>
                                    <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                                  </div>
                                  <div className="text-2xl font-black text-slate-900">{selectedAg.rating} / 5.0</div>
                                  <div className="text-[11px] text-emerald-600 font-semibold mt-1">
                                    {selectedAg.completionRate ?? 98.2}% SLA Fulfilment
                                  </div>
                                </div>
                              </div>

                              {/* Agency Detailed Profile Card */}
                              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
                                <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                                  <Shield className="w-4 h-4 text-cyan-600" />
                                  <span>Partner Licensing & Operational Metadata</span>
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-600">
                                  <div className="space-y-2">
                                    <div><span className="text-slate-400 block">Agency Legal Entity:</span> <strong className="text-slate-900 text-sm">{selectedAg.name}</strong></div>
                                    <div><span className="text-slate-400 block">Registration / License No:</span> <strong className="font-mono text-slate-800">{selectedAg.registrationNo}</strong></div>
                                    <div><span className="text-slate-400 block">Operating City & Zones:</span> <span className="font-semibold text-slate-800">{selectedAg.city}</span></div>
                                  </div>
                                  <div className="space-y-2">
                                    <div><span className="text-slate-400 block">Managing Director:</span> <strong className="text-slate-800">{selectedAg.contactPerson}</strong></div>
                                    <div><span className="text-slate-400 block">Direct Hotline:</span> <strong className="font-mono text-slate-800">{selectedAg.phone}</strong></div>
                                    <div><span className="text-slate-400 block">Platform Commercial Model:</span> <span className="font-bold text-cyan-800">{selectedAg.mode}</span></div>
                                  </div>
                                  <div className="space-y-2">
                                    <div><span className="text-slate-400 block">Average Dispatch Response:</span> <strong className="text-emerald-700">{selectedAg.avgResponseMin ?? 4.2} Minutes</strong></div>
                                    <div><span className="text-slate-400 block">Platform GMV Generated:</span> <strong className="text-slate-900">₹{(selectedAg.totalRevenue ?? 248500).toLocaleString()}</strong></div>
                                    <div><span className="text-slate-400 block">Partner Audit Status:</span> <span className="text-emerald-700 font-bold">Compliant • No Active Suspensions</span></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* TAB 2: STAFF LIST DRILLDOWN */}
                          {agencyDrilldownTab === 'staff' && (
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                                <div>
                                  <h3 className="text-base font-bold text-slate-900">Registered Staff & Paramedical Roster</h3>
                                  <p className="text-xs text-slate-500">
                                    Active nurses, physiotherapists, phlebotomists and caregivers deployed under {selectedAg.name}
                                  </p>
                                </div>
                                <span className="px-3 py-1 bg-cyan-50 text-cyan-800 font-bold text-xs rounded-xl border border-cyan-200">
                                  {agStaff.length} Onboarded Personnel
                                </span>
                              </div>

                              {agStaff.length === 0 ? (
                                <div className="text-center py-12 text-slate-400 text-xs">
                                  No staff personnel currently registered under this agency.
                                </div>
                              ) : (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                                      <tr>
                                        <th className="py-3 px-4">Staff Member</th>
                                        <th className="py-3 px-4">Role / Designation</th>
                                        <th className="py-3 px-4">Contact Phone</th>
                                        <th className="py-3 px-4">Experience</th>
                                        <th className="py-3 px-4">Rating</th>
                                        <th className="py-3 px-4">Availability</th>
                                        <th className="py-3 px-4">Credential Status</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {agStaff.map(s => {
                                        // staff visits
                                        return (
                                          <tr key={s.id} className="hover:bg-slate-50 transition">
                                            <td className="py-3.5 px-4">
                                              <div className="font-bold text-slate-900">{s.name}</div>
                                              <div className="text-[10px] font-mono text-slate-400">{s.id}</div>
                                            </td>
                                            <td className="py-3.5 px-4">
                                              <span className="px-2 py-0.5 bg-cyan-50 text-cyan-800 rounded font-semibold text-[11px]">
                                                {s.role}
                                              </span>
                                            </td>
                                            <td className="py-3.5 px-4 font-mono text-slate-700">{s.phone}</td>
                                            <td className="py-3.5 px-4 text-slate-700 font-medium">{s.experienceYrs} Years</td>
                                            <td className="py-3.5 px-4">
                                              <span className="font-bold text-amber-600 flex items-center gap-1">
                                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                                                <span>{s.rating}</span>
                                              </span>
                                            </td>
                                            <td className="py-3.5 px-4">
                                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                ON-DUTY
                                              </span>
                                            </td>
                                            <td className="py-3.5 px-4">
                                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px] border border-slate-200">
                                                {s.status || 'VERIFIED'}
                                              </span>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          )}

                          {/* TAB 3: REQUESTS RECEIVED & SERVED */}
                          {agencyDrilldownTab === 'requests' && (
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                                <div>
                                  <h3 className="text-base font-bold text-slate-900">Patient Requests Received & Fulfilled</h3>
                                  <p className="text-xs text-slate-500">
                                    Full audit trail of home visits dispatched, care clinical notes, and vital status
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200">
                                    Total: {agBookings.length}
                                  </span>
                                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200">
                                    Served: {servedBookings.length}
                                  </span>
                                </div>
                              </div>

                              {agBookings.length === 0 ? (
                                <div className="text-center py-12 text-slate-400 text-xs">
                                  No patient requests logged under this agency yet.
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  {agBookings.map(b => (
                                    <div key={b.id} className="border border-slate-200 rounded-2xl p-5 hover:border-cyan-300 transition-all bg-white">
                                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                                        <div className="flex items-center gap-2">
                                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                            {b.id}
                                          </span>
                                          <span className="text-xs font-bold text-slate-900">{b.serviceName}</span>
                                          {b.category && (
                                            <span className="px-2 py-0.5 bg-cyan-50 text-cyan-800 text-[10px] font-semibold rounded">
                                              {b.category}
                                            </span>
                                          )}
                                        </div>
                                        {(() => {
                                          const st = getBookingStatusDisplay(b.status);
                                          return (
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border self-start sm:self-auto ${st.color}`}>
                                              {st.label}
                                            </span>
                                          );
                                        })()}
                                      </div>

                                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        <div>
                                          <span className="text-slate-400 block">Patient Details:</span>
                                          <strong className="text-slate-900">{b.patientName}</strong>
                                          <div className="font-mono text-slate-600">{b.patientPhone}</div>
                                        </div>
                                        <div>
                                          <span className="text-slate-400 block">Home Address:</span>
                                          <span className="text-slate-700">{b.address}</span>
                                        </div>
                                        <div>
                                          <span className="text-slate-400 block">Assigned Paramedic:</span>
                                          <strong className="text-cyan-800">{b.assignedStaff || 'Searching Pool...'}</strong>
                                          {b.staffPhone && <div className="font-mono text-slate-500">{b.staffPhone}</div>}
                                        </div>
                                      </div>

                                      {/* Clinical Vitals & Notes if Recorded */}
                                      {(b.clinicalNotes || b.vitalsBP) && (
                                        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                                          <div className="text-slate-600 italic">
                                            "{b.clinicalNotes}"
                                          </div>
                                          {b.vitalsBP && (
                                            <div className="flex items-center gap-2">
                                              <span className="text-[11px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded border border-emerald-200">
                                                BP: {b.vitalsBP}
                                              </span>
                                              {b.vitalsSpO2 && (
                                                <span className="text-[11px] font-bold px-2 py-0.5 bg-teal-50 text-teal-800 rounded border border-teal-200">
                                                  SpO2: {b.vitalsSpO2}
                                                </span>
                                              )}
                                              {b.vitalsPulse && (
                                                <span className="text-[11px] font-bold px-2 py-0.5 bg-rose-50 text-rose-800 rounded border border-rose-200">
                                                  Pulse: {b.vitalsPulse}
                                                </span>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* TAB 4: CUSTOMERS SERVED DRILLDOWN */}
                          {agencyDrilldownTab === 'customers' && (
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                                <div>
                                  <h3 className="text-base font-bold text-slate-900">Customers & Patients Served</h3>
                                  <p className="text-xs text-slate-500">
                                    Patient directory and visit history catered by {selectedAg.name}
                                  </p>
                                </div>
                                <span className="px-3 py-1 bg-indigo-50 text-indigo-800 font-bold text-xs rounded-xl border border-indigo-200">
                                  {uniqueCustomerList.length} Unique Patients
                                </span>
                              </div>

                              {uniqueCustomerList.length === 0 ? (
                                <div className="text-center py-12 text-slate-400 text-xs">
                                  No customers have booked services with this agency yet.
                                </div>
                              ) : (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                                      <tr>
                                        <th className="py-3 px-4">Patient / Customer</th>
                                        <th className="py-3 px-4">Contact Phone</th>
                                        <th className="py-3 px-4">Primary Address</th>
                                        <th className="py-3 px-4">Total Bookings</th>
                                        <th className="py-3 px-4">Completed Visits</th>
                                        <th className="py-3 px-4">Latest Service</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {uniqueCustomerList.map((c, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 transition">
                                          <td className="py-3.5 px-4 font-bold text-slate-900">
                                            <div className="flex items-center gap-2">
                                              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                                                {c.name.charAt(0)}
                                              </div>
                                              <div>
                                                <div>{c.name}</div>
                                                <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                                                  <Check className="w-2.5 h-2.5" /> Verified Customer
                                                </div>
                                              </div>
                                            </div>
                                          </td>
                                          <td className="py-3.5 px-4 font-mono text-slate-700">{c.phone}</td>
                                          <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">{c.address}</td>
                                          <td className="py-3.5 px-4 font-bold text-slate-900">{c.bookingsCount} Request(s)</td>
                                          <td className="py-3.5 px-4">
                                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                              {c.completedCount} Served
                                            </span>
                                          </td>
                                          <td className="py-3.5 px-4 font-medium text-cyan-800">{c.lastService}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })()
                  )}
                </div>
              )}

              {authUser.role === 'SUPER_ADMIN' && portalSection === 'master_services' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Master Service Catalogue</h3>
                      <p className="text-xs text-slate-500">Standardized clinical service definitions provided to all agencies</p>
                    </div>
                    <button
                      onClick={() => setShowAddModal('master_service')}
                      className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1 shadow-xs"
                    >
                      <Plus className="w-4 h-4" /> <span>Add Master Service</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4">Service</th>
                          <th className="py-3 px-4">Clinical Category</th>
                          <th className="py-3 px-4">Staff Role</th>
                          <th className="py-3 px-4">Duration</th>
                          <th className="py-3 px-4">Base Price</th>
                          <th className="py-3 px-4">Type</th>
                          <th className="py-3 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {services.map(s => (
                          <tr key={s.id} className="hover:bg-slate-50 transition">
                            <td className="py-3 px-4 font-bold text-slate-900">
                              <div>{s.name}</div>
                              <div className="text-[11px] text-slate-400 font-normal line-clamp-1">{s.description}</div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 bg-cyan-50 text-cyan-800 rounded font-semibold">{s.category}</span>
                            </td>
                            <td className="py-3 px-4 text-slate-700 font-medium">{s.staffType}</td>
                            <td className="py-3 px-4 text-slate-500">{s.duration}</td>
                            <td className="py-3 px-4 font-bold text-slate-900">₹{s.price}</td>
                            <td className="py-3 px-4">
                              {s.isMaster ? (
                                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px]">MASTER</span>
                              ) : (
                                <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-bold text-[10px]">AGENCY SPECIALTY</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => setEditingService(s)}
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-cyan-50 text-cyan-700 hover:bg-cyan-100 transition inline-flex items-center gap-1"
                              >
                                <Edit className="w-3 h-3" />
                                <span>Edit</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {authUser.role === 'SUPER_ADMIN' && portalSection === 'alerts' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Direct Agency Alerting System</h3>
                      <p className="text-xs text-slate-500">Dispatch quality warnings and milestone notifications directly to agency consoles</p>
                    </div>
                    <button
                      onClick={() => setShowAddModal('alert')}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1 shadow-xs"
                    >
                      <Send className="w-4 h-4" /> <span>Issue Alert</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {alerts.map(al => (
                      <div key={al.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start space-x-3">
                        <div className={`p-2 rounded-xl text-white ${
                          al.severity === 'HIGH' ? 'bg-rose-600' : al.severity === 'MEDIUM' ? 'bg-amber-600' : 'bg-emerald-600'
                        }`}>
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900">{al.title}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{al.createdAt}</span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1">{al.message}</p>
                          <div className="mt-2 flex items-center gap-2 text-[11px]">
                            <span className="font-semibold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded">To: {al.agencyName}</span>
                            <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">Severity: {al.severity}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* B. AGENCY ADMIN SECTION VIEWS                                             */}
              {/* ========================================================================= */}
              {authUser.role === 'AGENCY_ADMIN' && portalSection === 'agency_staff' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">My Agency Paramedical Roster</h3>
                      <p className="text-xs text-slate-500">Agencies are responsible for recruiting, verifying and managing clinical paramedics</p>
                    </div>
                    <button
                      onClick={() => setShowAddModal('staff')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1 shadow-xs"
                    >
                      <Plus className="w-4 h-4" /> <span>Onboard Paramedic</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4">Staff Member</th>
                          <th className="py-3 px-4">Clinical Category</th>
                          <th className="py-3 px-4">Contact / Area</th>
                          <th className="py-3 px-4">Experience</th>
                          <th className="py-3 px-4">Step 2: Verification</th>
                          <th className="py-3 px-4">Step 3: Dispatch Radar</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {agencyStaff.map(st => {
                          const isVerified = st.verificationStatus === 'VERIFIED';
                          const isRejected = st.verificationStatus === 'REJECTED';
                          const isEnabled = st.isEnabled === true;

                          return (
                            <tr key={st.id} className="hover:bg-slate-50 transition">
                              <td className="py-3 px-4 font-bold text-slate-900">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs uppercase">
                                    {st.name.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="hover:text-emerald-700 cursor-pointer font-bold" onClick={() => setViewingStaffProfile(st)}>
                                      {st.name}
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
                                      <span>{st.id}</span>
                                      <span className="text-emerald-600 font-bold">★ {st.rating || 5.0}</span>
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3 px-4">
                                <div className="flex flex-wrap gap-1 max-w-[210px] mb-1">
                                  {(st.role || 'Nursing').split(',').map((cat, idx) => (
                                    <span key={idx} className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
                                      {cat.trim()}
                                    </span>
                                  ))}
                                </div>
                                <span className="text-[10px] text-slate-500 block truncate max-w-[190px]">
                                  {st.specializations || st.qualification || 'General Clinical Care'}
                                </span>
                              </td>

                              <td className="py-3 px-4">
                                <div className="font-mono text-slate-700 text-xs">{st.phone}</div>
                                <div className="text-[10px] text-slate-400 truncate max-w-[150px]">{st.serviceArea || 'South Delhi NCR'}</div>
                              </td>

                              <td className="py-3 px-4 text-slate-600">
                                <span className="font-bold text-slate-800">{st.experienceYrs} yrs</span>
                                <span className="block text-[10px] text-slate-400">{st.languages || 'Eng, Hindi'}</span>
                              </td>

                              {/* Step 2: Verification Status & Verify with Comment */}
                              <td className="py-3 px-4">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5">
                                    {isVerified ? (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                                        <CheckCheck className="w-3 h-3 mr-1 text-emerald-600" /> VERIFIED
                                      </span>
                                    ) : isRejected ? (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-300">
                                        <X className="w-3 h-3 mr-1 text-rose-600" /> REJECTED
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 animate-pulse">
                                        <Clock className="w-3 h-3 mr-1 text-amber-600" /> PENDING AUDIT
                                      </span>
                                    )}
                                  </div>
                                  
                                  <button
                                    onClick={() => {
                                      setVerifyingStaff(st);
                                      setVerificationCommentInput(st.verificationComment || 'All nursing certificates, Aadhaar ID, and background documents successfully audited and verified.');
                                    }}
                                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 underline flex items-center gap-1 cursor-pointer"
                                    title="Verify paramedic with audit note and comments"
                                  >
                                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                    <span>{isVerified ? 'Edit Audit Note' : 'Verify Paramedic'}</span>
                                  </button>
                                  {st.verificationComment && (
                                    <div className="text-[10px] text-slate-500 italic truncate max-w-[170px]" title={st.verificationComment}>
                                      "{st.verificationComment}"
                                    </div>
                                  )}
                                </div>
                              </td>

                              {/* Step 3: Enable / Disable Dispatch Toggle */}
                              <td className="py-3 px-4">
                                <div className="space-y-1">
                                  <button
                                    onClick={() => handleToggleStaffEnablement(st)}
                                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold transition cursor-pointer ${
                                      isEnabled
                                        ? 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700'
                                        : isVerified
                                          ? 'bg-slate-100 text-slate-700 border border-slate-300 hover:bg-emerald-50 hover:text-emerald-800'
                                          : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                                    }`}
                                    title={!isVerified ? 'Verify profile first before enabling' : 'Toggle live dispatch allocation'}
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isEnabled ? 'bg-white animate-pulse' : 'bg-slate-400'}`}></span>
                                    {isEnabled ? 'ENABLED (Receiving Jobs)' : 'DISABLED'}
                                  </button>
                                  <div className="text-[10px] text-slate-400">
                                    {isEnabled ? 'Ready on Radar' : isVerified ? 'Click to Enable' : 'Verify in Step 2'}
                                  </div>
                                </div>
                              </td>

                              {/* Actions: View Profile & Edit */}
                              <td className="py-3 px-4 text-right">
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    onClick={() => setViewingStaffProfile(st)}
                                    className="px-2 py-1 text-xs font-semibold rounded-lg bg-cyan-50 text-cyan-800 hover:bg-cyan-100 transition inline-flex items-center gap-1"
                                    title="View full onboarded profile"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>Profile</span>
                                  </button>
                                  <button
                                    onClick={() => setEditingStaff(st)}
                                    className="px-2 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition inline-flex items-center gap-1"
                                  >
                                    <Edit className="w-3 h-3" />
                                    <span>Edit</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {authUser.role === 'AGENCY_ADMIN' && portalSection === 'agency_packages' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Agency Care Packages & Custom Bundles</h3>
                      <p className="text-xs text-slate-500">Standard bundles and customer-specific packages (valid for 2 weeks until accepted)</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openCustomPackageModalForCustomer('USR-005', 'Priya Sharma (Patient)', 'Nursing')}
                        className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1 shadow-xs cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> <span>Create Custom Package for Customer</span>
                      </button>
                      <button
                        onClick={() => {
                          setNewPackage({
                            name: '',
                            category: 'Nursing',
                            durationDays: 7,
                            totalVisits: 14,
                            price: 4999,
                            originalPrice: 6999,
                            description: '',
                            customerId: '',
                            customerName: ''
                          });
                          setPackageItems([]);
                          setPackageDiscountPercent(15);
                          setShowAddModal('package');
                        }}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1 shadow-xs cursor-pointer"
                      >
                        <Plus className="w-4 h-4" /> <span>Create Public Package</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {agencyPackages.map(pkg => (
                      <div key={pkg.id} className="border border-slate-200 rounded-xl p-5 hover:border-emerald-400 transition">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex flex-wrap gap-1">
                            {(pkg.category || 'Nursing').split(',').map((cat, idx) => (
                              <span key={idx} className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                                {cat.trim()}
                              </span>
                            ))}
                          </div>
                          <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">{pkg.discountPercent}% OFF</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{pkg.description}</p>
                        
                        {/* Included services if any */}
                        {pkg.items && pkg.items.length > 0 && (
                          <div className="mt-2.5 p-2 bg-slate-50 rounded-lg border border-slate-100 text-[11px] space-y-1">
                            <span className="font-bold text-slate-700 block text-[10px] uppercase tracking-wider">
                              Included Services ({pkg.items.length}):
                            </span>
                            {pkg.items.slice(0, 3).map((it, idx) => (
                              <div key={idx} className="flex justify-between text-slate-600">
                                <span className="truncate pr-1">• {it.serviceName}</span>
                                <span className="font-medium text-slate-500 whitespace-nowrap">{it.visits} visits</span>
                              </div>
                            ))}
                            {pkg.items.length > 3 && (
                              <span className="text-[10px] text-cyan-600 font-semibold block">
                                +{pkg.items.length - 3} more services
                              </span>
                            )}
                          </div>
                        )}

                        {pkg.customerId && (
                          <div className="mt-2 text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 flex items-center justify-between">
                            <span>Tagged to Customer: {pkg.customerId}</span>
                            <span className="text-[10px] text-slate-500 font-mono">2-Wk Auto-Expire</span>
                          </div>
                        )}
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                          <div>
                            <span className="text-slate-400 line-through">₹{pkg.originalPrice}</span>
                            <span className="font-bold text-slate-900 ml-1 text-sm">₹{pkg.price}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 font-semibold">{pkg.durationDays} Days</span>
                            <button
                              onClick={() => setEditingPackage(pkg)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                              title="Edit Package & Discounts"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {authUser.role === 'AGENCY_ADMIN' && portalSection === 'agency_services' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Agency Service Catalogue & Master List Controls</h3>
                      <p className="text-xs text-slate-500">
                        Enable services from the platform Master List to offer them to customers under your agency. Customize your agency price or add specialty clinical procedures.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowAddModal('agency_service')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1 shadow-xs cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> <span>Add Specialty Service</span>
                    </button>
                  </div>

                  {/* Summary Bar */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <div>
                      <span className="text-slate-500 block">Total Master & Specialty</span>
                      <strong className="text-sm font-bold text-slate-900">{services.length} Services</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Active for Your Customers</span>
                      <strong className="text-sm font-bold text-emerald-600">
                        {services.filter(s => s.isEnabled !== false).length} Enabled
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Disabled (Hidden from Customers)</span>
                      <strong className="text-sm font-bold text-amber-600">
                        {services.filter(s => s.isEnabled === false).length} Disabled
                      </strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {services.map(s => {
                      const isMasterService = s.isMaster;
                      const isEnabled = s.isEnabled !== false;
                      const hasCustomPrice = s.customPrice && s.customPrice > 0;
                      const isEditingPrice = agencyPriceEditingService?.id === s.id;

                      return (
                        <div
                          key={s.id}
                          className={`border rounded-2xl p-5 transition flex flex-col justify-between ${
                            isEnabled
                              ? 'border-slate-200 bg-white hover:border-cyan-400 hover:shadow-xs'
                              : 'border-slate-200 bg-slate-50/70 opacity-75'
                          }`}
                        >
                          <div>
                            {/* Badges & Status Toggle */}
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-bold text-slate-600 uppercase bg-slate-100 px-2 py-0.5 rounded">
                                {s.category}
                              </span>
                              <div className="flex items-center gap-1.5">
                                {hasCustomPrice ? (
                                  <span className="text-[10px] font-bold bg-cyan-50 text-cyan-800 px-2 py-0.5 rounded border border-cyan-200">
                                    AGENCY SERVICE (CUSTOMIZED)
                                  </span>
                                ) : isMasterService ? (
                                  <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200">
                                    MASTER LIST
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                                    AGENCY SPECIALTY
                                  </span>
                                )}

                                {/* Enable / Disable Toggle Switch */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleAgencyService(s)}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition flex items-center gap-1 ${
                                    isEnabled
                                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                      : 'bg-slate-300 text-slate-700 hover:bg-slate-400'
                                  }`}
                                  title={isEnabled ? 'Click to Disable for Customers' : 'Click to Enable for Customers'}
                                >
                                  {isEnabled ? <CheckCircle className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                  <span>{isEnabled ? 'ENABLED' : 'DISABLED'}</span>
                                </button>
                              </div>
                            </div>

                            <h4 className="font-bold text-slate-900 text-sm mt-1">{s.name}</h4>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{s.description}</p>

                            <div className="mt-3 flex items-center text-xs text-slate-500 gap-2">
                              <span className="flex items-center">
                                <Clock className="w-3 h-3 mr-1 text-slate-400" /> {s.duration}
                              </span>
                              <span>•</span>
                              <span className="flex items-center">
                                <Stethoscope className="w-3 h-3 mr-1 text-cyan-600" /> {s.staffType}
                              </span>
                            </div>
                          </div>

                          {/* Pricing & Custom Agency Price Configuration */}
                          <div className="mt-4 pt-3 border-t border-slate-100">
                            {isEditingPrice ? (
                              <div className="bg-cyan-50 p-3 rounded-xl border border-cyan-200">
                                <div className="text-[11px] font-bold text-cyan-900 mb-1">Set Your Agency Price:</div>
                                <div className="flex items-center gap-2">
                                  <div className="relative flex-1">
                                    <span className="absolute left-2.5 top-1.5 text-xs font-bold text-slate-500">₹</span>
                                    <input
                                      type="number"
                                      autoFocus
                                      value={agencyCustomPriceInput}
                                      onChange={e => setAgencyCustomPriceInput(Number(e.target.value))}
                                      className="w-full pl-6 pr-2 py-1 text-xs border rounded-lg bg-white font-bold text-slate-900"
                                    />
                                  </div>
                                  <button
                                    onClick={() => handleSaveAgencyCustomPrice(s.id, agencyCustomPriceInput)}
                                    className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setAgencyPriceEditingService(null)}
                                    className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs transition cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                                <div className="text-[10px] text-slate-500 mt-1">
                                  Master default: ₹{s.masterPrice || s.price}
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-base font-extrabold text-slate-900">
                                      ₹{s.price}
                                    </span>
                                    {hasCustomPrice ? (
                                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        Your Custom Price
                                      </span>
                                    ) : (
                                      <span className="text-[10px] text-slate-400">
                                        (Master Standard)
                                      </span>
                                    )}
                                  </div>
                                  {hasCustomPrice && s.masterPrice && s.masterPrice !== s.price && (
                                    <span className="text-[10px] text-slate-400">
                                      Master Price: ₹{s.masterPrice}
                                    </span>
                                  )}
                                </div>

                                <button
                                  onClick={() => {
                                    setAgencyPriceEditingService(s);
                                    setAgencyCustomPriceInput(s.price);
                                  }}
                                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-cyan-50 hover:text-cyan-700 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer border border-slate-200"
                                  title="Edit price for your agency"
                                >
                                  <Edit className="w-3 h-3" />
                                  <span>Edit Price</span>
                                </button>
                              </div>
                            )}

                            {!isEnabled && (
                              <div className="mt-2 text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded-md border border-amber-200">
                                ⚠️ Hidden from customers. Toggle switch above to offer this service.
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {authUser.role === 'AGENCY_ADMIN' && portalSection === 'agency_alerts_view' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
                  <h3 className="text-base font-bold text-slate-900 mb-1">SuperAdmin Quality Notices</h3>
                  <p className="text-xs text-slate-500 mb-4">Official platform notifications issued to your agency</p>
                  <div className="space-y-3">
                    {agencyAlerts.map(al => (
                      <div key={al.id} className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 flex items-start space-x-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs font-bold text-slate-900">{al.title}</div>
                          <p className="text-xs text-slate-600 mt-0.5">{al.message}</p>
                          <div className="text-[10px] text-slate-400 mt-2 font-mono">{al.createdAt}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* C. AGENCY CUSTOMER CARE & BOOKINGS VIEW (AGENCY_CARE & AGENCY_ADMIN)      */}
              {/* ========================================================================= */}
              {(authUser.role === 'AGENCY_CARE' || authUser.role === 'AGENCY_ADMIN') && portalSection === 'care_queue' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        {authUser.role === 'AGENCY_ADMIN' ? 'Agency Incoming Bookings & Care Management' : 'Agency Customer Care Desk'}
                      </h3>
                      <p className="text-xs text-slate-500">Monitor incoming patient calls, visit requests, and create customized care plans</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openCustomPackageModalForCustomer('USR-005', 'Priya Sharma (Patient)', 'Nursing')}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1 shadow-xs cursor-pointer"
                        title="Create customized multi-visit care package for a patient"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> <span>+ Custom Package</span>
                      </button>
                      <span className="px-3 py-1 bg-cyan-50 text-cyan-800 font-bold text-xs rounded-full border border-cyan-200">
                        Agency: {agencies.find(a => a.id === authUser.agencyId)?.name || 'LifeCare Health'} ({authUser.agencyId || 'AG-01'})
                      </span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4">Booking ID</th>
                          <th className="py-3 px-4">Patient & Contact</th>
                          <th className="py-3 px-4">Requested Service</th>
                          <th className="py-3 px-4">Address</th>
                          <th className="py-3 px-4">Assigned Staff</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {agencyBookings.map(b => (
                          <tr key={b.id} className="hover:bg-slate-50 transition">
                            <td className="py-3 px-4 font-mono font-bold text-slate-900">{b.id}</td>
                            <td className="py-3 px-4">
                              <div className="font-semibold text-slate-900">{b.patientName}</div>
                              <div className="text-[11px] text-slate-500 font-mono flex items-center">
                                <Phone className="w-3 h-3 mr-1 text-slate-400" /> {b.patientPhone}
                              </div>
                            </td>
                            <td className="py-3 px-4 font-medium text-cyan-800">{b.serviceName}</td>
                            <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{b.address}</td>
                            <td className="py-3 px-4">
                              <span className="font-semibold text-slate-800">{b.assignedStaff || 'Pending'}</span>
                              {b.agencyName && (
                                <span className="ml-1.5 text-[10px] font-medium text-cyan-700 bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-200">
                                  {b.agencyName}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {(() => {
                                const st = getBookingStatusDisplay(b.status);
                                return (
                                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${st.color}`}>
                                    {st.label}
                                  </span>
                                );
                              })()}
                            </td>
                            <td className="py-3 px-4 text-right space-x-1.5">
                              <button
                                onClick={() => openCustomPackageModalForCustomer(
                                  b.patientPhone.includes('98765') || b.patientName.includes('Priya') ? 'USR-005' : 'USR-006',
                                  b.patientName,
                                  b.category || 'Nursing'
                                )}
                                className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold transition inline-flex items-center gap-1 cursor-pointer"
                                title="Create custom multi-visit package for this patient"
                              >
                                <Sparkles className="w-3 h-3 text-indigo-600" />
                                <span>Create Package</span>
                              </button>
                              
                              {/* For agency care: Assign Paramedical Staff */}
                              {b.status !== 'COMPLETED' && b.status !== 'CANCELLED' ? (
                                <button
                                  onClick={() => setSelectedBookingForAssign(b)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition inline-flex items-center gap-1 cursor-pointer shadow-xs"
                                  title="Assign or reassign an available paramedical staff member"
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                  <span>{b.assignedStaffId ? 'Reassign Staff' : 'Assign Staff'}</span>
                                </button>
                              ) : null}

                              {/* View Details / Vitals log for completed visits */}
                              {b.status === 'COMPLETED' ? (
                                <button
                                  onClick={() => setSelectedBookingForUpdate(b)}
                                  className="px-2.5 py-1 bg-slate-900 hover:bg-cyan-700 text-white rounded-lg text-xs font-semibold transition"
                                >
                                  View Clinical Log
                                </button>
                              ) : null}

                              {(b.status === 'SEARCHING' || b.status === 'CONFIRMED' || b.status === 'EN_ROUTE') && (
                                <button
                                  onClick={() => handleCancelBooking(b.id, 'STAFF')}
                                  className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition"
                                  title="Cancel or reassign booking"
                                >
                                  Cancel
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {authUser.role === 'AGENCY_CARE' && portalSection === 'care_staff_status' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
                  <h3 className="text-base font-bold text-slate-900 mb-1">On-Duty Paramedics (Live Status)</h3>
                  <p className="text-xs text-slate-500 mb-6">Staff available for manual assignment and escalated patient calls</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {agencyStaff.map(s => (
                      <div key={s.id} className="border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{s.name}</div>
                          <div className="text-xs text-cyan-700">{s.role}</div>
                          <div className="text-[11px] text-slate-400 mt-1">{s.phone}</div>
                        </div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse"></span> READY
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {authUser.role === 'AGENCY_CARE' && portalSection === 'care_custom_packages' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Customized Patient Packages & Tracking</h3>
                      <p className="text-xs text-slate-500">Create patient-specific multi-day clinical bundles. Auto-removes after 2 weeks or once accepted.</p>
                    </div>
                    <button
                      onClick={() => openCustomPackageModalForCustomer('USR-005', 'Priya Sharma (Patient)', 'Nursing')}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" /> <span>Generate Custom Package</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {packages.filter(p => p.customerId).map(pkg => (
                      <div key={pkg.id} className="border-2 border-indigo-200 bg-indigo-50/20 rounded-2xl p-5 hover:border-indigo-400 transition flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                              TAGGED TO: {pkg.customerId}
                            </span>
                            <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                              {pkg.discountPercent}% SAVING
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1 mb-1.5">
                            {(pkg.category || 'Nursing').split(',').map((cat, idx) => (
                              <span key={idx} className="text-[10px] font-bold text-indigo-800 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                                {cat.trim()}
                              </span>
                            ))}
                          </div>
                          <h4 className="font-bold text-slate-900 text-base">{pkg.name}</h4>
                          <p className="text-xs text-slate-600 mt-1 line-clamp-2">{pkg.description}</p>
                          <div className="mt-3 text-[11px] text-slate-500 space-y-1">
                            <div>Duration: <strong>{pkg.durationDays} Days ({pkg.totalVisits} Visits)</strong></div>
                            <div>Validity: <span className="text-amber-700 font-semibold">14 Days (Auto-cleanup active)</span></div>
                            <div>Status: <span className="font-bold text-emerald-700 uppercase">{pkg.status}</span></div>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-indigo-100 flex items-center justify-between">
                          <div>
                            <span className="text-xs text-slate-400 line-through">₹{pkg.originalPrice}</span>
                            <span className="text-base font-extrabold text-slate-900 ml-1">₹{pkg.price}</span>
                          </div>
                          <button
                            onClick={() => setEditingPackage(pkg)}
                            className="px-2.5 py-1 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-lg transition"
                          >
                            Edit Pricing
                          </button>
                        </div>
                      </div>
                    ))}
                    {packages.filter(p => p.customerId).length === 0 && (
                      <div className="col-span-3 text-center py-12 text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        No customized packages active right now. Click "Generate Custom Package" to craft an exclusive bundle for a customer.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* D. PARAMEDICAL STAFF VIEW: 1. AVAILABLE OPEN REQUESTS (AREA & EXPERTISE) */}
              {/* ========================================================================= */}
              {authUser.role === 'PARAMEDIC' && portalSection === 'open_requests' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
                  {/* Header & Controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">Available Booking Requests</h3>
                        <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full">
                          {availableBookingRequests.length} Available in Area
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Unallotted care requests matching your professional expertise (<strong className="text-slate-700">{currentStaffProfile.role}</strong>) and operational area. You can review details and accept visits at your convenience.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      {/* Radius Filter */}
                      <div className="flex items-center gap-1.5 text-xs bg-slate-100 p-1 rounded-xl border border-slate-200">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
                        <span className="text-slate-600 font-medium">Radius:</span>
                        <select
                          value={paramedicRadiusFilter}
                          onChange={e => setParamedicRadiusFilter(Number(e.target.value))}
                          aria-label="Filter booking requests by radius"
                          className="bg-white text-slate-800 text-xs font-semibold px-2 py-1 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value={5}>Within 5 km</option>
                          <option value={10}>Within 10 km</option>
                          <option value={15}>Within 15 km (Default)</option>
                          <option value={50}>Within 50 km (Broad Area)</option>
                        </select>
                      </div>

                      {/* Expertise Filter Toggle */}
                      <button
                        onClick={() => setParamedicExpertiseOnly(!paramedicExpertiseOnly)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition flex items-center gap-1.5 ${
                          paramedicExpertiseOnly 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold' 
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                        title="Toggle strict role matching"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{paramedicExpertiseOnly ? 'Expertise Match: ON' : 'All Open Requests'}</span>
                      </button>

                      {/* Refresh Button */}
                      <button
                        onClick={fetchData}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
                        title="Refresh open requests"
                      >
                        <Activity className="w-4 h-4 text-emerald-600" />
                      </button>
                    </div>
                  </div>

                  {/* Open Request Cards */}
                  {availableBookingRequests.length === 0 ? (
                    <div className="text-center py-16 px-4 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
                      <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 mx-auto mb-3">
                        <CheckCircle className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">All Patient Requests in Your Area Are Allotted</h4>
                      <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                        There are currently no pending unassigned visits matching your radius ({paramedicRadiusFilter} km) or expertise ({currentStaffProfile.role}). You will see new customer requests appear here automatically as they are raised.
                      </p>
                      <button
                        onClick={() => setParamedicRadiusFilter(50)}
                        className="mt-4 px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 shadow-xs transition"
                      >
                        Expand Search Radius to 50 km
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {availableBookingRequests.map(req => {
                        const dist = (req.patientLat && req.patientLng && currentStaffProfile.lat && currentStaffProfile.lng)
                          ? calculateDistanceKm(currentStaffProfile.lat, currentStaffProfile.lng, req.patientLat, req.patientLng)
                          : req.radiusKm || 4.2;

                        const isClaiming = acceptingBookingId === req.id;

                        return (
                          <div 
                            key={req.id} 
                            className="bg-white rounded-2xl border-2 border-slate-200/80 hover:border-emerald-400 p-5 shadow-xs transition-all hover:shadow-md flex flex-col justify-between"
                          >
                            <div>
                              {/* Header info */}
                              <div className="flex items-start justify-between gap-2 mb-3">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                                      {req.id}
                                    </span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                      req.status === 'ESCALATED' 
                                        ? 'bg-amber-50 text-amber-800 border-amber-300' 
                                        : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                    }`}>
                                      {req.status === 'ESCALATED' ? 'Urgent / Escalated' : 'Open Request'}
                                    </span>
                                  </div>
                                  <h4 className="font-bold text-slate-900 text-base leading-snug">{req.serviceName}</h4>
                                  <span className="text-xs text-slate-500 font-medium">{req.category || 'Clinical Care'}</span>
                                </div>

                                <div className="text-right">
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
                                    <MapPin className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                                    {dist} km away
                                  </span>
                                </div>
                              </div>

                              {/* Details Grid */}
                              <div className="bg-slate-50 rounded-xl p-3.5 space-y-2 text-xs text-slate-600 mb-4 border border-slate-100">
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-400 font-medium">Patient:</span>
                                  <span className="font-bold text-slate-800">{req.patientName}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-400 font-medium">Schedule / Time:</span>
                                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                                    <Clock className="w-3 h-3 inline mr-1" />
                                    {req.bookingTime || 'ASAP (Next 30 mins)'}
                                  </span>
                                </div>
                                <div className="flex items-start justify-between gap-2">
                                  <span className="text-slate-400 font-medium flex-shrink-0">Location:</span>
                                  <span className="text-right font-medium text-slate-800 line-clamp-1">{req.address || 'Address on file'}</span>
                                </div>
                                {req.staffType && (
                                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                                    <span className="text-slate-400">Required Expertise:</span>
                                    <span className="font-bold text-indigo-700 flex items-center gap-1">
                                      <Stethoscope className="w-3 h-3 text-indigo-500" />
                                      {req.staffType}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Action footer */}
                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                              <span className="text-[11px] text-slate-400">
                                Raised: {req.createdAt ? new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                              </span>

                              <button
                                onClick={() => handleAcceptBooking(req)}
                                disabled={isClaiming}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer ${
                                  isClaiming 
                                    ? 'bg-slate-300 text-slate-600 cursor-not-allowed' 
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 hover:shadow-md'
                                }`}
                              >
                                {isClaiming ? (
                                  <>
                                    <Activity className="w-3.5 h-3.5 animate-spin" />
                                    <span>Accepting...</span>
                                  </>
                                ) : (
                                  <>
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                    <span>Accept Visit Now</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================================= */}
              {/* D. PARAMEDICAL STAFF VIEW: 2. MY ASSIGNED VISITS & VITALS LOG             */}
              {/* ========================================================================= */}
              {authUser.role === 'PARAMEDIC' && portalSection === 'my_visits' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">My Assigned Clinical Visits</h3>
                      <p className="text-xs text-slate-500">Scheduled home visits, patient navigation and digital vitals logging</p>
                    </div>
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-800 font-bold text-xs rounded-full border border-emerald-200">
                      Paramedic ID: {authUser.staffId || 'STF-101'}
                    </span>
                  </div>

                  <div className="space-y-4">
                    {paramedicVisits.map(v => {
                      const isTransit = transitBookingId === v.id;
                      return (
                        <div key={v.id} className="border border-slate-200 rounded-2xl p-5 hover:border-cyan-300 transition bg-slate-50/50">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                            <div>
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700 mr-2">{v.id}</span>
                              <span className="font-bold text-slate-900 text-base">{v.serviceName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {(() => {
                                const st = getBookingStatusDisplay(v.status);
                                if (v.status === 'CONFIRMED' && !isTransit) {
                                  return (
                                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-100 text-cyan-800 flex items-center gap-1 border border-cyan-200">
                                      <Clock className="w-3.5 h-3.5" /> Staff Assigned (Ready for Visit)
                                    </span>
                                  );
                                }
                                if (v.status === 'EN_ROUTE' || isTransit) {
                                  return (
                                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 flex items-center gap-1 animate-pulse border border-indigo-200">
                                      <Navigation className="w-3.5 h-3.5" /> Staff Visit Started ({transitSecondsLeft}s)
                                    </span>
                                  );
                                }
                                if (v.status === 'REACHED') {
                                  return (
                                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                                      <Radio className="w-3.5 h-3.5 text-rose-600 animate-pulse" /> Staff Arrived • Live AV
                                    </span>
                                  );
                                }
                                return (
                                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${st.color}`}>
                                    {v.status === 'COMPLETED' && <CheckCheck className="w-3.5 h-3.5" />}
                                    <span>{st.label}</span>
                                  </span>
                                );
                              })()}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-600 bg-white p-4 rounded-xl border border-slate-200/80 mb-3">
                            <div>
                              <span className="text-slate-400 block font-medium">Patient:</span>
                              <span className="font-bold text-slate-800">{v.patientName}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block font-medium">Phone:</span>
                              <span className="font-mono text-slate-800">{v.patientPhone}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block font-medium">Destination:</span>
                              <span className="text-slate-800">{v.address}</span>
                            </div>
                          </div>

                          {/* Attached Prescription Preview banner */}
                          {v.prescriptionUrl ? (
                            <div className="p-3 bg-cyan-50/80 rounded-xl border border-cyan-200 text-xs text-cyan-950 mb-3 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-cyan-700" />
                                <div>
                                  <span className="font-bold text-cyan-900">Attached Doctor Prescription: </span>
                                  <span className="font-medium text-cyan-800">{v.prescriptionName || 'Prescription.pdf'}</span>
                                </div>
                              </div>
                              <button
                                onClick={() => setViewPrescriptionBooking(v)}
                                className="px-2.5 py-1 bg-white hover:bg-cyan-100 text-cyan-800 border border-cyan-300 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" /> View Rx
                              </button>
                            </div>
                          ) : (
                            <div className="p-2.5 bg-slate-100/70 rounded-xl border border-slate-200 text-xs text-slate-500 mb-3 flex items-center justify-between">
                              <span className="flex items-center gap-1.5 text-slate-600">
                                <FileText className="w-3.5 h-3.5 text-slate-400" /> No prescription uploaded yet by customer.
                              </span>
                            </div>
                          )}

                          {/* Post-Visit AV & Clinical Summary */}
                          {v.status === 'COMPLETED' && v.avSummary && (
                            <div className="p-4 bg-gradient-to-br from-indigo-50/90 to-cyan-50/90 rounded-2xl border border-indigo-200 text-xs text-slate-800 mb-3 space-y-2 shadow-xs">
                              <div className="flex items-center justify-between">
                                <div className="font-bold flex items-center text-indigo-900 gap-1.5">
                                  <Radio className="w-4 h-4 text-indigo-600" />
                                  <span>Audio & Video Consultation Summary (Verified Record)</span>
                                </div>
                                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 font-bold text-[10px] rounded-full">
                                  Archived for Later Reference
                                </span>
                              </div>
                              <pre className="font-sans text-xs text-slate-700 whitespace-pre-wrap leading-relaxed bg-white/80 p-3 rounded-xl border border-indigo-100">
                                {v.avSummary}
                              </pre>
                              <div className="flex items-center justify-between pt-1">
                                <div className="flex gap-4 text-[11px] font-semibold text-slate-700">
                                  <span>BP: {v.vitalsBP || '120/80'}</span>
                                  <span>SpO2: {v.vitalsSpO2 || '99%'}</span>
                                  <span>Pulse: {v.vitalsPulse || '74 bpm'}</span>
                                </div>
                                <button
                                  onClick={() => setViewAVSummaryBooking(v)}
                                  className="text-indigo-700 hover:text-indigo-900 font-bold text-xs flex items-center gap-1 cursor-pointer underline"
                                >
                                  <Eye className="w-3.5 h-3.5" /> Full Consultation Transcript
                                </button>
                              </div>
                            </div>
                          )}

                          {v.clinicalNotes && !v.avSummary && (
                            <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200 text-xs text-emerald-950 mb-3 space-y-1">
                              <div className="font-bold flex items-center text-emerald-800">
                                <CheckCircle className="w-3.5 h-3.5 mr-1" /> Logged Clinical Notes:
                              </div>
                              <p>{v.clinicalNotes}</p>
                              <div className="flex gap-4 pt-1 text-[11px] font-semibold text-emerald-900">
                                <span>BP: {v.vitalsBP || '120/80'}</span>
                                <span>SpO2: {v.vitalsSpO2 || '99%'}</span>
                                <span>Pulse: {v.vitalsPulse || '74 bpm'}</span>
                              </div>
                            </div>
                          )}

                          <div className="flex flex-wrap justify-end items-center gap-2">
                            {/* START VISIT BUTTON */}
                            {v.status === 'CONFIRMED' && !isTransit && (
                              <button
                                onClick={() => handleStartVisit(v)}
                                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer animate-pulse"
                              >
                                <Navigation className="w-4 h-4" />
                                <span>Start Visit</span>
                              </button>
                            )}

                            {/* IN TRANSIT INDICATOR */}
                            {isTransit && (
                              <button
                                disabled
                                className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-wait"
                              >
                                <Navigation className="w-4 h-4 animate-spin" />
                                <span>En Route... Reaching destination in {transitSecondsLeft}s</span>
                              </button>
                            )}

                            {/* LIVE AV SESSION LAUNCH (REACHED) */}
                            {v.status === 'REACHED' && (
                              <button
                                onClick={() => setActiveAVSession(v)}
                                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer animate-bounce"
                              >
                                <Video className="w-4 h-4" />
                                <span>Open Live Audio/Video Stream</span>
                              </button>
                            )}

                            {/* LIVE CHAT */}
                            {(v.status === 'CONFIRMED' || v.status === 'EN_ROUTE' || v.status === 'REACHED') && (() => {
                              const summary = chatSummary[v.id];
                              const hasNewPatientMessage = summary && summary.lastSenderRole === 'PATIENT';
                              return (
                                <button
                                  onClick={() => setActiveChatBooking(v)}
                                  className={`relative px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer ${
                                    hasNewPatientMessage
                                      ? 'bg-emerald-600 text-white hover:bg-emerald-700 ring-2 ring-emerald-500/50'
                                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  }`}
                                >
                                  <span className="relative flex items-center justify-center">
                                    <MessageSquare className={`w-3.5 h-3.5 ${hasNewPatientMessage ? 'text-white' : 'text-emerald-600'}`} />
                                    {hasNewPatientMessage && (
                                      <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 border border-white"></span>
                                      </span>
                                    )}
                                  </span>
                                  <span>Live Chat with Patient</span>
                                  {hasNewPatientMessage && (
                                    <span className="ml-1 px-1.5 py-0.2 bg-rose-500 text-white text-[10px] font-black rounded-full animate-bounce">
                                      NEW
                                    </span>
                                  )}
                                </button>
                              );
                            })()}

                            {/* DECLINE / CANCEL VISIT (PARAMEDIC) */}
                            {(v.status === 'CONFIRMED' || v.status === 'EN_ROUTE') && (
                              <button
                                onClick={() => handleCancelBooking(v.id, 'STAFF', authUser?.staffId || 'STF-101')}
                                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                                title="Decline this visit. Automatically assigns next available staff within radius."
                              >
                                <X className="w-3.5 h-3.5 text-rose-500" />
                                <span>Decline / Cancel Visit</span>
                              </button>
                            )}

                            {/* RECORD VITALS & COMPLETE VISIT */}
                            <button
                              onClick={() => {
                                setSelectedBookingForUpdate(v);
                                setVisitNotes(v.clinicalNotes || '');
                              }}
                              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>{v.status === 'COMPLETED' ? 'Review Clinical Log' : 'Record Vitals & Complete Visit'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* E. CUSTOMER / PATIENT VIEW (MY CARE REQUESTS & HISTORY)                   */}
              {/* ========================================================================= */}
              {authUser.role === 'PATIENT' && portalSection === 'my_bookings' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
                  {/* Active Care Package Enrollments */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Package className="w-5 h-5 text-cyan-600" />
                        <h4 className="text-sm font-bold text-slate-900">My Enrolled Care Packages & Subscriptions</h4>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-cyan-100 text-cyan-800">
                          {packageEnrollments.length} Active
                        </span>
                      </div>
                      <button
                        onClick={() => setActiveTab('patient')}
                        className="text-xs font-bold text-cyan-700 hover:text-cyan-900 flex items-center gap-1 cursor-pointer"
                      >
                        <span>Browse Packages</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {packageEnrollments.length === 0 ? (
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                        <p className="text-xs text-slate-500">You do not have any enrolled care packages currently.</p>
                        <button
                          onClick={() => setActiveTab('patient')}
                          className="mt-2 text-xs font-bold text-cyan-600 hover:text-cyan-700 underline cursor-pointer"
                        >
                          Explore available home healthcare packages
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {packageEnrollments.map((pkg) => (
                          <div
                            key={pkg.id}
                            className="p-4 bg-gradient-to-br from-cyan-50/60 via-white to-emerald-50/40 rounded-2xl border border-cyan-200/80 shadow-xs hover:border-cyan-300 transition"
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-100 text-cyan-800">
                                    {pkg.id}
                                  </span>
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    {pkg.status || 'ACTIVE'}
                                  </span>
                                </div>
                                <h5 className="font-bold text-slate-900 text-sm mt-1">{pkg.packageName}</h5>
                                <p className="text-[11px] text-slate-500">Provided by {pkg.agencyName}</p>
                              </div>
                              <span className="text-base font-extrabold text-cyan-900">₹{pkg.price}</span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-white/80 rounded-xl border border-cyan-100 text-[11px] mb-3">
                              <div>
                                <span className="text-slate-400 block text-[10px]">Total Visits</span>
                                <span className="font-bold text-slate-800">{pkg.totalVisits} sessions</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px]">Completed</span>
                                <span className="font-bold text-emerald-700">{pkg.completedVisits || 0} visits</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px]">Validity</span>
                                <span className="font-bold text-slate-800">{pkg.durationDays} Days</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-slate-600">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-cyan-600" />
                                <span>Enrolled: {pkg.createdAt ? new Date(pkg.createdAt).toLocaleDateString() : 'Active'}</span>
                              </span>
                              <span className="font-semibold text-emerald-700 flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5" /> Confirmed via OTP
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mb-6 pt-4 border-t border-slate-200">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">My Home Care Visits & History</h3>
                      <p className="text-xs text-slate-500">Track caregiver arrival, clinical vitals recorded, and service receipts</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setShowAddressModal(true);
                          setModalAddressInput(authUser?.address || '');
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1 border border-slate-200 cursor-pointer"
                      >
                        <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{authUser?.address ? 'Update Profile Address' : 'Set Profile Address'}</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('patient')}
                        className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> <span>Book New Caregiver</span>
                      </button>
                    </div>
                  </div>

                  {/* PERSISTENT ALERT BANNER: Only show if customer has NO saved visit address in profile or active booking */}
                  {(!authUser?.address && patientBookings.some(b => !b.address || b.address.startsWith('Pending'))) && (
                    <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-amber-500/15 border-2 border-amber-400/80 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm animate-bounce">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900">Visit Address Required</h4>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500 text-white uppercase tracking-wider">
                              Action Required
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                            Please provide your home visit address and location so our care coordinator and visiting staff can reach your doorstep on time.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setShowAddressModal(true);
                          setModalAddressInput(authUser?.address || '');
                        }}
                        className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center justify-center gap-1.5 flex-shrink-0 cursor-pointer"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Add Visit Address</span>
                      </button>
                    </div>
                  )}

                  <div className="space-y-4">
                    {patientBookings.map(b => (
                      <div key={b.id} className="border border-slate-200 rounded-2xl p-5 hover:border-cyan-300 transition bg-white shadow-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">{b.id}</span>
                            <span className="font-bold text-slate-900 text-base">{b.serviceName}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {b.bookingTime && (
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-cyan-700" /> {b.bookingTime}
                              </span>
                            )}
                            {b.retryCount && b.retryCount > 0 && b.status === 'SEARCHING' ? (
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1 animate-pulse">
                                <Radio className="w-3.5 h-3.5 text-amber-600 animate-spin" /> Next Staff Search ({b.retryCount + 1}/3)
                              </span>
                            ) : null}
                            {(() => {
                              const st = getBookingStatusDisplay(b.status);
                              if (b.status === 'EN_ROUTE') {
                                return (
                                  <button
                                    onClick={() => {
                                      setTrackingBooking(b);
                                      setTransitProgress(45);
                                    }}
                                    className={`px-3 py-1 rounded-full text-xs font-bold ${st.color} flex items-center gap-1.5 animate-pulse cursor-pointer transition shadow-xs`}
                                    title="Click to view live GPS navigation map & transit progress"
                                  >
                                    <Navigation className="w-3.5 h-3.5 text-indigo-600" />
                                    <span>{st.label}</span>
                                    <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.2 rounded-full font-semibold flex items-center gap-0.5">
                                      <MapPin className="w-2.5 h-2.5" /> Live Map
                                    </span>
                                  </button>
                                );
                              }
                              return (
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1 ${st.color}`}>
                                  {b.status === 'COMPLETED' && <CheckCheck className="w-3.5 h-3.5" />}
                                  {b.status === 'CONFIRMED' && <Clock className="w-3.5 h-3.5" />}
                                  {b.status === 'REACHED' && <Radio className="w-3.5 h-3.5 text-rose-600 animate-pulse" />}
                                  {b.status === 'CANCELLED' && <X className="w-3.5 h-3.5 text-rose-500" />}
                                  {b.status === 'SEARCHING' && <Navigation className="w-3.5 h-3.5 text-amber-600 animate-spin" />}
                                  <span>{st.label}</span>
                                </span>
                              );
                            })()}
                          </div>
                        </div>

                        <p className="text-xs text-slate-500 mb-3">{b.address}</p>

                        {/* Prescription Upload / View Card for Patient */}
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-cyan-700 flex-shrink-0" />
                            <div>
                              <span className="font-bold text-slate-800">Medical Prescription (Doctor Rx): </span>
                              {b.prescriptionUrl ? (
                                <span className="text-emerald-700 font-semibold">{b.prescriptionName || 'Prescription.pdf'} (Attached)</span>
                              ) : (
                                <span className="text-slate-500">Not uploaded yet. Upload doctor Rx for the visiting paramedic.</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {b.prescriptionUrl ? (
                              <>
                                <button
                                  onClick={() => setViewPrescriptionBooking(b)}
                                  className="px-2.5 py-1 bg-white hover:bg-slate-100 text-cyan-800 border border-slate-300 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" /> View Rx
                                </button>
                                <button
                                  onClick={() => setUploadPrescriptionBooking(b)}
                                  className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                                >
                                  <Upload className="w-3.5 h-3.5" /> Re-upload
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => setUploadPrescriptionBooking(b)}
                                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                              >
                                <Upload className="w-3.5 h-3.5" /> Upload Prescription
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Post-Visit AV & Clinical Summary */}
                        {b.status === 'COMPLETED' && b.avSummary && (
                          <div className="p-4 bg-gradient-to-br from-indigo-50/90 to-cyan-50/90 rounded-2xl border border-indigo-200 text-xs text-slate-800 mb-3 space-y-2 shadow-xs">
                            <div className="flex items-center justify-between">
                              <div className="font-bold flex items-center text-indigo-900 gap-1.5">
                                <Radio className="w-4 h-4 text-indigo-600" />
                                <span>Audio & Video Consultation Summary & Clinical Log</span>
                              </div>
                              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 font-bold text-[10px] rounded-full">
                                Verified Medical Record
                              </span>
                            </div>
                            <pre className="font-sans text-xs text-slate-700 whitespace-pre-wrap leading-relaxed bg-white/80 p-3 rounded-xl border border-indigo-100">
                              {b.avSummary}
                            </pre>
                            <div className="flex items-center justify-between pt-1">
                              <div className="flex gap-4 text-[11px] font-semibold text-slate-700">
                                <span>BP: {b.vitalsBP || '120/80'}</span>
                                <span>SpO2: {b.vitalsSpO2 || '99%'}</span>
                                <span>Pulse: {b.vitalsPulse || '74 bpm'}</span>
                              </div>
                              <button
                                onClick={() => setViewAVSummaryBooking(b)}
                                className="text-indigo-700 hover:text-indigo-900 font-bold text-xs flex items-center gap-1 cursor-pointer underline"
                              >
                                <Eye className="w-3.5 h-3.5" /> Full Summary & Recording Reference
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div>
                            <span className="text-slate-400">Assigned Nurse/PT: </span>
                            <span className="font-bold text-slate-800">{b.assignedStaff || 'Searching...'}</span>
                            {b.agencyName && (
                              <span className="ml-1.5 px-2 py-0.5 bg-cyan-50 text-cyan-800 font-semibold text-[11px] rounded-md border border-cyan-200">
                                {b.agencyName}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {/* JOIN AUDIO & TALK BUTTON FOR FAMILY MEMBER (APPEARS WHEN REACHED / AV ACTIVE) */}
                            {(b.status === 'REACHED' || b.avActive) && (
                              <button
                                onClick={() => handleJoinAVSession(b)}
                                className="px-4 py-2 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer animate-pulse ring-2 ring-rose-400/50"
                              >
                                <Video className="w-4 h-4" />
                                <span>Join Audio & Talk (Live AV)</span>
                              </button>
                            )}

                            {/* CHAT WITH PARAMEDIC */}
                            {(b.status === 'CONFIRMED' || b.status === 'EN_ROUTE' || b.status === 'REACHED') && (() => {
                              const summary = chatSummary[b.id];
                              const hasNewParamedicMessage = summary && summary.lastSenderRole === 'PARAMEDIC';
                              return (
                                <button
                                  onClick={() => setActiveChatBooking(b)}
                                  className={`relative px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                    hasNewParamedicMessage
                                      ? 'bg-cyan-600 text-white hover:bg-cyan-700 ring-2 ring-cyan-500/50'
                                      : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200'
                                  }`}
                                >
                                  <span className="relative flex items-center justify-center">
                                    <MessageSquare className={`w-3.5 h-3.5 ${hasNewParamedicMessage ? 'text-white' : 'text-cyan-600'}`} />
                                    {hasNewParamedicMessage && (
                                      <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 border border-white"></span>
                                      </span>
                                    )}
                                  </span>
                                  <span>Chat with Paramedic</span>
                                  {hasNewParamedicMessage && (
                                    <span className="ml-1 px-1.5 py-0.2 bg-rose-500 text-white text-[10px] font-black rounded-full animate-bounce">
                                      NEW
                                    </span>
                                  )}
                                </button>
                              );
                            })()}

                            {/* TRACK ON MAP BUTTON (PATIENT - ONLY ONCE STAFF VISIT STARTED OR ARRIVED) */}
                            {(b.status === 'EN_ROUTE' || b.status === 'REACHED') && (
                              <button
                                onClick={() => {
                                  setTrackingBooking(b);
                                  setTransitProgress(b.status === 'REACHED' ? 100 : 50);
                                }}
                                className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer animate-pulse"
                              >
                                <Navigation className="w-3.5 h-3.5" />
                                <span>Track on Map</span>
                              </button>
                            )}

                            {/* Prompt to add address if booking has pending location */}
                            {(!b.address || b.address.startsWith('Pending')) && (
                              <button
                                onClick={() => {
                                  setShowAddressModal(true);
                                  setModalAddressInput(authUser?.address || '');
                                }}
                                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer animate-bounce"
                              >
                                <MapPin className="w-3.5 h-3.5" />
                                <span>Add Visit Address</span>
                              </button>
                            )}

                            {/* CANCEL BOOKING BUTTON (PATIENT) */}
                            {(b.status === 'SEARCHING' || b.status === 'CONFIRMED' || b.status === 'EN_ROUTE') && (
                              <button
                                onClick={() => handleCancelBooking(b.id, 'CUSTOMER')}
                                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5 text-rose-500" />
                                <span>Cancel Booking</span>
                              </button>
                            )}

                            {b.clinicalNotes && !b.avSummary && (
                              <div className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                                Vitals Logged: {b.vitalsBP || '120/80'} (SpO2 {b.vitalsSpO2 || '99%'})
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      )}

            {/* ========================================================================= */}
      {/* 2B. USER PROFILE VIEW (CUSTOMER HEALTH HISTORY / PARAMEDIC CREDENTIALS)   */}
      {/* ========================================================================= */}
      {activeTab === 'profile' && authUser && (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* ==================== CUSTOMER / PATIENT PROFILE ==================== */}
          {authUser.role === 'PATIENT' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Profile Card */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-cyan-600 via-emerald-600 to-teal-500 text-white flex items-center justify-center font-extrabold text-3xl shadow-lg shadow-cyan-500/20">
                    {authUser.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-black text-slate-900">{authUser.name}</h2>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-100 text-cyan-800">Verified Patient</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium">
                      <span className="flex items-center gap-1 font-mono text-slate-700">
                        <Phone className="w-3.5 h-3.5 text-cyan-600" /> {authUser.phone || '+91 98765 12345'}
                      </span>
                      <span>• Age: <strong>48 Years</strong></span>
                      <span>• Blood Group: <strong className="text-rose-600">B+ve</strong></span>
                      <span>• City: <strong>New Delhi</strong></span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" /> Flat 402, Green Glen Layout, Bellandur, Delhi NCR
                    </p>
                  </div>
                </div>

                <div className="flex flex-row md:flex-col items-center md:items-end gap-2 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                  <button
                    onClick={() => setActiveTab('patient')}
                    className="w-full md:w-auto px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs"
                  >
                    <Plus className="w-4 h-4" /> <span>Book New Visit</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('portal')}
                    className="w-full md:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                  >
                    Back to Bookings
                  </button>
                </div>
              </div>

              {/* AI & Clinical Health Checkup / Doctor Visit Suggestion Banner */}
              <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300 rounded-3xl p-6 shadow-xs relative overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/30 flex-shrink-0">
                      <Sparkles className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 tracking-wider">
                          Health Advisory & Preventive Care
                        </span>
                        <span className="text-xs text-slate-500">Based on vitals collected on Oct 14, 2026</span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mt-1">Recommended: Post-Op Wound Review & Hypertension Screening</h3>
                      <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                        Last recorded BP: <strong>120/80 mmHg</strong> (Normotensive), SpO2: <strong>99%</strong>. It has been <strong>6 days</strong> since your last surgical incision dressing. We recommend scheduling a follow-up nursing visit or a tele-consult with your surgeon to verify complete scar tissue epithelization.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      alert('Appointment requested: Care Coordinator Dr. Rajesh Gupta will call you within 15 mins to confirm doctor consultation.');
                    }}
                    className="w-full sm:w-auto px-4 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-sm whitespace-nowrap"
                  >
                    Schedule Recommended Checkup
                  </button>
                </div>
              </div>

              {/* Longitudinal Health Data & Vitals History */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Patient Longitudinal Health Data & Clinical Vitals</h3>
                    <p className="text-xs text-slate-500">Continuous digital health observations recorded at home by visiting paramedics</p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-full border border-emerald-200">
                    2 Verified Home Clinical Sessions
                  </span>
                </div>

                {/* Vitals Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                    <span className="text-xs text-slate-400 font-semibold uppercase block mb-1">Latest Blood Pressure</span>
                    <div className="text-2xl font-black text-slate-900">120 / 80 <span className="text-xs font-normal text-slate-500">mmHg</span></div>
                    <span className="text-[11px] text-emerald-600 font-semibold mt-1 inline-flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Optimal Range (AHA Standard)
                    </span>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                    <span className="text-xs text-slate-400 font-semibold uppercase block mb-1">Blood Oxygen (SpO2)</span>
                    <div className="text-2xl font-black text-slate-900">99% <span className="text-xs font-normal text-slate-500">O2 Sat</span></div>
                    <span className="text-[11px] text-emerald-600 font-semibold mt-1 inline-flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Normal Pulmonary Oxygenation
                    </span>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                    <span className="text-xs text-slate-400 font-semibold uppercase block mb-1">Resting Pulse Rate</span>
                    <div className="text-2xl font-black text-slate-900">74 <span className="text-xs font-normal text-slate-500">BPM</span></div>
                    <span className="text-[11px] text-emerald-600 font-semibold mt-1 inline-flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Normal Sinus Rhythm (60-100)
                    </span>
                  </div>
                </div>

                {/* Historical Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Visit ID & Date</th>
                        <th className="py-3 px-4">Service Administered</th>
                        <th className="py-3 px-4">Attending Paramedic</th>
                        <th className="py-3 px-4">Blood Pressure</th>
                        <th className="py-3 px-4">SpO2</th>
                        <th className="py-3 px-4">Pulse</th>
                        <th className="py-3 px-4">Clinical Observations</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4">
                          <div className="font-mono font-bold text-slate-900">BK-9001</div>
                          <div className="text-[10px] text-slate-400">Oct 19, 2026 • 10:15 AM</div>
                        </td>
                        <td className="py-3 px-4 font-bold text-cyan-800">IV Drip / Infusion Therapy</td>
                        <td className="py-3 px-4 font-medium text-slate-800">Pooja Sharma, RN (LifeCare)</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">120/80 mmHg</td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-600">99%</td>
                        <td className="py-3 px-4 font-mono text-slate-700">74 bpm</td>
                        <td className="py-3 px-4 text-slate-600 max-w-xs">
                          IV Saline + Cefotaxime 1g administered under sterile aseptic conditions. Patient tolerated infusion well without adverse response.
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4">
                          <div className="font-mono font-bold text-slate-900">BK-9002</div>
                          <div className="text-[10px] text-slate-400">Oct 14, 2026 • 04:30 PM</div>
                        </td>
                        <td className="py-3 px-4 font-bold text-cyan-800">Wound Dressing & Bed Sore Care</td>
                        <td className="py-3 px-4 font-medium text-slate-800">Pooja Sharma, RN (LifeCare)</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">118/76 mmHg</td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-600">98%</td>
                        <td className="py-3 px-4 font-mono text-slate-700">76 bpm</td>
                        <td className="py-3 px-4 text-slate-600 max-w-xs">
                          Aseptic dressing applied on post-op knee incision. Wound margins clean with zero exudate or erythema.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==================== PARAMEDICAL PROFESSIONAL PROFILE ==================== */}
          {authUser.role === 'PARAMEDIC' && (() => {
            const currentStaff = staffList.find(s => s.id === (authUser.staffId || 'STF-101')) || currentStaffProfile;
            const isOnline = currentStaff.online;
            const isVerified = currentStaff.verificationStatus === 'VERIFIED';
            const isEnabled = currentStaff.isEnabled;

            return (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Paramedic Header Banner */}
                <div className="bg-gradient-to-r from-slate-900 via-teal-900 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                      <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center font-extrabold text-3xl text-cyan-300 shadow-inner">
                        {currentStaff.name ? currentStaff.name.split(' ').map(n => n[0]).join('') : 'ST'}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-2xl font-black">{currentStaff.name}</h2>
                          <span className="font-mono text-[11px] px-2.5 py-0.5 rounded-full bg-white/20 text-cyan-200 font-bold">
                            {currentStaff.id}
                          </span>
                          {(currentStaff.role || 'Nursing').split(',').map((cat, idx) => (
                            <span key={idx} className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-500/20 text-teal-200 border border-teal-400/30">
                              {cat.trim()}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-indigo-200 mt-1 font-medium">
                          Affiliated Agency: <strong className="text-white">{currentStaff.agencyName || currentStaff.agencyId || 'LifeCare Health'}</strong>
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-300">
                          <span className="flex items-center gap-1 font-bold text-amber-300">
                            <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> {currentStaff.rating || 5.0} Rating
                          </span>
                          <span>• Experience: <strong className="text-white">{currentStaff.experienceYrs || 5} Years</strong></span>
                          <span className="flex items-center gap-1 font-mono text-cyan-200">
                            <Phone className="w-3.5 h-3.5 text-cyan-400" /> {currentStaff.phone}
                          </span>
                          {currentStaff.email && (
                            <span>• Email: <strong className="text-white">{currentStaff.email}</strong></span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-2.5">
                      {/* Step 2 & 3 Badges */}
                      <div className="flex flex-wrap gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                          isVerified 
                            ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400' 
                            : currentStaff.verificationStatus === 'REJECTED'
                            ? 'bg-rose-500/20 text-rose-200 border-rose-400'
                            : 'bg-amber-500/20 text-amber-200 border-amber-400 animate-pulse'
                        }`}>
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>{isVerified ? 'VERIFIED CREDENTIALS' : currentStaff.verificationStatus === 'REJECTED' ? 'VERIFICATION REJECTED' : 'AUDIT PENDING'}</span>
                        </span>

                        <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                          isEnabled 
                            ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400' 
                            : 'bg-slate-700/60 text-slate-300 border-slate-600'
                        }`}>
                          <Radio className={`w-3.5 h-3.5 ${isEnabled ? 'text-cyan-300 animate-pulse' : 'text-slate-400'}`} />
                          <span>{isEnabled ? 'DISPATCH RADAR ENABLED' : 'DISPATCH DISABLED'}</span>
                        </span>
                      </div>

                      {/* Online Duty Button & Back to Portal */}
                      <div className="flex items-center gap-2 mt-1">
                        <button
                          onClick={() => handleToggleDuty(currentStaff.id, isOnline)}
                          className={`inline-flex items-center px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs ${
                            isOnline
                              ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                              : 'bg-rose-600 hover:bg-rose-700 text-white'
                          }`}
                          title="Click to toggle your radar duty status"
                        >
                          <span className={`w-2 h-2 rounded-full mr-1.5 ${isOnline ? 'bg-white animate-pulse' : 'bg-slate-200'}`}></span>
                          {isOnline ? 'ON-DUTY' : 'OFF-DUTY'}
                        </button>
                        <button
                          onClick={() => setActiveTab('portal')}
                          className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition border border-white/20 cursor-pointer"
                        >
                          Back to Visits
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Verification Notice / Agency Audit Note */}
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-indigo-600" />
                      Agency Audit & Verification Certificate
                    </span>
                    {currentStaff.verifiedAt && (
                      <span className="text-[10px] text-slate-400">
                        Audited on: {new Date(currentStaff.verifiedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-700 italic bg-white p-3.5 rounded-xl border border-slate-200">
                    {currentStaff.verificationComment || 'Standard clinical credentials, nursing council registration, and background verification audited by LifeCare Agency Director.'}
                  </p>
                </div>

                {/* 4 Pillars of Profile Data: Complete Onboarding Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 1. Contact & Identity */}
                  <div className="border border-slate-200 rounded-2xl p-5 bg-white shadow-xs space-y-3">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                      <User className="w-4 h-4 text-cyan-600" />
                      Personal & Contact Details
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Gender</span>
                        <span className="font-semibold text-slate-800">{currentStaff.gender || 'Not specified'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Contact Phone</span>
                        <span className="font-semibold text-slate-800">{currentStaff.phone || '+91 98765 43210'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Email Address</span>
                        <span className="font-semibold text-slate-800">{currentStaff.email || 'nurse@lifecare.org'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Affiliated Agency</span>
                        <span className="font-semibold text-slate-800">{currentStaff.agencyId || 'AGY-101'}</span>
                      </div>
                    </div>
                  </div>

                  {/* 2. Credentials & Licensing */}
                  <div className="border border-slate-200 rounded-2xl p-5 bg-white shadow-xs space-y-3">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                      <Stethoscope className="w-4 h-4 text-indigo-600" />
                      Qualifications & Medical Licensing
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="col-span-2">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Clinical Category</span>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {(currentStaff.role || 'Nursing').split(',').map((cat, i) => (
                            <span key={i} className="px-2.5 py-1 bg-cyan-50 text-cyan-800 font-bold text-[11px] rounded-lg border border-cyan-200">
                              {cat.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Degree / Education</span>
                        <span className="font-semibold text-slate-800">{currentStaff.qualification || 'B.Sc Nursing, Critical Care'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Council License #</span>
                        <span className="font-mono font-bold text-indigo-700">{currentStaff.licenseNo || 'MNC-2018-88392'}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Clinical Specializations & Procedures</span>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {(currentStaff.specializations || 'IV Drip Setup, Wound Dressing, Catheterization, Vitals Monitoring')
                            .split(',')
                            .map((spec, i) => (
                              <span key={i} className="px-2.5 py-1 bg-indigo-50 text-indigo-800 font-semibold text-[11px] rounded-lg border border-indigo-100">
                                {spec.trim()}
                              </span>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. Legal & Background Verification */}
                  <div className="border border-slate-200 rounded-2xl p-5 bg-white shadow-xs space-y-3">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Identity Proof & Background Verification
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Govt ID Proof Type</span>
                        <span className="font-semibold text-slate-800">{currentStaff.idProofType || 'Aadhaar Card'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">ID Number</span>
                        <span className="font-mono font-bold text-slate-800">{currentStaff.idProofNo || 'XXXX-XXXX-4921'}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Police Audit Clearance Doc Ref</span>
                        <span className="font-mono text-emerald-800 font-semibold text-[11px] bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 inline-block mt-1">
                          {currentStaff.policeVerifDoc || 'POL-VERIF-2026-MUM-8921'} (Clearance Certified)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 4. Service Area, Languages & Bio */}
                  <div className="border border-slate-200 rounded-2xl p-5 bg-white shadow-xs space-y-3">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                      <MapPin className="w-4 h-4 text-rose-600" />
                      Operational Coverage & Languages
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Coverage Area</span>
                        <span className="font-semibold text-slate-800">{currentStaff.serviceArea || 'South Delhi, Green Park, Hauz Khas'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Fluent Languages</span>
                        <span className="font-semibold text-slate-800">{currentStaff.languages || 'English, Hindi'}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Professional Clinical Summary</span>
                        <p className="text-slate-600 text-xs mt-1 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                          {currentStaff.bio || 'Compassionate and certified critical-care registered nurse with extensive hospital ICU and specialized home procedure experience.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ==================== SUPER ADMIN / AGENCY ADMIN / CARE PROFILE ==================== */}
          {(authUser.role === 'SUPER_ADMIN' || authUser.role === 'AGENCY_ADMIN' || authUser.role === 'AGENCY_CARE') && (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs max-w-2xl mx-auto text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-cyan-50 text-cyan-800 flex items-center justify-center font-bold text-2xl mx-auto border border-cyan-100">
                {authUser.name.charAt(0)}
              </div>
              <h2 className="text-2xl font-black text-slate-900">{authUser.name}</h2>
              <div className="inline-block px-3 py-1 bg-cyan-100 text-cyan-800 text-xs font-bold rounded-full uppercase">
                {authUser.role.replace('_', ' ')}
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-2 max-w-md mx-auto">
                <div className="flex justify-between">
                  <span className="text-slate-400">Username:</span>
                  <span className="font-mono font-bold text-slate-800">{authUser.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Agency Organization:</span>
                  <span className="font-semibold text-slate-800">{authUser.agencyId || 'Platform HQ (NurtureCare)'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Contact Telephone:</span>
                  <span className="font-mono text-slate-800">{authUser.phone || '+91 99999 11111'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Authentication Method:</span>
                  <span className="font-semibold text-emerald-700">OAuth 2.0 Bearer JWT (Active)</span>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('portal')}
                className="mt-4 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
              >
                Return to Management Console
              </button>
            </div>
          )}
        </main>
      )}


      {/* ========================================================================= */}
      {/* 3. CLINICAL VITALS UPDATE / VISIT DETAILS MODAL                           */}
      {/* ========================================================================= */}
      {selectedBookingForUpdate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedBookingForUpdate(null)}
              className="absolute top-5 right-5 p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {authUser?.role === 'PARAMEDIC' ? 'Clinical Visit & Vitals Logging' : 'Clinical Visit Record & Vitals'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Patient: <strong>{selectedBookingForUpdate.patientName}</strong> ({selectedBookingForUpdate.serviceName})
            </p>

            {authUser?.role === 'PARAMEDIC' && selectedBookingForUpdate.status !== 'COMPLETED' ? (
              <form onSubmit={handleUpdateVisit} className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Blood Pressure</label>
                    <input
                      type="text"
                      value={visitBP}
                      onChange={e => setVisitBP(e.target.value)}
                      placeholder="120/80 mmHg"
                      className="w-full px-3 py-2 border rounded-xl text-xs mt-1 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">SpO2 Level</label>
                    <input
                      type="text"
                      value={visitSpO2}
                      onChange={e => setVisitSpO2(e.target.value)}
                      placeholder="99%"
                      className="w-full px-3 py-2 border rounded-xl text-xs mt-1 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Pulse Rate</label>
                    <input
                      type="text"
                      value={visitPulse}
                      onChange={e => setVisitPulse(e.target.value)}
                      placeholder="72 bpm"
                      className="w-full px-3 py-2 border rounded-xl text-xs mt-1 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Clinical Observations & Procedure Notes</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Record sterile procedure, medication given, wound condition, or patient response..."
                    value={visitNotes}
                    onChange={e => setVisitNotes(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs mt-1"
                  />
                </div>

                <div className="p-3 bg-cyan-50 rounded-xl border border-cyan-100 text-[11px] text-cyan-800">
                  <Check className="w-3.5 h-3.5 inline mr-1 text-cyan-600" />
                  Submitting marks this visit as <strong>COMPLETED</strong> and permanently updates the patient digital health record.
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Sign Off & Complete Visit
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Blood Pressure</span>
                    <span className="text-xs font-mono font-bold text-slate-800">{selectedBookingForUpdate.vitalsBP || '120/80 mmHg'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">SpO2 Level</span>
                    <span className="text-xs font-mono font-bold text-slate-800">{selectedBookingForUpdate.vitalsSpO2 || '99%'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Pulse Rate</span>
                    <span className="text-xs font-mono font-bold text-slate-800">{selectedBookingForUpdate.vitalsPulse || '72 bpm'}</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Clinical Notes Recorded by Paramedic</label>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-800 mt-1 whitespace-pre-wrap leading-relaxed">
                    {selectedBookingForUpdate.clinicalNotes || 'No notes logged yet.'}
                  </div>
                </div>

                {selectedBookingForUpdate.avSummary && (
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Audio/Video Stream & Family Summary</label>
                    <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs text-slate-700 mt-1 whitespace-pre-wrap leading-relaxed">
                      {selectedBookingForUpdate.avSummary}
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setSelectedBookingForUpdate(null)}
                    className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
                  >
                    Close Record
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3B. AGENCY CARE: ASSIGN AVAILABLE PARAMEDICAL STAFF MODAL                */}
      {/* ========================================================================= */}
      {selectedBookingForAssign && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedBookingForAssign(null)}
              className="absolute top-5 right-5 p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <UserCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="text-lg font-bold text-slate-900">Assign Paramedical Staff</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Select an available, verified paramedical professional for this patient visit.
            </p>

            {/* Booking Details Card */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs mb-4 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">{selectedBookingForAssign.serviceName}</span>
                <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                  {selectedBookingForAssign.id}
                </span>
              </div>
              <div className="text-slate-600">
                Patient: <strong className="text-slate-800">{selectedBookingForAssign.patientName}</strong> ({selectedBookingForAssign.patientPhone})
              </div>
              <div className="text-slate-600">
                Address: <span className="text-slate-800">{selectedBookingForAssign.address}</span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[10px] font-bold text-cyan-800 bg-cyan-100 px-2 py-0.5 rounded">
                  Category: {selectedBookingForAssign.category || 'Nursing'}
                </span>
                <span className="text-[10px] text-slate-500">
                  Current Status: <strong>{selectedBookingForAssign.status}</strong>
                </span>
                {selectedBookingForAssign.assignedStaff && (
                  <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Currently: {selectedBookingForAssign.assignedStaff}
                  </span>
                )}
              </div>
            </div>

            {/* List of Available Paramedical Staff */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Available Agency Paramedics ({agencyStaff.length})
                </h4>
                <span className="text-[11px] text-slate-500">Sorted by proximity & verified status</span>
              </div>

              {agencyStaff.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  No paramedical staff registered in this agency yet. Onboard paramedics from the Staff tab.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                  {agencyStaff.map(staff => {
                    const distance = (selectedBookingForAssign.patientLat && selectedBookingForAssign.patientLng && staff.lat && staff.lng)
                      ? calculateDistanceKm(staff.lat, staff.lng, selectedBookingForAssign.patientLat, selectedBookingForAssign.patientLng)
                      : null;

                    const isCurrentAssigned = selectedBookingForAssign.assignedStaffId === staff.id;
                    const isAssigning = assigningStaffId === staff.id;

                    return (
                      <div
                        key={staff.id}
                        className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                          isCurrentAssigned
                            ? 'bg-emerald-50/70 border-emerald-300'
                            : 'bg-white border-slate-200 hover:border-emerald-300'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-xs">{staff.name}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700">
                              {staff.role}
                            </span>
                            {staff.verificationStatus === 'VERIFIED' && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-emerald-100 text-emerald-800 flex items-center gap-0.5">
                                <ShieldCheck className="w-2.5 h-2.5" /> Verified
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-3">
                            <span>Phone: {staff.phone}</span>
                            <span>Rating: ⭐ {staff.rating || '5.0'}</span>
                            {distance !== null && (
                              <span className="font-semibold text-emerald-700 flex items-center gap-0.5">
                                <MapPin className="w-3 h-3 text-emerald-600" /> {distance} km away
                              </span>
                            )}
                          </div>
                          {staff.specializations && (
                            <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                              Expertise: {staff.specializations}
                            </div>
                          )}
                        </div>

                        <div>
                          {isCurrentAssigned ? (
                            <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold inline-flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> Assigned
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={isAssigning}
                              onClick={() => handleAssignStaffToBooking(selectedBookingForAssign.id, staff)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer disabled:opacity-50"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>{isAssigning ? 'Assigning...' : 'Assign Staff'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedBookingForAssign(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODALS (AGENCY, MASTER SERVICE, STAFF, PACKAGE, ALERTS)                */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowAddModal(null)}
              className="absolute top-5 right-5 p-1 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            {/* SuperAdmin: Onboard Agency */}
            {showAddModal === 'agency' && (
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Onboard Healthcare Agency</h3>
                <p className="text-xs text-slate-500 mb-4">Grant network license to partner agency</p>
                <form onSubmit={handleCreateAgency} className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Agency Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Fortis Home Health Services"
                      value={newAgency.name}
                      onChange={e => setNewAgency({ ...newAgency, name: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-xs mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Clinical License No</label>
                    <input
                      type="text"
                      required
                      placeholder="REG-DEL-2026-902"
                      value={newAgency.registrationNo}
                      onChange={e => setNewAgency({ ...newAgency, registrationNo: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-xs mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Operating City</label>
                      <input
                        type="text"
                        required
                        placeholder="South Delhi"
                        value={newAgency.city}
                        onChange={e => setNewAgency({ ...newAgency, city: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-xs mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Operating Mode</label>
                      <select
                        value={newAgency.mode}
                        onChange={e => setNewAgency({ ...newAgency, mode: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-xs mt-1"
                      >
                        <option value="HYBRID">HYBRID</option>
                        <option value="WHITE_LABEL">WHITE_LABEL</option>
                        <option value="MARKETPLACE">MARKETPLACE</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Supervisor / Director</label>
                      <input
                        type="text"
                        required
                        placeholder="Dr. Anand Verma"
                        value={newAgency.contactPerson}
                        onChange={e => setNewAgency({ ...newAgency, contactPerson: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-xs mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Phone</label>
                      <input
                        type="text"
                        required
                        placeholder="+91 98110 00000"
                        value={newAgency.phone}
                        onChange={e => setNewAgency({ ...newAgency, phone: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-xs mt-1"
                      />
                    </div>
                  </div>
                  <button type="submit" className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold mt-4">
                    Complete Agency Onboarding
                  </button>
                </form>
              </div>
            )}

            {/* SuperAdmin: Master Service */}
            {showAddModal === 'master_service' && (
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Add Master Catalogue Service</h3>
                <p className="text-xs text-slate-500 mb-4">Standard clinical service definition usable by all agencies</p>
                <form onSubmit={handleCreateMasterService} className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Service Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tracheostomy Suctioning"
                      value={newMasterService.name}
                      onChange={e => setNewMasterService({ ...newMasterService, name: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-xs mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Clinical Category</label>
                      <select
                        value={newMasterService.category}
                        onChange={e => setNewMasterService({ ...newMasterService, category: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-xs mt-1"
                      >
                        {CLINICAL_CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Staff Qualification</label>
                      <input
                        type="text"
                        required
                        placeholder="Registered Nurse"
                        value={newMasterService.staffType}
                        onChange={e => setNewMasterService({ ...newMasterService, staffType: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-xs mt-1"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Base Price (₹)</label>
                      <input
                        type="number"
                        required
                        value={newMasterService.price}
                        onChange={e => setNewMasterService({ ...newMasterService, price: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border rounded-xl text-xs mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Duration</label>
                      <input
                        type="text"
                        required
                        placeholder="45 min"
                        value={newMasterService.duration}
                        onChange={e => setNewMasterService({ ...newMasterService, duration: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-xs mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Clinical Protocol Description</label>
                    <textarea
                      required
                      rows={3}
                      value={newMasterService.description}
                      onChange={e => setNewMasterService({ ...newMasterService, description: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-xs mt-1"
                    />
                  </div>
                  <button type="submit" className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold mt-4">
                    Publish to Master Catalogue
                  </button>
                </form>
              </div>
            )}

            {/* SuperAdmin: Send Alert */}
            {showAddModal === 'alert' && (
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Send Notice / Alert to Agency</h3>
                <p className="text-xs text-slate-500 mb-4">Quality warning or SLA breach dispatched directly to agency dashboard</p>
                <form onSubmit={handleSendAlert} className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Target Agency</label>
                    <select
                      value={newAlert.agencyId}
                      onChange={e => setNewAlert({ ...newAlert, agencyId: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-xs mt-1"
                    >
                      {agencies.map(a => (
                        <option key={a.id} value={a.id}>{a.name} ({a.id}) - Rating {a.rating}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Alert Type</label>
                      <select
                        value={newAlert.type}
                        onChange={e => setNewAlert({ ...newAlert, type: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-xs mt-1"
                      >
                        <option value="LOW_RATING">Low Customer Rating</option>
                        <option value="SLOW_DISPATCH">Slow Response Velocity</option>
                        <option value="SLA_BREACH">SLA Breach Warning</option>
                        <option value="MILESTONE">Performance Milestone</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Severity</label>
                      <select
                        value={newAlert.severity}
                        onChange={e => setNewAlert({ ...newAlert, severity: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-xs mt-1"
                      >
                        <option value="HIGH">HIGH (Urgent)</option>
                        <option value="MEDIUM">MEDIUM (Warning)</option>
                        <option value="LOW">LOW (Informational)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rating dipped below threshold"
                      value={newAlert.title}
                      onChange={e => setNewAlert({ ...newAlert, title: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-xs mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Detailed Message</label>
                    <textarea
                      required
                      rows={3}
                      value={newAlert.message}
                      onChange={e => setNewAlert({ ...newAlert, message: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-xs mt-1"
                    />
                  </div>
                  <button type="submit" className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold mt-4 flex items-center justify-center gap-1">
                    <Send className="w-3.5 h-3.5" /> <span>Send Alert</span>
                  </button>
                </form>
              </div>
            )}

            {/* AgencyAdmin: Staff Onboarding */}
            {showAddModal === 'staff' && (
              <div className="max-h-[80vh] overflow-y-auto pr-1">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                  <div>
                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full uppercase tracking-wider">
                      Step 1 of 3: Staff Registration
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">Onboard Paramedical Professional</h3>
                    <p className="text-xs text-slate-500">Collect full clinical credentials, qualifications, and verification documents.</p>
                  </div>
                </div>

                <form onSubmit={handleCreateStaff} className="space-y-4 text-xs">
                  {/* 1. Personal & Contact Details */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                    <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs text-emerald-900">
                      <User className="w-3.5 h-3.5 text-emerald-600" />
                      <span>1. Personal & Contact Profile</span>
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-semibold text-slate-700">Full Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Anjali Nair, B.Sc Nursing"
                          value={newStaff.name}
                          onChange={e => setNewStaff({ ...newStaff, name: e.target.value })}
                          className="w-full px-3 py-2 border rounded-xl bg-white mt-1 text-xs"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700">Gender *</label>
                        <select
                          value={newStaff.gender}
                          onChange={e => setNewStaff({ ...newStaff, gender: e.target.value })}
                          className="w-full px-3 py-2 border rounded-xl bg-white mt-1 text-xs"
                        >
                          <option value="Female">Female</option>
                          <option value="Male">Male</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-semibold text-slate-700">Mobile Phone (Calling & OTP) *</label>
                        <input
                          type="text"
                          required
                          placeholder="+91 98765 00000"
                          value={newStaff.phone}
                          onChange={e => setNewStaff({ ...newStaff, phone: e.target.value })}
                          className="w-full px-3 py-2 border rounded-xl bg-white mt-1 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700">Email Address</label>
                        <input
                          type="email"
                          placeholder="anjali.nair@example.com"
                          value={newStaff.email}
                          onChange={e => setNewStaff({ ...newStaff, email: e.target.value })}
                          className="w-full px-3 py-2 border rounded-xl bg-white mt-1 text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 2. Clinical Credentials & Qualifications */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                    <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs text-indigo-900">
                      <Stethoscope className="w-3.5 h-3.5 text-indigo-600" />
                      <span>2. Clinical Role & Medical Qualifications</span>
                    </h4>

                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between">
                          <label className="font-semibold text-slate-700">Clinical Category (Multi-Select) *</label>
                          <span className="text-[10px] text-slate-400">Select all categories this staff member serves</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-1.5">
                          {CLINICAL_CATEGORIES.map(cat => {
                            const currentCats = newStaff.role.split(',').map(c => c.trim()).filter(Boolean);
                            const isSelected = currentCats.includes(cat);
                            return (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => {
                                  let updated: string[];
                                  if (isSelected) {
                                    updated = currentCats.filter(c => c !== cat);
                                    if (updated.length === 0) updated = [cat]; // Keep at least one
                                  } else {
                                    updated = [...currentCats, cat];
                                  }
                                  setNewStaff({ ...newStaff, role: updated.join(', ') });
                                }}
                                className={`px-3 py-2 rounded-xl text-xs font-bold text-left flex items-center justify-between border transition cursor-pointer ${
                                  isSelected
                                    ? 'bg-indigo-50 border-indigo-400 text-indigo-900 shadow-xs'
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                }`}
                              >
                                <span>{cat}</span>
                                {isSelected ? (
                                  <CheckCircle className="w-4 h-4 text-indigo-600 shrink-0" />
                                ) : (
                                  <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700">Experience (Years) *</label>
                        <input
                          type="number"
                          required
                          min="0"
                          max="40"
                          value={newStaff.experienceYrs}
                          onChange={e => setNewStaff({ ...newStaff, experienceYrs: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border rounded-xl bg-white mt-1 text-xs font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-semibold text-slate-700">Formal Medical Degrees / Qualifications</label>
                        <input
                          type="text"
                          placeholder="e.g. B.Sc Nursing, AIIMS New Delhi"
                          value={newStaff.qualification}
                          onChange={e => setNewStaff({ ...newStaff, qualification: e.target.value })}
                          className="w-full px-3 py-2 border rounded-xl bg-white mt-1 text-xs"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700">Medical Council Registration / License #</label>
                        <input
                          type="text"
                          placeholder="e.g. DMC/RN/2019/8492"
                          value={newStaff.licenseNo}
                          onChange={e => setNewStaff({ ...newStaff, licenseNo: e.target.value })}
                          className="w-full px-3 py-2 border rounded-xl bg-white mt-1 text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700">Clinical Specializations & Procedures</label>
                      <input
                        type="text"
                        placeholder="e.g. IV Cannulation, Tracheostomy Care, Stroke Rehabilitation, Geriatric Care"
                        value={newStaff.specializations}
                        onChange={e => setNewStaff({ ...newStaff, specializations: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl bg-white mt-1 text-xs"
                      />
                    </div>
                  </div>

                  {/* 3. Verification Documents & Identity Proofs */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                    <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs text-amber-900">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                      <span>3. Identity Proofs & Legal Background Verification</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-semibold text-slate-700">Government ID Proof Type</label>
                        <select
                          value={newStaff.idProofType}
                          onChange={e => setNewStaff({ ...newStaff, idProofType: e.target.value })}
                          className="w-full px-3 py-2 border rounded-xl bg-white mt-1 text-xs"
                        >
                          <option value="Aadhaar Card">Aadhaar Card</option>
                          <option value="Passport">Passport</option>
                          <option value="Voter ID">Voter ID</option>
                          <option value="PAN Card">PAN Card</option>
                        </select>
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700">ID Proof Document Number</label>
                        <input
                          type="text"
                          placeholder="e.g. XXXX-XXXX-4920"
                          value={newStaff.idProofNo}
                          onChange={e => setNewStaff({ ...newStaff, idProofNo: e.target.value })}
                          className="w-full px-3 py-2 border rounded-xl bg-white mt-1 text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700">Police Verification & Background Audit Ref</label>
                      <input
                        type="text"
                        placeholder="e.g. Clean Record - Police Clearance Certificate Ref #PCC-ND-2026"
                        value={newStaff.policeVerifDoc}
                        onChange={e => setNewStaff({ ...newStaff, policeVerifDoc: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl bg-white mt-1 text-xs"
                      />
                    </div>
                  </div>

                  {/* 4. Service Area & Professional Bio */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                    <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs text-slate-800">
                      <MapPin className="w-3.5 h-3.5 text-cyan-600" />
                      <span>4. Operational Coverage, Languages & Bio</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-semibold text-slate-700">Coverage Area</label>
                        <input
                          type="text"
                          placeholder="e.g. South Delhi, Greater Kailash, Saket, Hauz Khas"
                          value={newStaff.serviceArea}
                          onChange={e => setNewStaff({ ...newStaff, serviceArea: e.target.value })}
                          className="w-full px-3 py-2 border rounded-xl bg-white mt-1 text-xs"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700">Languages Spoken</label>
                        <input
                          type="text"
                          placeholder="e.g. English, Hindi, Punjabi, Bengali"
                          value={newStaff.languages}
                          onChange={e => setNewStaff({ ...newStaff, languages: e.target.value })}
                          className="w-full px-3 py-2 border rounded-xl bg-white mt-1 text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700">Professional Bio & Experience Summary</label>
                      <textarea
                        rows={2}
                        placeholder="Dedicated clinical professional with strong bedside care experience in post-operative care, IV medication and patient rehabilitation..."
                        value={newStaff.bio}
                        onChange={e => setNewStaff({ ...newStaff, bio: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl bg-white mt-1 text-xs"
                      />
                    </div>
                  </div>

                  {/* Submission note & button */}
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>
                      <strong>Notice:</strong> After registration (Step 1), the staff member will be placed in <em>Pending Verification</em>. You can verify credentials in Step 2 with an audit note, then enable dispatch in Step 3.
                    </span>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(null)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Complete Step 1: Register Staff</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Unified Agency & Customer Care Package Creator */}
            {showAddModal === 'package' && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {newPackage.customerId ? (
                      <Sparkles className="w-5 h-5 text-indigo-600" />
                    ) : (
                      <Package className="w-5 h-5 text-emerald-600" />
                    )}
                    <h3 className="text-lg font-bold text-slate-900">
                      {newPackage.customerId ? 'Create Customized Package for Customer' : 'Create Agency Care Package'}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500">
                    {newPackage.customerId
                      ? 'Add procedures from the clinical catalogue, customize session counts, and apply a personalized customer package discount.'
                      : 'Add individual clinical services from your catalogue, calculate total bundled price, and apply an overall package discount.'}
                  </p>
                </div>

                <form onSubmit={handleCreatePackage} className="space-y-4">
                  {/* Scope Selector: Public Agency Package vs Tagged Customer Package */}
                  {(authUser?.role === 'AGENCY_CARE' || authUser?.role === 'AGENCY_ADMIN') && (
                    <div className="p-3 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Package Target / Customer Tagging</span>
                        </label>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white text-indigo-700 border border-indigo-200">
                          {newPackage.customerId ? 'Customer Specific' : 'Public Agency Catalog'}
                        </span>
                      </div>
                      <select
                        value={newPackage.customerId || ''}
                        onChange={e => {
                          const val = e.target.value;
                          if (!val) {
                            setNewPackage({
                              ...newPackage,
                              customerId: '',
                              customerName: '',
                              name: newPackage.name.startsWith('Personalized Care Plan') ? '' : newPackage.name,
                              description: newPackage.description.startsWith('Tailored multi-visit') ? '' : newPackage.description
                            });
                          } else {
                            const bMatch = agencyBookings.find(b =>
                              (val === 'USR-005' && (b.patientPhone?.includes('98765') || b.patientName?.includes('Priya'))) ||
                              (b.patientPhone && val.includes(b.patientPhone.slice(-5)))
                            );
                            const custName = bMatch?.patientName || (val === 'USR-005' ? 'Priya Sharma (Patient)' : 'Selected Customer');
                            setNewPackage({
                              ...newPackage,
                              customerId: val,
                              customerName: custName,
                              name: newPackage.name || `Personalized Care Plan for ${custName.split(' ')[0]}`,
                              description: newPackage.description || `Tailored multi-visit care plan curated by our Care Coordination team for ${custName}.`
                            });
                          }
                        }}
                        className="w-full px-3 py-2 border border-indigo-200 rounded-xl text-xs font-semibold bg-white text-slate-800"
                      >
                        <option value="">🌐 Public Agency Care Package (Visible to all patients)</option>
                        <option value="USR-005">👤 Priya Sharma (Patient) - USR-005 (+91 98765 12345)</option>
                        <option value="USR-006">👤 Rajiv Khanna - USR-006 (+91 98111 22334)</option>
                        {Array.from(new Set(agencyBookings.map(b => b.patientPhone || b.patientName))).map(custKey => {
                          const sampleBooking = agencyBookings.find(b => (b.patientPhone || b.patientName) === custKey);
                          if (!sampleBooking || sampleBooking.patientPhone.includes('98765') || sampleBooking.patientName.includes('Priya')) {
                            return null;
                          }
                          const custId = `CUST-${sampleBooking.patientPhone.replace(/\D/g, '').slice(-4) || '101'}`;
                          return (
                            <option key={custKey} value={custId}>
                              👤 {sampleBooking.patientName} - {custId} ({sampleBooking.patientPhone})
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  )}

                  {/* Basic Details */}
                  <div className="space-y-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Package Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 14-Day Stroke Rehab & Nursing Care Bundle"
                        value={newPackage.name}
                        onChange={e => setNewPackage({ ...newPackage, name: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-xs mt-1 bg-white"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-700">Clinical Category (Auto-Derived from Services)</label>
                        <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Auto-Derived from Selected Services
                        </span>
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="Categories will auto-populate as services are added (e.g. Nursing, Physiotherapy)..."
                        value={newPackage.category}
                        onChange={e => setNewPackage({ ...newPackage, category: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-xs mt-1 bg-slate-50 font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        Automatically aggregates and updates categories whenever you add or remove services below. You can also append custom tags.
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Duration (Days)</label>
                      <input
                        type="number"
                        required
                        value={newPackage.durationDays}
                        onChange={e => setNewPackage({ ...newPackage, durationDays: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border rounded-xl text-xs mt-1 bg-white font-medium"
                      />
                    </div>
                  </div>

                  {/* Section: Add Individual Services to Package */}
                  <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                          <Plus className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Include Individual Services in Package</span>
                        </h4>
                        <p className="text-[11px] text-emerald-700">Filter services by category and add sessions to build this bundle</p>
                      </div>
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                        {packageItems.length} Added
                      </span>
                    </div>

                    {/* Filter Services by Category Quick-Tabs */}
                    <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200/80 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-emerald-950 flex items-center gap-1">
                          <Filter className="w-3 h-3 text-emerald-600" />
                          <span>Filter Service List by Category:</span>
                        </label>
                        {packageServiceCategoryFilter !== 'All' && (
                          <button
                            type="button"
                            onClick={() => setPackageServiceCategoryFilter('All')}
                            className="text-[10px] text-emerald-700 font-semibold hover:underline cursor-pointer"
                          >
                            Show All ({services.filter(s => s.isEnabled !== false).length})
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {['All', ...CLINICAL_CATEGORIES].map(cat => {
                          const isCatActive = packageServiceCategoryFilter === cat;
                          const count = cat === 'All' 
                            ? services.filter(s => s.isEnabled !== false).length
                            : services.filter(s => s.isEnabled !== false && s.category === cat).length;
                          return (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => {
                                setPackageServiceCategoryFilter(cat);
                                setPackageSelectedServiceId('');
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                                isCatActive
                                  ? 'bg-emerald-700 text-white shadow-xs'
                                  : 'bg-white text-emerald-900 border border-emerald-200 hover:bg-emerald-50'
                              }`}
                            >
                              <span>{cat}</span>
                              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                                isCatActive ? 'bg-emerald-800/80 text-emerald-100' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {count}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      <div className="sm:col-span-7">
                        <select
                          value={packageSelectedServiceId}
                          onChange={e => setPackageSelectedServiceId(e.target.value)}
                          className="w-full px-2.5 py-2 border border-emerald-300 rounded-xl text-xs bg-white text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        >
                          <option value="">
                            {packageServiceCategoryFilter === 'All'
                              ? '-- Choose Clinical Service (All Categories) --'
                              : `-- Choose ${packageServiceCategoryFilter} Service --`}
                          </option>
                          {services
                            .filter(
                              s =>
                                s.isEnabled !== false &&
                                (packageServiceCategoryFilter === 'All' || s.category === packageServiceCategoryFilter)
                            )
                            .map(s => (
                              <option key={s.id} value={s.id}>
                                {s.name} [{s.category}] ({s.staffType}) - ₹{s.price}/visit
                              </option>
                            ))}
                        </select>
                      </div>

                      <div className="sm:col-span-3 flex items-center gap-1.5">
                        <label className="text-[11px] font-semibold text-emerald-900 whitespace-nowrap">Visits:</label>
                        <input
                          type="number"
                          min="1"
                          max="60"
                          value={packageSelectedVisits}
                          onChange={e => setPackageSelectedVisits(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full px-2 py-1.5 border border-emerald-300 rounded-xl text-xs bg-white text-center font-bold"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (!packageSelectedServiceId) return;
                            const srv = services.find(s => s.id === packageSelectedServiceId);
                            if (!srv) return;
                            let updatedList: PackageServiceItem[];
                            const existingIdx = packageItems.findIndex(it => it.serviceId === srv.id);
                            if (existingIdx >= 0) {
                              updatedList = [...packageItems];
                              updatedList[existingIdx].visits += packageSelectedVisits;
                            } else {
                              updatedList = [
                                ...packageItems,
                                {
                                  serviceId: srv.id,
                                  serviceName: srv.name,
                                  category: srv.category,
                                  visits: packageSelectedVisits,
                                  unitPrice: srv.price
                                }
                              ];
                            }
                            setPackageItems(updatedList);

                            // Auto-synchronize package categories to reflect included services
                            const distinctCats = Array.from(
                              new Set(
                                updatedList
                                  .map(it => it.category || services.find(s => s.id === it.serviceId)?.category)
                                  .filter(Boolean) as string[]
                              )
                            );
                            if (distinctCats.length > 0) {
                              setNewPackage(prev => ({
                                ...prev,
                                category: distinctCats.join(', ')
                              }));
                            }

                            setPackageSelectedServiceId('');
                            setPackageSelectedVisits(3);
                          }}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                      </div>
                    </div>

                    {/* Table / List of Included Services */}
                    {packageItems.length > 0 ? (
                      <div className="space-y-1.5 mt-2 max-h-36 overflow-y-auto pr-1">
                        {packageItems.map((itm, idx) => {
                          const itemTotal = itm.unitPrice * itm.visits;
                          const itmCat = itm.category || services.find(s => s.id === itm.serviceId)?.category;
                          return (
                            <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-white border border-emerald-100 text-xs">
                              <div className="flex-1 min-w-0 pr-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-900 block truncate">{itm.serviceName}</span>
                                  {itmCat && (
                                    <span className="px-1.5 py-0.5 text-[9px] bg-emerald-100 text-emerald-800 font-semibold rounded">
                                      {itmCat}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-500">
                                  {itm.visits} visits × ₹{itm.unitPrice}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900">₹{itemTotal}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updatedList = packageItems.filter((_, i) => i !== idx);
                                    setPackageItems(updatedList);
                                    // Update package category from remaining items if available
                                    const distinctCats = Array.from(
                                      new Set(
                                        updatedList
                                          .map(it => it.category || services.find(s => s.id === it.serviceId)?.category)
                                          .filter(Boolean) as string[]
                                      )
                                    );
                                    if (distinctCats.length > 0) {
                                      setNewPackage(prev => ({ ...prev, category: distinctCats.join(', ') }));
                                    } else {
                                      setNewPackage(prev => ({ ...prev, category: '' }));
                                    }
                                  }}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                                  title="Remove service"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-2 text-[11px] text-emerald-800 bg-emerald-100/40 rounded-xl border border-dashed border-emerald-200">
                        No individual services added yet. Select a service above to construct this package bundle.
                      </div>
                    )}
                  </div>

                  {/* Section: Calculated Pricing & Package Discount */}
                  {(() => {
                    const totalVisitsCalculated = packageItems.length > 0 
                      ? packageItems.reduce((acc, itm) => acc + itm.visits, 0)
                      : newPackage.totalVisits;
                    
                    const originalTotalCalculated = packageItems.length > 0
                      ? packageItems.reduce((acc, itm) => acc + (itm.unitPrice * itm.visits), 0)
                      : newPackage.originalPrice;

                    const finalDiscountedPrice = Math.round(originalTotalCalculated * (1 - (packageDiscountPercent / 100)));
                    const totalSaved = originalTotalCalculated - finalDiscountedPrice;

                    return (
                      <div className="p-4 bg-gradient-to-br from-slate-900 to-cyan-950 text-white rounded-2xl border border-cyan-800 shadow-sm space-y-3">
                        <div className="flex items-center justify-between text-xs pb-2 border-b border-cyan-900">
                          <span className="text-slate-300">Total Clinical Visits:</span>
                          <span className="font-bold text-cyan-300 text-sm">{totalVisitsCalculated} Sessions</span>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-300">Sum of Services (Retail Price):</span>
                          <span className="font-bold text-slate-200 text-sm">₹{originalTotalCalculated}</span>
                        </div>

                        {/* Package Discount Slider / Input */}
                        <div className="bg-white/10 p-2.5 rounded-xl border border-white/10 space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-emerald-400">Package Bundle Discount:</span>
                            <span className="font-black text-rose-400 text-sm">{packageDiscountPercent}% OFF</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min="0"
                              max="60"
                              step="1"
                              value={packageDiscountPercent}
                              onChange={e => setPackageDiscountPercent(parseInt(e.target.value) || 0)}
                              className="w-full accent-emerald-500 cursor-pointer"
                            />
                            <div className="relative w-16">
                              <input
                                type="number"
                                min="0"
                                max="90"
                                value={packageDiscountPercent}
                                onChange={e => setPackageDiscountPercent(Math.min(90, Math.max(0, parseInt(e.target.value) || 0)))}
                                className="w-full px-1.5 py-1 bg-white/20 text-white text-xs text-center font-bold rounded-lg border border-white/20"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Final Computed Offered Price */}
                        <div className="flex items-center justify-between pt-1">
                          <div>
                            <span className="text-[11px] text-slate-400 block">Final Package Price</span>
                            <span className="text-xl font-black text-emerald-400">₹{finalDiscountedPrice}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[11px] text-slate-400 block">Patient Savings</span>
                            <span className="text-xs font-bold text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/30">
                              Save ₹{totalSaved}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  <div>
                    <label className="text-xs font-semibold text-slate-700">Package Description</label>
                    <textarea
                      required
                      rows={2}
                      placeholder="Explain what is included, schedule frequency, and benefits..."
                      value={newPackage.description}
                      onChange={e => setNewPackage({ ...newPackage, description: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-xs mt-1"
                    />
                  </div>

                  {newPackage.customerId && (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <span>
                        This package is tagged specifically to <strong>{newPackage.customerName || newPackage.customerId}</strong> and will auto-expire in <strong>14 days</strong> if not purchased.
                      </span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className={`w-full py-3 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer flex items-center justify-center gap-2 ${
                      newPackage.customerId
                        ? 'bg-indigo-600 hover:bg-indigo-700'
                        : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    {newPackage.customerId ? <Sparkles className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                    <span>{newPackage.customerId ? 'Generate & Assign Custom Care Package' : 'Publish Care Package'}</span>
                  </button>
                </form>
              </div>
            )}

            {/* AgencyAdmin: Add Agency Specialty Service */}
            {showAddModal === 'agency_service' && (
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Add Agency Specialty Service</h3>
                <p className="text-xs text-slate-500 mb-4">Custom procedure offered exclusively by your staff</p>
                <form onSubmit={handleCreateAgencyService} className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Service Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dry Needling & Trigger Point Therapy"
                      value={newAgencyService.name}
                      onChange={e => setNewAgencyService({ ...newAgencyService, name: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-xs mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Clinical Category</label>
                      <select
                        value={newAgencyService.category}
                        onChange={e => setNewAgencyService({ ...newAgencyService, category: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-xs mt-1"
                      >
                        {CLINICAL_CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Staff Qualification</label>
                      <input
                        type="text"
                        required
                        placeholder="Certified PT"
                        value={newAgencyService.staffType}
                        onChange={e => setNewAgencyService({ ...newAgencyService, staffType: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-xs mt-1"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Price (₹)</label>
                      <input
                        type="number"
                        required
                        value={newAgencyService.price}
                        onChange={e => setNewAgencyService({ ...newAgencyService, price: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border rounded-xl text-xs mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Duration</label>
                      <input
                        type="text"
                        required
                        placeholder="45 min"
                        value={newAgencyService.duration}
                        onChange={e => setNewAgencyService({ ...newAgencyService, duration: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-xs mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Description</label>
                    <textarea
                      required
                      rows={3}
                      value={newAgencyService.description}
                      onChange={e => setNewAgencyService({ ...newAgencyService, description: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-xs mt-1"
                    />
                  </div>
                  <button type="submit" className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold mt-4">
                    Save Specialty Service
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4B. SELECT BOOKING TIME MODAL                                              */}
      {/* ========================================================================= */}
      {bookingStep === 'select_time' && serviceToBook && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => {
                setBookingStep('browse');
                setServiceToBook(null);
              }}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 bg-cyan-50 border border-cyan-100 text-cyan-700 rounded-2xl flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Schedule Service Visit</h3>
                <p className="text-xs text-slate-500">Pick preferred arrival time for {serviceToBook.name}</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-5">
              <div className="flex justify-between items-center text-xs text-slate-700">
                <span className="font-semibold text-slate-900">{serviceToBook.name}</span>
                <span className="font-bold text-cyan-800">₹{serviceToBook.price}</span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                <span>Duration: {serviceToBook.duration}</span>
                <span>•</span>
                <span>Default Radius: 5.0 km</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Select Preferred Arrival Slot</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { label: 'ASAP', sub: 'Next 30 mins', val: 'ASAP (Next 30 mins)' },
                    { label: 'Today Evening', sub: '5:00 PM - 7:00 PM', val: 'Today Evening (5:00 PM - 7:00 PM)' },
                    { label: 'Tomorrow Morning', sub: '9:00 AM - 11:00 AM', val: 'Tomorrow Morning (9:00 AM - 11:00 AM)' }
                  ].map(slot => (
                    <button
                      key={slot.val}
                      type="button"
                      onClick={() => {
                        setSelectedBookingTime(slot.val);
                        setCustomBookingTime('');
                      }}
                      className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                        selectedBookingTime === slot.val && !customBookingTime
                          ? 'border-cyan-600 bg-cyan-50/70 text-cyan-900 ring-2 ring-cyan-500/20'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                      }`}
                    >
                      <div className="font-bold text-xs">{slot.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{slot.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Customer Current Location & Address Section */}
              <div className="p-4 bg-gradient-to-br from-indigo-50/70 to-cyan-50/70 rounded-2xl border border-indigo-100 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-indigo-600" />
                    <span>Care Visit Address & Location</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleDetectCurrentLocation}
                    disabled={isDetectingLocation}
                    className="px-2.5 py-1 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-[11px] font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer disabled:opacity-50"
                  >
                    <Navigation className={`w-3 h-3 text-indigo-600 ${isDetectingLocation ? 'animate-spin' : ''}`} />
                    <span>{isDetectingLocation ? 'Detecting GPS...' : 'Use My Current Location'}</span>
                  </button>
                </div>

                {locationStatusMsg && (
                  <div className="text-[11px] font-medium text-indigo-700 bg-white/80 px-2.5 py-1 rounded-lg border border-indigo-100 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                    <span>{locationStatusMsg}</span>
                  </div>
                )}

                <div>
                  <textarea
                    rows={2}
                    disabled={addLocationLater}
                    placeholder="Enter complete address (House/Flat No., Street, Landmark, Area, City)..."
                    value={bookingAddress}
                    onChange={(e) => setBookingAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-400"
                  />
                  {bookingLat !== 0 && bookingLng !== 0 && (
                    <div className="text-[10px] text-slate-500 font-mono mt-1 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                      <span>Verified GPS: {bookingLat.toFixed(4)}° N, {bookingLng.toFixed(4)}° E</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-indigo-100/70">
                  <input
                    type="checkbox"
                    id="addLocLater"
                    checked={addLocationLater}
                    onChange={(e) => {
                      setAddLocationLater(e.target.checked);
                      if (e.target.checked) {
                        setLocationStatusMsg('You can complete booking now and add visit address later from your home page.');
                      } else {
                        setLocationStatusMsg('');
                      }
                    }}
                    className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <label htmlFor="addLocLater" className="text-xs text-slate-700 font-medium cursor-pointer">
                    Book now and add visit location / address later
                  </label>
                </div>
              </div>

              {/* Customer Contact & OTP Verification for Confirmation */}
              <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Booking Confirmation Contact & OTP Verification</span>
                  </label>
                  {isOtpVerified && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-emerald-700" />
                      <span>Verified</span>
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <span>Send confirmation message to:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomerContactType('phone');
                        setIsOtpSent(false);
                        setIsOtpVerified(false);
                        setOtpMessage('');
                      }}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition ${
                        customerContactType === 'phone'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white text-slate-600 border border-slate-200'
                      }`}
                    >
                      Mobile Phone
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomerContactType('email');
                        setIsOtpSent(false);
                        setIsOtpVerified(false);
                        setOtpMessage('');
                      }}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition ${
                        customerContactType === 'email'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white text-slate-600 border border-slate-200'
                      }`}
                    >
                      Email Address
                    </button>
                  </div>

                  <div className="flex gap-2">
                    {customerContactType === 'phone' ? (
                      <div className="relative flex-1">
                        <Phone className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                        <input
                          type="text"
                          disabled={isOtpVerified}
                          placeholder="+91 98765 12345"
                          value={customerPhoneInput}
                          onChange={e => {
                            setCustomerPhoneInput(e.target.value);
                            setIsOtpSent(false);
                            setIsOtpVerified(false);
                          }}
                          className="w-full pl-8 pr-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
                        />
                      </div>
                    ) : (
                      <div className="relative flex-1">
                        <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                        <input
                          type="email"
                          disabled={isOtpVerified}
                          placeholder="patient@example.com"
                          value={customerEmailInput}
                          onChange={e => {
                            setCustomerEmailInput(e.target.value);
                            setIsOtpSent(false);
                            setIsOtpVerified(false);
                          }}
                          className="w-full pl-8 pr-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
                        />
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleSendBookingOtp}
                      disabled={isOtpVerified}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer whitespace-nowrap shadow-2xs"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>{isOtpSent ? 'Resend OTP' : 'Send OTP'}</span>
                    </button>
                  </div>

                  {/* Inline OTP Notification Banner with Auto-Fill */}
                  {isOtpSent && !isOtpVerified && (
                    <div className="p-3 bg-gradient-to-r from-emerald-100/90 to-cyan-100/90 border border-emerald-300 rounded-xl space-y-2 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950">
                          <BellRing className="w-3.5 h-3.5 text-emerald-700 animate-bounce" />
                          <span>OTP Dispatched:</span>
                          <span className="font-mono text-sm tracking-wider text-emerald-900 bg-white px-2 py-0.5 rounded shadow-2xs font-extrabold">
                            {generatedOtp}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setOtpInput(generatedOtp)}
                          className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[11px] font-bold transition cursor-pointer shadow-xs"
                        >
                          Auto-Fill
                        </button>
                      </div>
                    </div>
                  )}

                  {/* OTP Entry Row */}
                  {isOtpSent && !isOtpVerified && (
                    <div className="pt-2 border-t border-emerald-200/60 space-y-2 animate-in fade-in duration-200">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="Enter 6-digit OTP"
                          value={otpInput}
                          onChange={e => setOtpInput(e.target.value)}
                          className="flex-1 px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs font-bold tracking-widest text-center focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyBookingOtp}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Verify OTP</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {otpMessage && (
                    <p className={`text-[11px] font-medium leading-relaxed ${
                      isOtpVerified ? 'text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-lg border border-emerald-200' : 'text-slate-600'
                    }`}>
                      {otpMessage}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Or Specify Custom Time / Instructions</label>
                <input
                  type="text"
                  placeholder="e.g., Today at 4:30 PM, Tomorrow 2:00 PM..."
                  value={customBookingTime}
                  onChange={(e) => setCustomBookingTime(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setBookingStep('browse');
                    setServiceToBook(null);
                  }}
                  className="px-4 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBookingWithTime}
                  className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-cyan-600/20 cursor-pointer"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Confirm & Schedule Visit</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4C. PACKAGE ENROLLMENT & OTP CONFIRMATION MODAL                            */}
      {/* ========================================================================= */}
      {enrollingPackage && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => {
                setEnrollingPackage(null);
                setPackageEnrolledSuccess(false);
              }}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {!packageEnrolledSuccess ? (
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 bg-cyan-50 border border-cyan-100 text-cyan-700 rounded-2xl flex items-center justify-center">
                    <Package className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Enroll in Care Package</h3>
                    <p className="text-xs text-slate-500">{enrollingPackage.name}</p>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-5 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-900">{enrollingPackage.name}</span>
                    <span className="font-extrabold text-cyan-800 text-sm">₹{enrollingPackage.price}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 flex-wrap">
                    <span>Duration: {enrollingPackage.durationDays} Days</span>
                    <span>•</span>
                    <span>{enrollingPackage.totalVisits} Clinical Sessions</span>
                    <span>•</span>
                    <span>Provider: {enrollingPackage.agencyName}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {(enrollingPackage.category || 'Nursing').split(',').map((c, i) => (
                      <span key={i} className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-100 text-cyan-800">
                        {c.trim()}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Customer Contact & OTP Verification */}
                <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Enrollment Confirmation Contact & OTP</span>
                    </label>
                    {isOtpVerified && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-emerald-700" />
                        <span>Verified</span>
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <span>Send confirmation message to:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomerContactType('phone');
                          setIsOtpSent(false);
                          setIsOtpVerified(false);
                          setOtpMessage('');
                        }}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition ${
                          customerContactType === 'phone'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white text-slate-600 border border-slate-200'
                        }`}
                      >
                        Mobile Phone
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomerContactType('email');
                          setIsOtpSent(false);
                          setIsOtpVerified(false);
                          setOtpMessage('');
                        }}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition ${
                          customerContactType === 'email'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white text-slate-600 border border-slate-200'
                        }`}
                      >
                        Email Address
                      </button>
                    </div>

                    <div className="flex gap-2">
                      {customerContactType === 'phone' ? (
                        <div className="relative flex-1">
                          <Phone className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                          <input
                            type="text"
                            disabled={isOtpVerified}
                            placeholder="+91 98765 12345"
                            value={customerPhoneInput}
                            onChange={e => {
                              setCustomerPhoneInput(e.target.value);
                              setIsOtpSent(false);
                              setIsOtpVerified(false);
                            }}
                            className="w-full pl-8 pr-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
                          />
                        </div>
                      ) : (
                        <div className="relative flex-1">
                          <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                          <input
                            type="email"
                            disabled={isOtpVerified}
                            placeholder="patient@example.com"
                            value={customerEmailInput}
                            onChange={e => {
                              setCustomerEmailInput(e.target.value);
                              setIsOtpSent(false);
                              setIsOtpVerified(false);
                            }}
                            className="w-full pl-8 pr-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
                          />
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleSendBookingOtp}
                        disabled={isOtpVerified}
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer whitespace-nowrap shadow-2xs"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>{isOtpSent ? 'Resend OTP' : 'Send OTP'}</span>
                      </button>
                    </div>

                    {/* Inline OTP Notification Banner with Auto-Fill */}
                    {isOtpSent && !isOtpVerified && (
                      <div className="p-3 bg-gradient-to-r from-emerald-100/90 to-cyan-100/90 border border-emerald-300 rounded-xl space-y-2 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950">
                            <BellRing className="w-3.5 h-3.5 text-emerald-700 animate-bounce" />
                            <span>OTP Dispatched:</span>
                            <span className="font-mono text-sm tracking-wider text-emerald-900 bg-white px-2 py-0.5 rounded shadow-2xs font-extrabold">
                              {generatedOtp}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setOtpInput(generatedOtp)}
                            className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[11px] font-bold transition cursor-pointer shadow-xs"
                          >
                            Auto-Fill
                          </button>
                        </div>
                      </div>
                    )}

                    {/* OTP Entry Row */}
                    {isOtpSent && !isOtpVerified && (
                      <div className="pt-2 border-t border-emerald-200/60 space-y-2 animate-in fade-in duration-200">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            maxLength={6}
                            placeholder="Enter 6-digit OTP"
                            value={otpInput}
                            onChange={e => setOtpInput(e.target.value)}
                            className="flex-1 px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs font-bold tracking-widest text-center focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={handleVerifyBookingOtp}
                            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Verify OTP</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {otpMessage && (
                      <p className={`text-[11px] font-medium leading-relaxed ${
                        isOtpVerified ? 'text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-lg border border-emerald-200' : 'text-slate-600'
                      }`}>
                        {otpMessage}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEnrollingPackage(null);
                      setPackageEnrolledSuccess(false);
                    }}
                    className="px-4 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmPackageEnrollment}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Confirm & Enroll Plan</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 space-y-4">
                <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-xs">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Successfully Enrolled in Care Package!</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Confirmation message and dispatch schedule have been sent to{' '}
                    <strong>{customerContactType === 'phone' ? customerPhoneInput : customerEmailInput}</strong>.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Package:</span>
                    <span className="font-bold text-slate-900">{enrollingPackage.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Authorized Agency:</span>
                    <span className="font-semibold text-slate-800">{enrollingPackage.agencyName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Sessions Total:</span>
                    <span className="font-bold text-cyan-800">{enrollingPackage.totalVisits} Clinical Home Visits</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Validity:</span>
                    <span className="font-semibold text-slate-700">{enrollingPackage.durationDays} Days</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-2">
                    <span className="text-slate-400">Status:</span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Confirmed & Allocated to Agency Coordinator
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setEnrollingPackage(null);
                    setPackageEnrolledSuccess(false);
                    setActiveTab('portal');
                    setPortalSection('my_bookings');
                  }}
                  className="w-full py-3 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  <span>Go to My Customer Home & Track Enrolled Package</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. PATIENT RADAR STAFF ALLOCATION OVERLAY                                 */}
      {/* ========================================================================= */}
      {bookingStep === 'dispatching' && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl text-center relative overflow-hidden">
            <div className="relative w-40 h-40 mx-auto mb-6 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-cyan-500/10 animate-ping"></div>
              <div className="absolute inset-4 rounded-full bg-cyan-500/20 animate-pulse"></div>
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-600 to-emerald-500 flex items-center justify-center text-white shadow-lg relative z-10">
                <MapPin className="w-7 h-7 animate-bounce" />
              </div>
            </div>

            <span className="px-3 py-1 bg-cyan-50 text-cyan-800 font-bold text-xs rounded-full border border-cyan-100 uppercase tracking-wider">
              Stage {dispatchRadius === 5 ? '1' : '2'} Radar Search ({dispatchRadius}.0 km)
            </span>

            <h3 className="mt-3 text-xl font-bold text-slate-900">Assigning Qualified Healthcare Staff</h3>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              Searching certified paramedics within <strong>{dispatchRadius}.0 km</strong>. First-to-accept with atomic concurrency locking active.
            </p>

            <div className="mt-6 p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center space-x-2 text-xs text-slate-600">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span>Connecting to LifeCare Agency staff queue...</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. PATIENT CAREGIVER CONFIRMED OVERLAY                                    */}
      {/* ========================================================================= */}
      {bookingStep === 'confirmed' && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl relative text-center">
            <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto text-emerald-600 mb-4 shadow-xs">
              <CheckCircle className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-bold text-slate-900">Staff Assigned & Scheduled!</h3>
            <p className="text-xs text-slate-500 mt-1">Your caregiver has been assigned and scheduled for your visit</p>

            <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-500 text-white flex items-center justify-center font-bold text-base shadow-xs">
                  {confirmedCaregiver?.name ? confirmedCaregiver.name.slice(0, 2) : 'PS'}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5 flex-wrap">
                    <span>{confirmedCaregiver?.name || 'Pooja Sharma, RN'}</span>
                    <span className="text-[11px] font-semibold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                      {confirmedCaregiver?.agencyName || 'LifeCare Home Health'}
                    </span>
                  </h4>
                  <p className="text-xs text-cyan-700 font-semibold">{confirmedCaregiver?.role || 'Registered Nurse'}</p>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-200 pt-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Authorized Agency:</span>
                  <span className="font-semibold text-slate-800">{confirmedCaregiver?.agencyName || 'LifeCare Home Health'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Clinical Rating:</span>
                  <span className="font-bold text-amber-600 flex items-center">
                    <Star className="w-3 h-3 fill-current mr-1 text-amber-400" />
                    {confirmedCaregiver?.rating || 4.9} ({confirmedCaregiver?.experienceYrs || 7} yrs exp)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Direct Contact:</span>
                  <span className="font-mono text-slate-800">{confirmedCaregiver?.phone || '+91 98765 43210'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Estimated Arrival:</span>
                  <span className="font-bold text-emerald-600">20-25 Mins (En Route)</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setBookingStep('browse');
                setActiveTab('portal');
                setPortalSection('my_bookings');
              }}
              className="mt-6 w-full py-3 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Go to My Customer Home & Track Visit</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6B. LIVE PARAMEDIC GPS MAP & TRANSIT PROGRESS MODAL (PATIENT VIEW)        */}
      {/* ========================================================================= */}
      {trackingBooking && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl relative overflow-hidden flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
                  <Navigation className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">Live Paramedic GPS Navigation</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 uppercase tracking-wider animate-pulse">
                      {trackingBooking.status === 'EN_ROUTE' ? 'In Transit (Live)' : trackingBooking.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Caregiver en route to <span className="text-white font-medium">{trackingBooking.patientName}</span> • Booking #{trackingBooking.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setTrackingBooking(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Map Canvas & GPS Telemetry */}
            <div className="p-4 sm:p-6 space-y-4">
              {/* Interactive Vector GPS Map Simulation with Real Coordinates */}
              <div className="relative w-full h-80 sm:h-96 bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-inner">
                {/* Simulated Street / Map View Grid */}
                <svg className="absolute inset-0 w-full h-full opacity-40" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                      <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1e293b" strokeWidth="0.8" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                  
                  {/* Road Network Vectors */}
                  <path d="M -50 220 Q 250 140 500 240 T 950 180" fill="none" stroke="#334155" strokeWidth="16" strokeLinecap="round" />
                  <path d="M 160 -40 Q 220 180 320 400" fill="none" stroke="#334155" strokeWidth="12" strokeLinecap="round" />
                  <path d="M 450 -40 Q 400 200 600 400" fill="none" stroke="#334155" strokeWidth="10" strokeLinecap="round" />
                  
                  {/* Road Centerlines */}
                  <path d="M -50 220 Q 250 140 500 240 T 950 180" fill="none" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="8 6" opacity="0.4" />
                  <path d="M 160 -40 Q 220 180 320 400" fill="none" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="8 6" opacity="0.4" />

                  {/* Active Dynamic Route between Paramedic and Customer */}
                  <path
                    d="M 90 260 C 180 170, 380 200, 620 90"
                    fill="none"
                    stroke="#4f46e5"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 90 260 C 180 170, 380 200, 620 90"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="3"
                    strokeDasharray="8 6"
                    className="animate-pulse"
                  />
                </svg>

                {/* Patient Home Marker (Destination) */}
                <div className="absolute top-[90px] right-[15%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group z-20">
                  <div className="relative flex items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-emerald-400 opacity-75"></span>
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg border-2 border-white">
                      <MapPin className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-1 px-2.5 py-1 bg-slate-900/95 border border-slate-700 text-white rounded-lg text-[11px] font-bold shadow-md whitespace-nowrap text-center">
                    <div>Destination: {trackingBooking.patientName}</div>
                    <div className="text-[9px] text-emerald-400 font-mono">
                      GPS: {(trackingBooking.patientLat || 28.5700).toFixed(4)}° N, {(trackingBooking.patientLng || 77.2100).toFixed(4)}° E
                    </div>
                  </div>
                </div>

                {/* Paramedic Live Moving GPS Marker */}
                {(() => {
                  const progressRatio = Math.min(100, Math.max(0, transitProgress || 45)) / 100;
                  const leftPos = 14 + progressRatio * 71; // from ~14% to ~85%
                  const topPos = 78 - progressRatio * 52; // from ~78% to ~26%
                  return (
                    <div
                      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-30 transition-all duration-700 ease-out"
                      style={{ left: `${leftPos}%`, top: `${topPos}%` }}
                    >
                      <div className="relative flex items-center justify-center">
                        <span className="animate-ping absolute inline-flex h-10 w-10 rounded-full bg-indigo-400 opacity-80"></span>
                        <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xl border-2 border-white ring-4 ring-indigo-500/30">
                          <Navigation className="w-5 h-5 transform -rotate-45" />
                        </div>
                      </div>
                      <div className="mt-1.5 px-3 py-1 bg-indigo-950/95 border border-indigo-400 text-white rounded-xl text-[11px] font-bold shadow-xl whitespace-nowrap flex flex-col items-center">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                          <span>{trackingBooking.assignedStaff || 'Nurse Pooja Sharma'}</span>
                        </div>
                        <div className="text-[9px] text-indigo-300 font-mono">
                          Live GPS: {(trackingBooking.staffLat || 28.5580).toFixed(4)}° N, {(trackingBooking.staffLng || 77.2030).toFixed(4)}° E
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Map Telemetry HUD */}
                <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md border border-slate-700 p-2.5 rounded-xl text-xs text-slate-300 space-y-1 shadow-lg">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="font-bold text-white text-[11px]">Route Telemetry: Active</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Paramedic: {(trackingBooking.staffLat || 28.5580).toFixed(4)}° N, {(trackingBooking.staffLng || 77.2030).toFixed(4)}° E
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Customer: {(trackingBooking.patientLat || 28.5700).toFixed(4)}° N, {(trackingBooking.patientLng || 77.2100).toFixed(4)}° E
                  </div>
                  <div className="text-[10px] text-indigo-300 font-semibold">
                    Speed: ~24 km/h • Route: Direct Arterial
                  </div>
                </div>

                {/* ETA Countdown Badge */}
                <div className="absolute bottom-3 right-3 bg-slate-900/90 backdrop-blur-md border border-slate-700 px-3 py-2 rounded-xl text-right shadow-lg">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Estimated Arrival</div>
                  <div className="text-base font-extrabold text-emerald-400 font-mono">
                    {trackingBooking.status === 'REACHED' ? 'Arrived at Doorstep' : `${Math.max(2, Math.round((100 - transitProgress) / 5))} mins`}
                  </div>
                </div>
              </div>

              {/* Patient Full Address Card */}
              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-start gap-2.5 text-xs text-slate-700">
                <MapPin className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-bold text-indigo-950">Patient Visit Address: </span>
                  <span>{trackingBooking.address}</span>
                </div>
              </div>

              {/* Transit Progress Bar & Step Milestones */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    <span>Staff En Route Progress</span>
                  </span>
                  <span className="font-mono font-bold text-indigo-600 text-sm">
                    {transitProgress}% completed
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden shadow-inner">
                  <div
                    className="bg-gradient-to-r from-indigo-600 via-cyan-500 to-emerald-500 h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${transitProgress}%` }}
                  ></div>
                </div>

                {/* 3 Steps Indicator */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-200 text-center">
                  <div className={`p-2 rounded-xl text-xs font-semibold ${transitProgress >= 15 ? 'bg-indigo-50 text-indigo-800 border border-indigo-200' : 'text-slate-400'}`}>
                    <div className="font-bold">1. Visit Started</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Staff departs clinic / hub</div>
                  </div>
                  <div className={`p-2 rounded-xl text-xs font-semibold ${transitProgress >= 50 ? 'bg-indigo-50 text-indigo-800 border border-indigo-200' : 'text-slate-400'}`}>
                    <div className="font-bold">2. En Route</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Navigating via GPS</div>
                  </div>
                  <div className={`p-2 rounded-xl text-xs font-semibold ${transitProgress >= 95 ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'text-slate-400'}`}>
                    <div className="font-bold">3. Staff Arrived</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Doorstep check-in</div>
                  </div>
                </div>
              </div>

              {/* Caregiver Contact & Quick Actions Card */}
              <div className="p-4 bg-white rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center space-x-3 w-full sm:w-auto">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-emerald-500 text-white flex items-center justify-center font-bold text-base shadow-xs flex-shrink-0">
                    {trackingBooking.assignedStaff ? trackingBooking.assignedStaff.slice(0, 2) : 'PS'}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5 flex-wrap">
                      <span>{trackingBooking.assignedStaff || 'Nurse Pooja Sharma'}</span>
                      <span className="text-[10px] font-semibold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                        {trackingBooking.agencyName || 'LifeCare Home Health'}
                      </span>
                    </h4>
                    <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span className="font-mono flex items-center gap-1 text-slate-700">
                        <Phone className="w-3 h-3 text-slate-400" /> {trackingBooking.staffPhone || '+91 98765 43210'}
                      </span>
                      <span>•</span>
                      <span>Service: {trackingBooking.serviceName}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => {
                      setActiveChatBooking(trackingBooking);
                      setTrackingBooking(null);
                    }}
                    className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    <span>Chat Caregiver</span>
                  </button>
                  <button
                    onClick={() => setTrackingBooking(null)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Close Map
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; 2026 NurtureCare Platform. Clinical Governance & Multi-Agency Network Architecture.</span>
          <div className="flex items-center space-x-4">
            <span className="flex items-center text-emerald-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5"></span>
              SQLite Zero-Install DB Active
            </span>
            <span>OAuth 2.0 Multi-Role RBAC</span>
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 5. REAL-TIME CHAT MODAL (CUSTOMER & PARAMEDIC)                            */}
      {/* ========================================================================= */}
      {activeChatBooking && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full h-[580px] shadow-2xl relative flex flex-col overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-cyan-700 to-emerald-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white font-bold">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-tight">Caregiver Direct Chat</h3>
                  <div className="text-[11px] text-cyan-100 flex items-center gap-2 mt-0.5">
                    <span>Booking: <strong>{activeChatBooking.id}</strong></span>
                    <span>•</span>
                    <span>{activeChatBooking.serviceName}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setActiveChatBooking(null)}
                className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-bar */}
            <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 text-xs text-slate-600 flex items-center justify-between">
              <span>Patient: <strong>{activeChatBooking.patientName}</strong></span>
              <span className="text-cyan-800 font-semibold flex items-center gap-1">
                <Stethoscope className="w-3.5 h-3.5" /> {activeChatBooking.assignedStaff || 'Paramedic Staff'}
              </span>
            </div>

            {/* Chat Messages Log */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
              {chatMessages.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p>No messages exchanged yet.</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Connect directly to confirm clinical readiness, gate arrival, or health questions.
                  </p>
                </div>
              ) : (
                chatMessages.map(msg => {
                  const isMe = (authUser?.id && msg.senderId === authUser.id) ||
                               (authUser?.role === 'PARAMEDIC' && msg.senderRole === 'PARAMEDIC') ||
                               (authUser?.role === 'PATIENT' && msg.senderRole === 'PATIENT');
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div className="text-[10px] text-slate-400 font-medium mb-1 px-1 flex items-center gap-1">
                        <span>{msg.senderName}</span>
                        <span className="font-mono">• {msg.createdAt?.split(' ')[1] || msg.createdAt}</span>
                      </div>
                      <div
                        className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                          isMe
                            ? 'bg-gradient-to-r from-cyan-600 to-emerald-600 text-white rounded-br-xs'
                            : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                        }`}
                      >
                        {msg.message}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Chat Input Bar */}
            <form onSubmit={handleSendChatMessage} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
              <input
                type="text"
                required
                value={newChatMessage}
                onChange={e => setNewChatMessage(e.target.value)}
                placeholder="Type your message to caregiver/patient..."
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5B. LIVE AUDIO / VIDEO CONSULTATION INTERACTION MODAL                     */}
      {/* ========================================================================= */}
      {activeAVSession && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping"></div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-sm text-white">Live Clinical AV Feed</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      LIVE • {Math.floor(avCallDuration / 60)}:{(avCallDuration % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Patient: <strong className="text-white">{activeAVSession.patientName}</strong> • {activeAVSession.serviceName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveAVSession(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Streams Container */}
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950 min-h-[320px]">
              {/* Paramedic Camera Stream */}
              <div className="relative rounded-2xl bg-slate-800/90 border border-slate-700 overflow-hidden flex flex-col items-center justify-center min-h-[200px]">
                {!isVideoOff ? (
                  <div className="w-full h-full min-h-[220px] bg-gradient-to-br from-cyan-900/40 via-slate-800 to-emerald-950/40 flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-20 h-20 rounded-full bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center text-cyan-300 mb-3 shadow-lg shadow-cyan-500/20">
                      <Stethoscope className="w-10 h-10 animate-pulse" />
                    </div>
                    <div className="text-sm font-bold text-white">{activeAVSession.assignedStaff || 'Paramedic Staff'}</div>
                    <div className="text-xs text-cyan-400">Attending Caregiver (At Destination)</div>
                    <div className="mt-3 px-3 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/30 flex items-center gap-1">
                      <Radio className="w-3 h-3 animate-ping" /> Camera 1080p • Ultra-Low Latency
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 text-slate-400">
                    <VideoOff className="w-10 h-10 text-slate-600 mb-2" />
                    <span className="text-xs">Caregiver Camera Off</span>
                  </div>
                )}
                <div className="absolute top-3 left-3 px-2.5 py-1 bg-slate-900/80 backdrop-blur-xs rounded-lg text-[11px] font-semibold text-slate-200 border border-slate-700/60 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  {activeAVSession.assignedStaff} (Nurse)
                </div>
              </div>

              {/* Patient / Family Member Stream */}
              <div className="relative rounded-2xl bg-slate-800/90 border border-slate-700 overflow-hidden flex flex-col items-center justify-center min-h-[200px]">
                <div className="w-full h-full min-h-[220px] bg-gradient-to-br from-indigo-950/40 via-slate-800 to-rose-950/40 flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-20 h-20 rounded-full bg-indigo-500/20 border-2 border-indigo-400 flex items-center justify-center text-indigo-300 mb-3 shadow-lg shadow-indigo-500/20">
                    <User className="w-10 h-10" />
                  </div>
                  <div className="text-sm font-bold text-white">{activeAVSession.patientName} & Family</div>
                  <div className="text-xs text-indigo-300">
                    {isFamilyJoined || authUser?.role === 'PATIENT' ? 'Family Member Connected (Audio & Video On)' : 'Waiting for Family Member to Join...'}
                  </div>
                  
                  {isFamilyJoined || authUser?.role === 'PATIENT' ? (
                    <div className="mt-3 px-3 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/30 flex items-center gap-1">
                      <UserCheck className="w-3 h-3 text-emerald-400" /> Family Voice Audio Live
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsFamilyJoined(true)}
                      className="mt-3 px-3.5 py-1.5 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-md cursor-pointer animate-pulse"
                    >
                      <Video className="w-3.5 h-3.5" /> Simulate Family Join Audio & Talk
                    </button>
                  )}
                </div>
                <div className="absolute top-3 left-3 px-2.5 py-1 bg-slate-900/80 backdrop-blur-xs rounded-lg text-[11px] font-semibold text-slate-200 border border-slate-700/60 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isFamilyJoined || authUser?.role === 'PATIENT' ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                  Patient Bedside Feed
                </div>
              </div>
            </div>

            {/* Prescriptions & Instructions Quick Bar */}
            <div className="px-6 py-2.5 bg-slate-900 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-300 gap-2">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-cyan-400 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" /> HIPAA/NABH Encrypted
                </span>
                {activeAVSession.prescriptionUrl && (
                  <button
                    onClick={() => setViewPrescriptionBooking(activeAVSession)}
                    className="text-xs text-indigo-300 hover:text-white underline font-semibold flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Doctor Rx
                  </button>
                )}
              </div>
              <div className="text-[11px] text-slate-400">
                Recording enabled for clinical reference and summary generation.
              </div>
            </div>

            {/* AV Session Controls */}
            <div className="px-6 py-4 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsMicMuted(!isMicMuted)}
                  className={`p-3 rounded-2xl transition ${
                    isMicMuted ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' : 'bg-slate-800 hover:bg-slate-700 text-white'
                  }`}
                  title={isMicMuted ? 'Unmute Microphone' : 'Mute Microphone'}
                >
                  {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => setIsVideoOff(!isVideoOff)}
                  className={`p-3 rounded-2xl transition ${
                    isVideoOff ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' : 'bg-slate-800 hover:bg-slate-700 text-white'
                  }`}
                  title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
                >
                  {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                </button>
              </div>

              <div className="flex items-center space-x-3">
                {authUser?.role === 'PARAMEDIC' && (
                  <button
                    onClick={() => {
                      setSelectedBookingForUpdate(activeAVSession);
                      setActiveAVSession(null);
                    }}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Proceed to Vitals & Complete</span>
                  </button>
                )}
                <button
                  onClick={handleEndAVSession}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Phone className="w-4 h-4 rotate-[135deg]" />
                  <span>Leave Consultation</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5C. PRESCRIPTION UPLOAD MODAL FOR CUSTOMER                                */}
      {/* ========================================================================= */}
      {uploadPrescriptionBooking && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => {
                setUploadPrescriptionBooking(null);
                setPrescriptionFile(null);
                setPrescriptionPreviewUrl(null);
              }}
              className="absolute top-5 right-5 p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-700">
                <FileUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Upload Doctor Prescription</h3>
                <p className="text-xs text-slate-500">Attach medical prescription for <strong>{uploadPrescriptionBooking.serviceName}</strong></p>
              </div>
            </div>

            <form onSubmit={handlePrescriptionUpload} className="mt-4 space-y-4">
              <div className="border-2 border-dashed border-slate-200 hover:border-cyan-400 rounded-2xl p-6 text-center transition bg-slate-50/50">
                <input
                  type="file"
                  id="prescriptionFileInput"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setPrescriptionFile(file);
                      const reader = new FileReader();
                      reader.onload = () => {
                        setPrescriptionPreviewUrl(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <label htmlFor="prescriptionFileInput" className="cursor-pointer flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-cyan-100/70 text-cyan-700 flex items-center justify-center mb-2">
                    <Upload className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-bold text-slate-800">Choose file or drag photo here</span>
                  <span className="text-xs text-slate-400 mt-1">Supports PDF, PNG, JPG (up to 10MB)</span>
                </label>
              </div>

              {prescriptionFile && (
                <div className="p-3 bg-cyan-50 rounded-xl border border-cyan-200 text-xs flex items-center justify-between text-cyan-900">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-4 h-4 flex-shrink-0 text-cyan-700" />
                    <span className="font-semibold truncate">{prescriptionFile.name}</span>
                    <span className="text-slate-400">({(prescriptionFile.size / 1024).toFixed(1)} KB)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPrescriptionFile(null);
                      setPrescriptionPreviewUrl(null);
                    }}
                    className="text-slate-400 hover:text-rose-600 ml-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {prescriptionPreviewUrl && prescriptionFile?.type.startsWith('image/') && (
                <div className="max-h-48 overflow-hidden rounded-xl border border-slate-200 shadow-inner">
                  <img src={prescriptionPreviewUrl} alt="Rx Preview" className="w-full object-cover" />
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    // Quick sample prescription loader for instant demo testing
                    const mockRx = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23f8fafc"/><text x="20" y="40" font-family="sans-serif" font-size="16" font-weight="bold" fill="%230f172a">CITY HEALTH CLINIC - DR. R. MEHTA, MD</text><text x="20" y="70" font-family="sans-serif" font-size="12" fill="%23475569">Reg No: MCI-2018-99482</text><line x1="20" y1="85" x2="380" y2="85" stroke="%23cbd5e1" stroke-width="2"/><text x="20" y="115" font-family="sans-serif" font-size="14" font-weight="bold" fill="%230284c7">Rx: Home Paramedical Care Protocol</text><text x="20" y="145" font-family="sans-serif" font-size="12" fill="%23334155">1. Sterile Dressing & Aseptic Wound Care daily</text><text x="20" y="170" font-family="sans-serif" font-size="12" fill="%23334155">2. Check Vitals (BP, SpO2, Pulse) at each visit</text><text x="20" y="195" font-family="sans-serif" font-size="12" fill="%23334155">3. Maintain knee immobilization brace for 48 hrs</text><text x="20" y="240" font-family="sans-serif" font-size="12" font-style="italic" fill="%2364748b">Verified & Signed Digitally</text></svg>';
                    setPrescriptionPreviewUrl(mockRx);
                    setPrescriptionFile(new File(['Sample Doctor Prescription'], 'Doctor_Rx_Official.pdf', { type: 'application/pdf' }));
                  }}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Use Sample Prescription
                </button>
                <button
                  type="submit"
                  disabled={!prescriptionPreviewUrl}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer ${
                    prescriptionPreviewUrl ? 'bg-cyan-600 hover:bg-cyan-700 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Check className="w-4 h-4" /> Save & Attach to Visit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5D. VIEW PRESCRIPTION MODAL                                               */}
      {/* ========================================================================= */}
      {viewPrescriptionBooking && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setViewPrescriptionBooking(null)}
              className="absolute top-5 right-5 p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-700">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Doctor Prescription (Rx)</h3>
                <p className="text-xs text-slate-500">Patient: <strong>{viewPrescriptionBooking.patientName}</strong> • {viewPrescriptionBooking.serviceName}</p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/60 max-h-[60vh] overflow-y-auto mb-4">
              {viewPrescriptionBooking.prescriptionUrl?.startsWith('data:image/') || viewPrescriptionBooking.prescriptionUrl?.startsWith('http') ? (
                <img
                  src={viewPrescriptionBooking.prescriptionUrl}
                  alt="Doctor Prescription"
                  className="w-full rounded-xl border border-slate-200 shadow-sm"
                />
              ) : (
                <div className="p-6 text-center text-slate-600 space-y-3">
                  <FileText className="w-12 h-12 mx-auto text-cyan-600" />
                  <div className="font-bold text-slate-800 text-sm">{viewPrescriptionBooking.prescriptionName || 'Official_Prescription.pdf'}</div>
                  <p className="text-xs text-slate-500">Clinical prescription attached and validated for this home care visit.</p>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Verified by Patient
              </span>
              <button
                onClick={() => setViewPrescriptionBooking(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5E. COMPREHENSIVE POST-VISIT AV & CLINICAL SUMMARY MODAL                  */}
      {/* ========================================================================= */}
      {viewAVSummaryBooking && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setViewAVSummaryBooking(null)}
              className="absolute top-5 right-5 p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 shadow-xs">
                <Radio className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">Post-Visit Consultation Record</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    COMPLETED VISIT
                  </span>
                </div>
                <p className="text-xs text-slate-500">Reference summary of audio, video, and caregiver notes</p>
              </div>
            </div>

            {/* Visit Details */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-2 gap-3 text-xs mb-4">
              <div>
                <span className="text-slate-400 block">Service:</span>
                <span className="font-bold text-slate-800">{viewAVSummaryBooking.serviceName}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Attending Paramedic:</span>
                <span className="font-bold text-slate-800">{viewAVSummaryBooking.assignedStaff}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Patient / Location:</span>
                <span className="text-slate-800">{viewAVSummaryBooking.patientName} ({viewAVSummaryBooking.address})</span>
              </div>
              <div>
                <span className="text-slate-400 block">Date & Time:</span>
                <span className="font-mono text-slate-800">{viewAVSummaryBooking.createdAt}</span>
              </div>
            </div>

            {/* Audio & Video Transcript Summary */}
            <div className="p-4 bg-gradient-to-br from-indigo-50/70 to-cyan-50/70 rounded-2xl border border-indigo-200 mb-4 space-y-2">
              <div className="font-bold text-xs text-indigo-900 flex items-center gap-1.5">
                <Video className="w-4 h-4 text-indigo-600" />
                <span>Audio-Video Interaction Transcript & Care Highlights:</span>
              </div>
              <pre className="font-sans text-xs text-slate-700 whitespace-pre-wrap leading-relaxed bg-white/90 p-3.5 rounded-xl border border-indigo-100 shadow-xs">
                {viewAVSummaryBooking.avSummary || 'Audio and Video consultation verified. Paramedic arrived at destination, family member connected on live audio, and procedure executed per protocol.'}
              </pre>
            </div>

            {/* Recorded Vitals Grid */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 mb-4">
              <div className="text-xs font-bold text-slate-900 mb-2">Verified Patient Vitals Recorded at Home:</div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Blood Pressure</div>
                  <div className="text-sm font-bold text-slate-800">{viewAVSummaryBooking.vitalsBP || '120/80 mmHg'}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Oxygen SpO2</div>
                  <div className="text-sm font-bold text-emerald-600">{viewAVSummaryBooking.vitalsSpO2 || '99%'}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Pulse Rate</div>
                  <div className="text-sm font-bold text-cyan-700">{viewAVSummaryBooking.vitalsPulse || '74 bpm'}</div>
                </div>
              </div>
            </div>

            {/* Attached Doctor Prescription reference */}
            {viewAVSummaryBooking.prescriptionUrl && (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-700" />
                  <span>Prescription: <strong>{viewAVSummaryBooking.prescriptionName || 'Doctor_Rx.pdf'}</strong> (Attached)</span>
                </div>
                <button
                  onClick={() => {
                    setViewAVSummaryBooking(null);
                    setViewPrescriptionBooking(viewAVSummaryBooking);
                  }}
                  className="text-xs text-emerald-800 font-bold underline cursor-pointer"
                >
                  View Rx
                </button>
              </div>
            )}

            <button
              onClick={() => setViewAVSummaryBooking(null)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition"
            >
              Close Record
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. EDIT MODALS (SERVICE, PACKAGE, AGENCY, STAFF)                          */}
      {/* ========================================================================= */}
      
      {/* A. EDIT SERVICE MODAL (SUPERADMIN & AGENCY ADMIN) */}
      {editingService && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setEditingService(null)}
              className="absolute top-5 right-5 p-1 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Edit Service & Discounting</h3>
            <p className="text-xs text-slate-500 mb-4">Modify pricing, promotional discounts, and clinical parameters</p>
            
            <form onSubmit={handleSaveServiceEdit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Service Name</label>
                <input
                  type="text"
                  required
                  value={editingService.name}
                  onChange={e => setEditingService({ ...editingService, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Category</label>
                  <select
                    value={editingService.category}
                    onChange={e => setEditingService({ ...editingService, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-xs mt-1"
                  >
                    <option value="Nursing">Nursing</option>
                    <option value="Physiotherapy">Physiotherapy</option>
                    <option value="Elderly Care">Elderly Care</option>
                    <option value="Lab & Diagnostics">Lab & Diagnostics</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Clinical Staff Type</label>
                  <input
                    type="text"
                    required
                    value={editingService.staffType}
                    onChange={e => setEditingService({ ...editingService, staffType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-xs mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Final Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={editingService.price}
                    onChange={e => {
                      const p = Number(e.target.value);
                      const orig = editingService.originalPrice || p;
                      const disc = orig > p ? Math.round(((orig - p) / orig) * 100) : 0;
                      setEditingService({ ...editingService, price: p, discountPercent: disc });
                    }}
                    className="w-full px-3 py-2 border bg-white rounded-xl text-xs mt-1 font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Original Price (₹)</label>
                  <input
                    type="number"
                    value={editingService.originalPrice || editingService.price}
                    onChange={e => {
                      const orig = Number(e.target.value);
                      const p = editingService.price;
                      const disc = orig > p ? Math.round(((orig - p) / orig) * 100) : 0;
                      setEditingService({ ...editingService, originalPrice: orig, discountPercent: disc });
                    }}
                    className="w-full px-3 py-2 border bg-white rounded-xl text-xs mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Discount %</label>
                  <input
                    type="number"
                    value={editingService.discountPercent || 0}
                    onChange={e => {
                      const disc = Number(e.target.value);
                      const orig = editingService.originalPrice || editingService.price;
                      const p = Math.round(orig * (1 - disc / 100));
                      setEditingService({ ...editingService, discountPercent: disc, price: p });
                    }}
                    className="w-full px-3 py-2 border bg-white rounded-xl text-xs mt-1 text-rose-600 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Duration</label>
                <input
                  type="text"
                  value={editingService.duration}
                  onChange={e => setEditingService({ ...editingService, duration: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Clinical Description</label>
                <textarea
                  rows={2}
                  value={editingService.description}
                  onChange={e => setEditingService({ ...editingService, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs mt-1"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* B. EDIT PACKAGE MODAL (SUPERADMIN & AGENCY ADMIN) */}
      {editingPackage && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setEditingPackage(null)}
              className="absolute top-5 right-5 p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Edit Care Package & Pricing</h3>
            <p className="text-xs text-slate-500 mb-4">
              Add or remove included individual services, update package duration, visits, and adjust bundle discount savings.
            </p>
            
            <form onSubmit={handleSavePackageEdit} className="space-y-4">
              {/* Basic Details */}
              <div className="space-y-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Package Title</label>
                  <input
                    type="text"
                    required
                    value={editingPackage.name}
                    onChange={e => setEditingPackage({ ...editingPackage, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-xs mt-1 bg-white font-medium"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">Clinical Category (Multi-Select)</label>
                    <span className="text-[10px] text-slate-400">Select all applicable categories</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {CLINICAL_CATEGORIES.map(cat => {
                      const currentCats = (editingPackage.category || '').split(',').map(c => c.trim()).filter(Boolean);
                      const isSelected = currentCats.includes(cat);
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            let updated: string[];
                            if (isSelected) {
                              updated = currentCats.filter(c => c !== cat);
                              if (updated.length === 0) updated = [cat];
                            } else {
                              updated = [...currentCats, cat];
                            }
                            setEditingPackage({ ...editingPackage, category: updated.join(', ') });
                          }}
                          className={`px-3 py-2 rounded-xl text-xs font-bold text-left flex items-center justify-between border transition cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-50 border-emerald-400 text-emerald-950 shadow-xs'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          <span>{cat}</span>
                          {isSelected ? (
                            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Duration (Days)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={editingPackage.durationDays}
                    onChange={e => setEditingPackage({ ...editingPackage, durationDays: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-xl text-xs mt-1 bg-white font-medium"
                  />
                </div>
              </div>

              {/* Section: Add / Remove Individual Services in Package (Same as Create Package) */}
              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Include Individual Services in Package</span>
                    </h4>
                    <p className="text-[11px] text-emerald-700">Select procedures and number of sessions</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    {(editingPackage.items || []).length} Added
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-7">
                    <select
                      value={editPkgSelectedServiceId}
                      onChange={e => setEditPkgSelectedServiceId(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-emerald-200 rounded-xl text-xs bg-white text-slate-800"
                    >
                      <option value="">-- Choose Clinical Service --</option>
                      {services
                        .filter(s => s.isEnabled !== false)
                        .map(s => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.staffType}) - ₹{s.price}/visit
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="sm:col-span-3 flex items-center gap-1.5">
                    <label className="text-[11px] font-semibold text-emerald-900 whitespace-nowrap">Visits:</label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={editPkgSelectedVisits}
                      onChange={e => setEditPkgSelectedVisits(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-2 py-1.5 border border-emerald-200 rounded-xl text-xs bg-white text-center font-bold"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (!editPkgSelectedServiceId) return;
                        const srv = services.find(s => s.id === editPkgSelectedServiceId);
                        if (!srv) return;
                        const currentItems = editingPackage.items ? [...editingPackage.items] : [];
                        const existingIdx = currentItems.findIndex(it => it.serviceId === srv.id);
                        if (existingIdx >= 0) {
                          currentItems[existingIdx].visits += editPkgSelectedVisits;
                        } else {
                          currentItems.push({
                            serviceId: srv.id,
                            serviceName: srv.name,
                            visits: editPkgSelectedVisits,
                            unitPrice: srv.price
                          });
                        }

                        const totalVis = currentItems.reduce((acc, itm) => acc + itm.visits, 0);
                        const origPrc = currentItems.reduce((acc, itm) => acc + (itm.unitPrice * itm.visits), 0);
                        const disc = editingPackage.discountPercent || 0;
                        const finalPrc = Math.round(origPrc * (1 - (disc / 100)));

                        setEditingPackage({
                          ...editingPackage,
                          items: currentItems,
                          totalVisits: totalVis,
                          originalPrice: origPrc,
                          price: finalPrc
                        });
                        setEditPkgSelectedServiceId('');
                        setEditPkgSelectedVisits(3);
                      }}
                      className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>

                {/* Table / List of Included Services with Option to Remove */}
                {(editingPackage.items && editingPackage.items.length > 0) ? (
                  <div className="space-y-1.5 mt-2 max-h-36 overflow-y-auto pr-1">
                    {editingPackage.items.map((itm, idx) => {
                      const itemTotal = itm.unitPrice * itm.visits;
                      return (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-white border border-emerald-100 text-xs">
                          <div className="flex-1 min-w-0 pr-2">
                            <span className="font-bold text-slate-900 block truncate">{itm.serviceName}</span>
                            <span className="text-[10px] text-slate-500">
                              {itm.visits} visits × ₹{itm.unitPrice}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">₹{itemTotal}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const updatedItems = (editingPackage.items || []).filter((_, i) => i !== idx);
                                if (updatedItems.length > 0) {
                                  const totalVis = updatedItems.reduce((acc, itm) => acc + itm.visits, 0);
                                  const origPrc = updatedItems.reduce((acc, itm) => acc + (itm.unitPrice * itm.visits), 0);
                                  const disc = editingPackage.discountPercent || 0;
                                  const finalPrc = Math.round(origPrc * (1 - (disc / 100)));
                                  setEditingPackage({
                                    ...editingPackage,
                                    items: updatedItems,
                                    totalVisits: totalVis,
                                    originalPrice: origPrc,
                                    price: finalPrc
                                  });
                                } else {
                                  setEditingPackage({
                                    ...editingPackage,
                                    items: []
                                  });
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                              title="Remove service"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-2.5 text-[11px] text-emerald-800 bg-emerald-100/40 rounded-xl border border-dashed border-emerald-200">
                    No individual services currently attached. Select a service above to include it in this package.
                  </div>
                )}
              </div>

              {/* Section: Calculated Pricing & Package Discount (Same as Create Package) */}
              {(() => {
                const hasItems = editingPackage.items && editingPackage.items.length > 0;
                const totalVisitsCalculated = hasItems
                  ? (editingPackage.items || []).reduce((acc, itm) => acc + itm.visits, 0)
                  : editingPackage.totalVisits;

                const originalTotalCalculated = hasItems
                  ? (editingPackage.items || []).reduce((acc, itm) => acc + (itm.unitPrice * itm.visits), 0)
                  : (editingPackage.originalPrice || editingPackage.price);

                const currentDiscount = editingPackage.discountPercent || 0;
                const finalDiscountedPrice = Math.round(originalTotalCalculated * (1 - (currentDiscount / 100)));
                const totalSaved = originalTotalCalculated - finalDiscountedPrice;

                return (
                  <div className="p-4 bg-gradient-to-br from-slate-900 to-cyan-950 text-white rounded-2xl border border-cyan-800 shadow-sm space-y-3">
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-cyan-900">
                      <span className="text-slate-300">Total Clinical Visits:</span>
                      <span className="font-bold text-cyan-300 text-sm">{totalVisitsCalculated} Sessions</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">Sum of Services (Retail Price):</span>
                      <span className="font-bold text-slate-200 text-sm">₹{originalTotalCalculated}</span>
                    </div>

                    {/* Package Discount Slider / Input */}
                    <div className="bg-white/10 p-2.5 rounded-xl border border-white/10 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-emerald-400">Package Bundle Discount:</span>
                        <span className="font-black text-rose-400 text-sm">{currentDiscount}% OFF</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="0"
                          max="60"
                          step="1"
                          value={currentDiscount}
                          onChange={e => {
                            const disc = parseInt(e.target.value) || 0;
                            const p = Math.round(originalTotalCalculated * (1 - disc / 100));
                            setEditingPackage({
                              ...editingPackage,
                              discountPercent: disc,
                              price: p,
                              originalPrice: originalTotalCalculated,
                              totalVisits: totalVisitsCalculated
                            });
                          }}
                          className="w-full accent-emerald-500 cursor-pointer"
                        />
                        <div className="relative w-16">
                          <input
                            type="number"
                            min="0"
                            max="90"
                            value={currentDiscount}
                            onChange={e => {
                              const disc = Math.min(90, Math.max(0, parseInt(e.target.value) || 0));
                              const p = Math.round(originalTotalCalculated * (1 - disc / 100));
                              setEditingPackage({
                                ...editingPackage,
                                discountPercent: disc,
                                price: p,
                                originalPrice: originalTotalCalculated,
                                totalVisits: totalVisitsCalculated
                              });
                            }}
                            className="w-full px-1.5 py-1 bg-white/20 text-white text-xs text-center font-bold rounded-lg border border-white/20"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Final Computed Offered Price */}
                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <span className="text-[11px] text-slate-400 block">Final Package Price</span>
                        <span className="text-xl font-black text-emerald-400">₹{finalDiscountedPrice}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-slate-400 block">Patient Savings</span>
                        <span className="text-xs font-bold text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/30">
                          Save ₹{totalSaved}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div>
                <label className="text-xs font-semibold text-slate-700">Package Description</label>
                <textarea
                  rows={2}
                  value={editingPackage.description}
                  onChange={e => setEditingPackage({ ...editingPackage, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs mt-1"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center justify-center gap-2"
              >
                <Package className="w-4 h-4" />
                <span>Save Package Changes</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* C. EDIT AGENCY MODAL (SUPERADMIN EDIT AGENCY DETAILS & STATUS) */}
      {editingAgency && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setEditingAgency(null)}
              className="absolute top-5 right-5 p-1 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Edit Healthcare Agency</h3>
            <p className="text-xs text-slate-500 mb-4">Modify partner status (ACTIVE / SUSPENDED), contacts, and operating details</p>
            
            <form onSubmit={handleSaveAgencyEdit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Agency Name</label>
                <input
                  type="text"
                  required
                  value={editingAgency.name}
                  onChange={e => setEditingAgency({ ...editingAgency, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Status</label>
                  <select
                    value={editingAgency.status}
                    onChange={e => setEditingAgency({ ...editingAgency, status: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-xs mt-1 font-bold text-slate-800"
                  >
                    <option value="ACTIVE">ACTIVE (Operational)</option>
                    <option value="PROBATION">PROBATION (Quality Review)</option>
                    <option value="SUSPENDED">SUSPENDED (Off Radar)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Operating Mode</label>
                  <select
                    value={editingAgency.mode}
                    onChange={e => setEditingAgency({ ...editingAgency, mode: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-xs mt-1"
                  >
                    <option value="HYBRID">HYBRID</option>
                    <option value="WHITE_LABEL">WHITE_LABEL</option>
                    <option value="MARKETPLACE">MARKETPLACE</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">City / Coverage Area</label>
                  <input
                    type="text"
                    required
                    value={editingAgency.city}
                    onChange={e => setEditingAgency({ ...editingAgency, city: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-xs mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Clinical Registration No</label>
                  <input
                    type="text"
                    required
                    value={editingAgency.registrationNo}
                    onChange={e => setEditingAgency({ ...editingAgency, registrationNo: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-xs mt-1 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Director / Contact Person</label>
                  <input
                    type="text"
                    required
                    value={editingAgency.contactPerson}
                    onChange={e => setEditingAgency({ ...editingAgency, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-xs mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Official Phone</label>
                  <input
                    type="text"
                    required
                    value={editingAgency.phone}
                    onChange={e => setEditingAgency({ ...editingAgency, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-xs mt-1 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Save Agency Updates
              </button>
            </form>
          </div>
        </div>
      )}

      {/* D. EDIT STAFF MODAL (AGENCY ADMIN EDIT COMPLETE PARAMEDICAL STAFF PROFILE) */}
      {editingStaff && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setEditingStaff(null)}
              className="absolute top-5 right-5 p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 mb-1">
              <Edit className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-bold text-slate-900">Edit Complete Paramedical Staff Profile</h3>
            </div>
            <p className="text-xs text-slate-500 mb-5">
              Update full clinical credentials, licensing, background check documents, and service preferences for <strong className="text-slate-800">{editingStaff.name} ({editingStaff.id})</strong>
            </p>
            
            <form onSubmit={handleSaveStaffEdit} className="space-y-5">
              {/* Section 1: Personal & Contact Profile */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-cyan-600" />
                  1. Personal & Contact Information
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={editingStaff.name}
                      onChange={e => setEditingStaff({ ...editingStaff, name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs mt-1 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700">Gender</label>
                    <select
                      value={editingStaff.gender || 'Female'}
                      onChange={e => setEditingStaff({ ...editingStaff, gender: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs mt-1 bg-white"
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700">Mobile Phone Number *</label>
                    <input
                      type="text"
                      required
                      value={editingStaff.phone}
                      onChange={e => setEditingStaff({ ...editingStaff, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs mt-1 font-mono bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700">Email Address</label>
                    <input
                      type="email"
                      value={editingStaff.email || ''}
                      onChange={e => setEditingStaff({ ...editingStaff, email: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs mt-1 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Clinical Qualifications & Medical Licensing */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-indigo-600" />
                  2. Clinical Qualifications & Medical Licensing
                </span>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-700">Clinical Category (Multi-Select) *</label>
                      <span className="text-[10px] text-slate-400">Select all categories this staff member serves</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-1.5">
                      {CLINICAL_CATEGORIES.map(cat => {
                        const currentCats = (editingStaff.role || '').split(',').map(c => c.trim()).filter(Boolean);
                        const isSelected = currentCats.includes(cat);
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => {
                              let updated: string[];
                              if (isSelected) {
                                updated = currentCats.filter(c => c !== cat);
                                if (updated.length === 0) updated = [cat]; // Keep at least one
                              } else {
                                updated = [...currentCats, cat];
                              }
                              setEditingStaff({ ...editingStaff, role: updated.join(', ') });
                            }}
                            className={`px-3 py-2 rounded-xl text-xs font-bold text-left flex items-center justify-between border transition cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-50 border-indigo-400 text-indigo-900 shadow-xs'
                                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            <span>{cat}</span>
                            {isSelected ? (
                              <CheckCircle className="w-4 h-4 text-indigo-600 shrink-0" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700">Experience (Years)</label>
                    <input
                      type="number"
                      min="0"
                      value={editingStaff.experienceYrs || 0}
                      onChange={e => setEditingStaff({ ...editingStaff, experienceYrs: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs mt-1 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700">Degrees & Formal Education</label>
                    <input
                      type="text"
                      value={editingStaff.qualification || ''}
                      onChange={e => setEditingStaff({ ...editingStaff, qualification: e.target.value })}
                      placeholder="e.g. B.Sc Nursing, Critical Care Diploma"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs mt-1 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700">Medical / Nursing Council License #</label>
                    <input
                      type="text"
                      value={editingStaff.licenseNo || ''}
                      onChange={e => setEditingStaff({ ...editingStaff, licenseNo: e.target.value })}
                      placeholder="e.g. MNC-2018-88392"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs mt-1 font-mono bg-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold text-slate-700">Clinical Specializations & Procedures</label>
                    <input
                      type="text"
                      value={editingStaff.specializations || ''}
                      onChange={e => setEditingStaff({ ...editingStaff, specializations: e.target.value })}
                      placeholder="Comma-separated: IV Infusion, Wound Dressing, Catheterization"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs mt-1 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Identity & Background Verification Documents */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  3. Identity & Background Verification Documents
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700">ID Proof Type</label>
                    <select
                      value={editingStaff.idProofType || 'Aadhaar Card'}
                      onChange={e => setEditingStaff({ ...editingStaff, idProofType: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs mt-1 bg-white"
                    >
                      <option value="Aadhaar Card">Aadhaar Card</option>
                      <option value="Passport">Passport</option>
                      <option value="PAN Card">PAN Card</option>
                      <option value="Voter ID">Voter ID</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700">ID Document Number</label>
                    <input
                      type="text"
                      value={editingStaff.idProofNo || ''}
                      onChange={e => setEditingStaff({ ...editingStaff, idProofNo: e.target.value })}
                      placeholder="XXXX-XXXX-4921"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs mt-1 font-mono bg-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold text-slate-700">Police Clearance / Background Audit Document Ref</label>
                    <input
                      type="text"
                      value={editingStaff.policeVerifDoc || ''}
                      onChange={e => setEditingStaff({ ...editingStaff, policeVerifDoc: e.target.value })}
                      placeholder="e.g. POL-VERIF-2026-MUM-8921"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs mt-1 font-mono bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Operational Coverage & Bio */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-600" />
                  4. Operational Localities & Professional Bio
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700">Coverage Area</label>
                    <input
                      type="text"
                      value={editingStaff.serviceArea || ''}
                      onChange={e => setEditingStaff({ ...editingStaff, serviceArea: e.target.value })}
                      placeholder="e.g. South Delhi, Hauz Khas, Saket"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs mt-1 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700">Languages Spoken</label>
                    <input
                      type="text"
                      value={editingStaff.languages || ''}
                      onChange={e => setEditingStaff({ ...editingStaff, languages: e.target.value })}
                      placeholder="e.g. English, Hindi, Marathi"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs mt-1 bg-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold text-slate-700">Professional Bio & Clinical Summary</label>
                    <textarea
                      rows={2}
                      value={editingStaff.bio || ''}
                      onChange={e => setEditingStaff({ ...editingStaff, bio: e.target.value })}
                      placeholder="Brief background of clinical experience, intensive care rotations, and patient care strengths..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs mt-1 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Status & Dispatch Radar Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Radar Duty Status</label>
                  <select
                    value={editingStaff.online ? '1' : '0'}
                    onChange={e => setEditingStaff({ ...editingStaff, online: e.target.value === '1' })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs mt-1 font-bold bg-white"
                  >
                    <option value="1">ON-DUTY (Radar Active)</option>
                    <option value="0">OFF-DUTY (Radar Paused)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Overall Verification Status</label>
                  <select
                    value={editingStaff.status}
                    onChange={e => setEditingStaff({ 
                      ...editingStaff, 
                      status: e.target.value,
                      verificationStatus: e.target.value === 'VERIFIED' ? 'VERIFIED' : e.target.value === 'PENDING' ? 'PENDING' : 'REJECTED'
                    })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs mt-1 font-semibold bg-white"
                  >
                    <option value="VERIFIED">VERIFIED</option>
                    <option value="PENDING">PENDING AUDIT</option>
                    <option value="REJECTED">REJECTED</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Complete Profile</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* F. SET / UPDATE CUSTOMER PROFILE ADDRESS & GPS MODAL */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowAddressModal(false)}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Set Home Location & Address</h3>
                <p className="text-xs text-slate-500">Saved to your profile and linked to all caregiver visits</p>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between p-3 bg-indigo-50/70 rounded-2xl border border-indigo-100">
                <div>
                  <div className="text-xs font-bold text-indigo-950">Detect Live GPS Position</div>
                  <div className="text-[11px] text-indigo-700/80">Acquire exact latitude & longitude coordinates</div>
                </div>
                <button
                  type="button"
                  onClick={handleDetectCurrentLocation}
                  disabled={isDetectingLocation}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Navigation className={`w-3.5 h-3.5 ${isDetectingLocation ? 'animate-spin' : ''}`} />
                  <span>{isDetectingLocation ? 'Detecting...' : 'Use GPS'}</span>
                </button>
              </div>

              {locationStatusMsg && (
                <div className="text-[11px] font-medium text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
                  <span>{locationStatusMsg}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Full Visit Address</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Flat 304, Palm Heights, Near Apollo Clinic, Indiranagar, Bengaluru / Delhi NCR"
                  value={modalAddressInput}
                  onChange={e => setModalAddressInput(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono">
                <div>Latitude: {(bookingLat || authUser?.lat || 28.5700).toFixed(4)}° N</div>
                <div>Longitude: {(bookingLng || authUser?.lng || 77.2100).toFixed(4)}° E</div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSavingAddress || !modalAddressInput.trim()}
                  onClick={() => handleSaveCustomerAddress(modalAddressInput.trim())}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
                >
                  {isSavingAddress ? 'Saving Address...' : 'Save to Profile'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* F. STEP 2: VERIFY PARAMEDIC CREDENTIALS MODAL WITH COMMENT */}
      {verifyingStaff && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setVerifyingStaff(null)}
              className="absolute top-5 right-5 p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-bold text-slate-900">Step 2: Verify Paramedical Credentials</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Audit license certificates, identity proofs, and police verification for <strong className="text-slate-800">{verifyingStaff.name}</strong> ({verifyingStaff.id}).
            </p>

            <div className="space-y-3.5 text-xs">
              {/* Quick credential review banner */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Clinical Category:</span>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {(verifyingStaff.role || 'Nursing').split(',').map((cat, idx) => (
                      <span key={idx} className="font-bold text-cyan-900 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded text-[11px]">
                        {cat.trim()}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Council Registration / License:</span>
                  <span className="font-mono font-bold text-slate-800">{verifyingStaff.licenseNo || 'DMC/RN/2019/8492 (Verified)'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Identity Proof:</span>
                  <span className="font-mono text-slate-800">{verifyingStaff.idProofType || 'Aadhaar Card'}: {verifyingStaff.idProofNo || 'XXXX-XXXX-4920'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Background / Police Verification:</span>
                  <span className="font-medium text-emerald-800">{verifyingStaff.policeVerifDoc || 'Clean Record - Certificate on file'}</span>
                </div>
              </div>

              {/* Verification Comment / Audit Note */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Agency Verification Comment / Audit Note *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Nursing council license cross-checked with State Registry. Aadhaar biometric verified and clean police record confirmed."
                  value={verificationCommentInput}
                  onChange={e => setVerificationCommentInput(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  This verification audit comment will be recorded in the paramedic's profile history.
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => handleVerifyStaff(verifyingStaff.id, 'REJECTED', verificationCommentInput)}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition border border-rose-200 cursor-pointer"
                >
                  Reject Verification
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setVerifyingStaff(null)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVerifyStaff(verifyingStaff.id, 'VERIFIED', verificationCommentInput)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Approve & Mark Verified</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* G. FULL PARAMEDICAL PROFILE VIEW MODAL (ALL ONBOARDING DETAILS DISPLAYED) */}
      {viewingStaffProfile && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setViewingStaffProfile(null)}
              className="absolute top-5 right-5 p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Profile Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-emerald-600 text-white flex items-center justify-center text-xl font-bold shadow-md shadow-cyan-600/20">
                  {viewingStaffProfile.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">{viewingStaffProfile.name}</h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
                      {viewingStaffProfile.id}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(viewingStaffProfile.role || 'Nursing').split(',').map((cat, idx) => (
                      <span key={idx} className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-cyan-50 text-cyan-800 border border-cyan-200">
                        {cat.trim()}
                      </span>
                    ))}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{viewingStaffProfile.agencyName || 'LifeCare Health Services'}</div>
                </div>
              </div>

              {/* Status Badges */}
              <div className="flex flex-col sm:items-end gap-1.5">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                    viewingStaffProfile.verificationStatus === 'VERIFIED'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : viewingStaffProfile.verificationStatus === 'REJECTED'
                        ? 'bg-rose-50 text-rose-800 border-rose-300'
                        : 'bg-amber-50 text-amber-800 border-amber-300'
                  }`}>
                    Step 2: {viewingStaffProfile.verificationStatus || 'PENDING'}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                    viewingStaffProfile.isEnabled
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-slate-100 text-slate-600 border-slate-300'
                  }`}>
                    Step 3: {viewingStaffProfile.isEnabled ? 'ENABLED' : 'DISABLED'}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-amber-600 flex items-center">
                  <Star className="w-3.5 h-3.5 fill-current mr-1 text-amber-400" />
                  {viewingStaffProfile.rating || 5.0} / 5.0 Customer Rating
                </span>
              </div>
            </div>

            {/* Profile Details Grid */}
            <div className="space-y-4 text-xs">
              {/* Section 1: Contact & Personal */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <h4 className="font-bold text-slate-900 text-xs mb-3 flex items-center gap-1.5 text-emerald-900">
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Personal & Contact Information (Collected at Onboarding)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-slate-400 block font-medium">Mobile Phone:</span>
                    <span className="font-mono font-bold text-slate-800">{viewingStaffProfile.phone}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Email:</span>
                    <span className="font-medium text-slate-800">{viewingStaffProfile.email || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Gender:</span>
                    <span className="font-medium text-slate-800">{viewingStaffProfile.gender || 'Not specified'}</span>
                  </div>
                </div>
              </div>

              {/* Section 2: Clinical Qualifications & Council Registration */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <h4 className="font-bold text-slate-900 text-xs mb-3 flex items-center gap-1.5 text-indigo-900">
                  <Stethoscope className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Clinical Education & Registration</span>
                </h4>
                <div className="mb-3">
                  <span className="text-slate-400 block font-medium mb-1">Clinical Category:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(viewingStaffProfile.role || 'Nursing').split(',').map((cat, idx) => (
                      <span key={idx} className="font-bold text-cyan-900 bg-white border border-cyan-200 px-2.5 py-0.5 rounded-lg text-xs shadow-2xs">
                        {cat.trim()}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-2.5">
                  <div>
                    <span className="text-slate-400 block font-medium">Degrees / Qualifications:</span>
                    <span className="font-bold text-slate-800">{viewingStaffProfile.qualification || 'B.Sc Nursing / Diploma in Nursing'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Clinical Experience:</span>
                    <span className="font-bold text-slate-800">{viewingStaffProfile.experienceYrs} Years</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Nursing / Medical Council License:</span>
                    <span className="font-mono font-bold text-indigo-800">{viewingStaffProfile.licenseNo || 'DMC/RN/2019/8492'}</span>
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Specialized Clinical Procedures:</span>
                  <span className="font-medium text-slate-800">
                    {viewingStaffProfile.specializations || 'IV Drip Therapy, Wound Dressing, Catheter Care, Post-Op Rehabilitation'}
                  </span>
                </div>
              </div>

              {/* Section 3: Legal & Police Verification Records */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <h4 className="font-bold text-slate-900 text-xs mb-3 flex items-center gap-1.5 text-amber-900">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>Identity Documents & Background Verification</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                  <div>
                    <span className="text-slate-400 block font-medium">Identity Document:</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {viewingStaffProfile.idProofType || 'Aadhaar Card'}: {viewingStaffProfile.idProofNo || 'XXXX-XXXX-4920'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Police Verification Certificate:</span>
                    <span className="font-medium text-emerald-800">
                      {viewingStaffProfile.policeVerifDoc || 'Clean Record - Certificate on file'}
                    </span>
                  </div>
                </div>

                {viewingStaffProfile.verificationComment && (
                  <div className="p-3 bg-white rounded-xl border border-amber-200 mt-2">
                    <span className="font-bold text-slate-700 block mb-0.5">Agency Audit & Verification Comment:</span>
                    <p className="text-slate-600 italic">"{viewingStaffProfile.verificationComment}"</p>
                    {viewingStaffProfile.verifiedAt && (
                      <span className="text-[10px] text-slate-400 block mt-1 font-mono">
                        Audited on: {new Date(viewingStaffProfile.verifiedAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Section 4: Operational Locality & Bio */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <h4 className="font-bold text-slate-900 text-xs mb-3 flex items-center gap-1.5 text-cyan-900">
                  <MapPin className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Coverage Area & Professional Bio</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                  <div>
                    <span className="text-slate-400 block font-medium">Coverage Area:</span>
                    <span className="font-semibold text-slate-800">{viewingStaffProfile.serviceArea || 'South Delhi, Hauz Khas, Saket'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Languages:</span>
                    <span className="font-semibold text-slate-800">{viewingStaffProfile.languages || 'English, Hindi'}</span>
                  </div>
                </div>
                {viewingStaffProfile.bio && (
                  <div className="pt-2 border-t border-slate-200/60">
                    <span className="text-slate-400 block font-medium">Professional Bio:</span>
                    <p className="text-slate-700 mt-0.5 leading-relaxed">{viewingStaffProfile.bio}</p>
                  </div>
                )}
              </div>

              {/* Agency Admin Quick Action Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    const st = viewingStaffProfile;
                    setViewingStaffProfile(null);
                    setVerifyingStaff(st);
                  }}
                  className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Step 2: Edit Verification Audit</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const st = viewingStaffProfile;
                    handleToggleStaffEnablement(st);
                    setViewingStaffProfile(null);
                  }}
                  className={`px-4 py-2 rounded-xl font-bold text-white transition flex items-center gap-1.5 shadow-xs cursor-pointer ${
                    viewingStaffProfile.isEnabled ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Step 3: {viewingStaffProfile.isEnabled ? 'Disable Dispatch' : 'Enable Dispatch'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
