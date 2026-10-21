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
  Navigation,} from 'lucide-react';

interface AuthUser {
  id: string;
  username: string;
  name: string;
  role: 'SUPER_ADMIN' | 'AGENCY_ADMIN' | 'AGENCY_CARE' | 'PARAMEDIC' | 'PATIENT';
  agencyId?: string;
  staffId?: string;
  phone?: string;
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
  experienceYrs: number;
  lat: number;
  lng: number;
  rating: number;
  online: boolean;
  status: string;
}

interface BookingRecord {
  id: string;
  serviceId: string;
  serviceName: string;
  category?: string;
  agencyId?: string;
  agencyName?: string;
  patientName: string;
  patientPhone: string;
  address: string;
  status: string;
  radiusKm: number;
  assignedStaff: string;
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

  // Data states
  const [services, setServices] = useState<Service[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [alerts, setAlerts] = useState<AgencyAlert[]>([]);
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);

  // Patient Booking Flow
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [bookingStep, setBookingStep] = useState<'browse' | 'select_time' | 'dispatching' | 'confirmed'>('browse');
  const [serviceToBook, setServiceToBook] = useState<Service | null>(null);
  const [selectedBookingTime, setSelectedBookingTime] = useState<string>('ASAP (Next 30 mins)');
  const [customBookingTime, setCustomBookingTime] = useState<string>('');
  const [dispatchRadius, setDispatchRadius] = useState<number>(5);
  const [confirmedCaregiver, setConfirmedCaregiver] = useState<Staff | null>(null);

  // Modal forms
  const [showAddModal, setShowAddModal] = useState<string | null>(null);

  // Search Input in Header & Banner Toggle
  const [isSearchActive, setIsSearchActive] = useState(false);

  // Edit Modals State
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editingPackage, setEditingPackage] = useState<PackageItem | null>(null);
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  // Customized Package creation for Customer (by Agency Care / Agency Admin)
  const [newCustomPackage, setNewCustomPackage] = useState({
    customerId: 'USR-005', // Default tagged customer
    customerName: 'Priya Sharma (Patient)',
    name: '',
    category: 'Nursing',
    durationDays: 7,
    totalVisits: 14,
    price: 3999,
    originalPrice: 5999,
    description: ''
  });

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

  // AV Consultation & Transit State
  const [activeAVSession, setActiveAVSession] = useState<BookingRecord | null>(null);
  const [transitBookingId, setTransitBookingId] = useState<string | null>(null);
  const [transitSecondsLeft, setTransitSecondsLeft] = useState<number>(0);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isFamilyJoined, setIsFamilyJoined] = useState(false);
  const [avCallDuration, setAvCallDuration] = useState<number>(0);

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
  const [newStaff, setNewStaff] = useState({ name: '', role: 'Registered Nurse', phone: '', experienceYrs: 3, lat: 28.56, lng: 77.20 });
  const [newPackage, setNewPackage] = useState({ name: '', category: 'Nursing', durationDays: 7, totalVisits: 14, price: 4999, originalPrice: 6999, description: '' });
  const [newAgencyService, setNewAgencyService] = useState({ name: '', category: 'Nursing', duration: '45 min', price: 699, staffType: 'Registered Nurse', description: '' });

  useEffect(() => {
    fetchData();
  }, [authUser]);

  const fetchData = async () => {
    try {
      let pkgUrl = '/api/v1/packages';
      if (authUser?.role === 'PATIENT') {
        pkgUrl = `/api/v1/packages?forCustomer=${encodeURIComponent(authUser.id)}`;
      } else if (authUser?.role === 'AGENCY_ADMIN' || authUser?.role === 'AGENCY_CARE' || authUser?.role === 'SUPER_ADMIN') {
        pkgUrl = '/api/v1/packages?all=true';
      }

      const [resSrv, resAg, resPkg, resStf, resBk, resAl, resMet] = await Promise.all([
        fetch('/api/v1/services').then(r => r.json()),
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
      if (resBk.data) setBookings(resBk.data);
      if (resAl.data) setAlerts(resAl.data);
      if (resMet.data) setMetrics(resMet.data);
    } catch {
      // offline fallback
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

  // AgencyAdmin: Onboard Paramedical Staff
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser?.agencyId) return;
    try {
      const res = await fetch('/api/v1/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agencyId: authUser.agencyId, ...newStaff })
      });
      if (res.ok) {
        setShowAddModal(null);
        setNewStaff({ name: '', role: 'Registered Nurse', phone: '', experienceYrs: 3, lat: 28.56, lng: 77.20 });
        fetchData();
      }
    } catch {
      alert('Error onboarding paramedic');
    }
  };

  // AgencyAdmin: Create Package
  const handleCreatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser?.agencyId) return;
    try {
      const res = await fetch('/api/v1/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agencyId: authUser.agencyId, ...newPackage })
      });
      if (res.ok) {
        setShowAddModal(null);
        setNewPackage({ name: '', category: 'Nursing', durationDays: 7, totalVisits: 14, price: 4999, originalPrice: 6999, description: '' });
        fetchData();
      }
    } catch {
      alert('Error creating package');
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

  // Open booking time selection dialog
  const handleOpenBookingModal = (service: Service) => {
    setServiceToBook(service);
    setSelectedBookingTime('ASAP (Next 30 mins)');
    setCustomBookingTime('');
    setBookingStep('select_time');
  };

  // Patient confirms booking with time
  const handleConfirmBookingWithTime = async () => {
    if (!serviceToBook) return;
    const finalBookingTime = customBookingTime.trim() ? customBookingTime.trim() : selectedBookingTime;

    setBookingStep('dispatching');
    setDispatchRadius(5);

    try {
      const res = await fetch('/api/v1/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: serviceToBook.id,
          agencyId: serviceToBook.createdByAgencyId || 'AG-01',
          patientName: authUser?.name || 'Priya Sharma (Patient)',
          patientPhone: authUser?.phone || '+91 98765 12345',
          patientAddress: 'Flat 402, Green Glen Layout, Bellandur, Delhi NCR',
          patientLat: 28.5700,
          patientLng: 77.2100,
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

  // Agency Care / Admin create custom package
  const handleCreateCustomPackage = async (e: React.FormEvent) => {
    e.preventDefault();
    const agencyId = authUser?.agencyId || 'AG-01';
    try {
      const res = await fetch('/api/v1/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agencyId,
          name: newCustomPackage.name,
          category: newCustomPackage.category,
          durationDays: Number(newCustomPackage.durationDays),
          totalVisits: Number(newCustomPackage.totalVisits),
          price: Number(newCustomPackage.price),
          originalPrice: Number(newCustomPackage.originalPrice),
          discountPercent: Math.round(((Number(newCustomPackage.originalPrice) - Number(newCustomPackage.price)) / Number(newCustomPackage.originalPrice)) * 100),
          description: newCustomPackage.description,
          customerId: newCustomPackage.customerId
        })
      });
      if (res.ok) {
        setShowAddModal(null);
        setNewCustomPackage({
          customerId: 'USR-005',
          customerName: 'Priya Sharma (Patient)',
          name: '',
          category: 'Nursing',
          durationDays: 7,
          totalVisits: 14,
          price: 3999,
          originalPrice: 5999,
          description: ''
        });
        fetchData();
        alert('Customized care package generated and tagged to customer!');
      }
    } catch {
      alert('Error creating custom package');
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
  
  // Paramedic Scoped Visits
  const paramedicVisits = authUser?.staffId 
    ? bookings.filter(b => b.assignedStaff.includes(authUser.name.split(',')[0])) 
    : bookings.slice(0, 3);

  // Patient Scoped Bookings
  const patientBookings = authUser?.phone 
    ? bookings.filter(b => b.patientPhone.includes(authUser.phone?.slice(-5) || '12345'))
    : bookings.filter(b => b.patientName.includes('Priya'));

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
                  Book verified registered nurses, physiotherapists, and diagnostic technicians with <strong>automated 5 km radius radar dispatch</strong> and <strong>0% double-booking concurrency locking</strong>.
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
                    <p className="text-[11px] text-cyan-700 font-medium mb-2 flex items-center">
                      <Building2 className="w-3 h-3 mr-1" /> {pkg.agencyName}
                    </p>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-3">{pkg.description}</p>
                  </div>
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs line-through text-slate-400 block">₹{pkg.originalPrice}</span>
                      <span className="text-base font-extrabold text-slate-900">₹{pkg.price}</span>
                    </div>
                    <button 
                      onClick={() => alert(`Enrolled in ${pkg.name}. Our agency coordinator will connect with you shortly.`)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-cyan-600 text-white rounded-lg text-xs font-bold transition shadow-xs"
                    >
                      Enroll Plan
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Services Catalogue */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Clinical Home Services (Master Catalogue)</h2>
              <p className="text-xs text-slate-500">Immediate on-demand clinical procedures with radar auto-dispatch</p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-2 sm:pb-0">
              {['All', 'Nursing', 'Physiotherapy', 'Elderly Care', 'Lab & Diagnostics'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition ${
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {services
              .filter(s => selectedCategory === 'All' || s.category === selectedCategory)
              .filter(s => !searchQuery.trim() ||
                s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.staffType.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map(service => {
                const assignedAgencyName = service.createdByAgencyId 
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
                        {service.isMaster ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                            MASTER LIST
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            AGENCY SPECIALTY
                          </span>
                        )}
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

              {loginError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

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
                  className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-bold shadow-md shadow-cyan-600/20 transition disabled:opacity-50"
                >
                  {isLoggingIn ? 'Authenticating with OAuth2...' : 'Log In to Console'}
                </button>
              </form>

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
                      {authUser.role === 'AGENCY_ADMIN' && 'Agency Staff Pool • Packages & Custom Services • SuperAdmin Alerts'}
                      {authUser.role === 'AGENCY_CARE' && 'Agency Customer Care Desk • Dispatch Support & Patient Request Management'}
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
                        <Plus className="w-3.5 h-3.5 mr-1" /> Specialty Services
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
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold self-start sm:self-auto ${
                                          b.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                          b.status === 'CONFIRMED' ? 'bg-cyan-50 text-cyan-800 border border-cyan-200' :
                                          'bg-amber-50 text-amber-700 border border-amber-200'
                                        }`}>
                                          {b.status === 'COMPLETED' ? 'COMPLETED / SERVED' :
                                           b.status === 'CONFIRMED' ? 'PARAMEDIC DISPATCHED' : b.status}
                                        </span>
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
                          <th className="py-3 px-4">Category</th>
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
                          <th className="py-3 px-4">Clinical Role</th>
                          <th className="py-3 px-4">Experience</th>
                          <th className="py-3 px-4">Phone</th>
                          <th className="py-3 px-4">Rating</th>
                          <th className="py-3 px-4">Radar Status</th>
                          <th className="py-3 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {agencyStaff.map(st => (
                          <tr key={st.id} className="hover:bg-slate-50 transition">
                            <td className="py-3 px-4 font-bold text-slate-900">
                              <div>{st.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{st.id}</div>
                            </td>
                            <td className="py-3 px-4 font-semibold text-cyan-800">{st.role}</td>
                            <td className="py-3 px-4 text-slate-600">{st.experienceYrs} years</td>
                            <td className="py-3 px-4 font-mono text-slate-600">{st.phone}</td>
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-50 text-amber-700">
                                <Star className="w-3 h-3 fill-current mr-1 text-amber-400" /> {st.rating}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <button
                                onClick={() => handleToggleDuty(st.id, st.online)}
                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold transition cursor-pointer ${
                                  st.online ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                                }`}
                                title="Click to toggle On-Duty / Off-Duty"
                              >
                                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${st.online ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                                {st.online ? 'ON-DUTY' : 'OFF-DUTY'}
                              </button>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => setEditingStaff(st)}
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition inline-flex items-center gap-1"
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

              {authUser.role === 'AGENCY_ADMIN' && portalSection === 'agency_packages' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Agency Care Packages & Custom Bundles</h3>
                      <p className="text-xs text-slate-500">Standard bundles and customer-specific packages (valid for 2 weeks until accepted)</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowAddModal('custom_package')}
                        className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1 shadow-xs cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> <span>Create Custom Package for Customer</span>
                      </button>
                      <button
                        onClick={() => setShowAddModal('package')}
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
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">{pkg.category}</span>
                          <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">{pkg.discountPercent}% OFF</span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm">{pkg.name}</h4>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{pkg.description}</p>
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
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Agency Specialty Services</h3>
                      <p className="text-xs text-slate-500">Offer niche clinical procedures delivered exclusively by your staff</p>
                    </div>
                    <button
                      onClick={() => setShowAddModal('agency_service')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1 shadow-xs"
                    >
                      <Plus className="w-4 h-4" /> <span>Add Specialty Service</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {services
                      .filter(s => s.createdByAgencyId === authUser.agencyId || s.isMaster)
                      .map(s => (
                        <div key={s.id} className="border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-slate-600 uppercase bg-slate-100 px-2 py-0.5 rounded">{s.category}</span>
                            {s.isMaster ? (
                              <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded">MASTER INHERITED</span>
                            ) : (
                              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">AGENCY SPECIALTY</span>
                            )}
                          </div>
                          <h4 className="font-bold text-slate-900 text-sm">{s.name}</h4>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{s.description}</p>
                          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                            <span className="text-slate-500">{s.staffType}</span>
                            <span className="font-bold text-slate-900">₹{s.price}</span>
                          </div>
                        </div>
                      ))}
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
              {/* C. AGENCY CUSTOMER CARE VIEW                                              */}
              {/* ========================================================================= */}
              {authUser.role === 'AGENCY_CARE' && portalSection === 'care_queue' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Agency Customer Care Dispatch Desk</h3>
                      <p className="text-xs text-slate-500">Monitor incoming patient calls, dispatch requests, and re-assign caregivers</p>
                    </div>
                    <span className="px-3 py-1 bg-amber-50 text-amber-800 font-bold text-xs rounded-full border border-amber-200">
                      Agency Node: LifeCare Health (AG-01)
                    </span>
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
                          <th className="py-3 px-4 text-right">Care Action</th>
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
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                b.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' :
                                b.status === 'CONFIRMED' ? 'bg-cyan-50 text-cyan-800' : 'bg-amber-50 text-amber-700'
                              }`}>
                                {b.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => {
                                  setSelectedBookingForUpdate(b);
                                  setVisitNotes(b.clinicalNotes || '');
                                }}
                                className="px-2.5 py-1 bg-slate-900 hover:bg-cyan-700 text-white rounded-lg text-xs font-semibold transition"
                              >
                                View / Update
                              </button>
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
                      onClick={() => setShowAddModal('custom_package')}
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
              {/* D. PARAMEDICAL STAFF VIEW (MY ASSIGNED VISITS & VITALS LOG)               */}
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
                              {v.status === 'COMPLETED' && (
                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                                  <CheckCheck className="w-3.5 h-3.5" /> VISIT COMPLETED
                                </span>
                              )}
                              {v.status === 'CONFIRMED' && !isTransit && (
                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" /> READY FOR VISIT
                                </span>
                              )}
                              {(v.status === 'EN_ROUTE' || isTransit) && (
                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 flex items-center gap-1 animate-pulse">
                                  <Navigation className="w-3.5 h-3.5" /> IN TRANSIT TO PATIENT ({transitSecondsLeft}s)
                                </span>
                              )}
                              {v.status === 'REACHED' && (
                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                                  <Radio className="w-3.5 h-3.5 text-rose-600 animate-pulse" /> REACHED DESTINATION • LIVE AV
                                </span>
                              )}
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
                                <span>Start Visit (Depart)</span>
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
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">My Home Care Visits & History</h3>
                      <p className="text-xs text-slate-500">Track caregiver arrival, clinical vitals recorded, and service receipts</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('patient')}
                      className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> <span>Book New Caregiver</span>
                    </button>
                  </div>

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
                            {b.status === 'SEARCHING' && (!b.retryCount || b.retryCount === 0) && (
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-50 text-cyan-800 border border-cyan-200 flex items-center gap-1 animate-pulse">
                                <Navigation className="w-3.5 h-3.5 text-cyan-600 animate-spin" /> Searching Nearest Staff (5 km)
                              </span>
                            )}
                            {b.status === 'COMPLETED' && (
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                <CheckCheck className="w-3.5 h-3.5" /> VISIT COMPLETED
                              </span>
                            )}
                            {b.status === 'CONFIRMED' && (
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-50 text-cyan-800 border border-cyan-200 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" /> PARAMEDIC ASSIGNED
                              </span>
                            )}
                            {b.status === 'EN_ROUTE' && (
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1 animate-pulse">
                                <Navigation className="w-3.5 h-3.5" /> PARAMEDIC EN ROUTE
                              </span>
                            )}
                            {(b.status === 'REACHED' || b.avActive) && (
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-300 flex items-center gap-1 animate-bounce">
                                <Radio className="w-3.5 h-3.5 text-rose-600" /> CAREGIVER REACHED • AUDIO/VIDEO ON
                              </span>
                            )}
                            {b.status === 'CANCELLED' && (
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-300 flex items-center gap-1">
                                <X className="w-3.5 h-3.5 text-rose-500" /> CANCELLED
                              </span>
                            )}
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
          {authUser.role === 'PARAMEDIC' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Paramedic Header Card */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center font-extrabold text-3xl shadow-lg shadow-teal-500/20">
                    PS
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-black text-slate-900">{authUser.name}</h2>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">Certified Nurse</span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-100 text-cyan-800">NABH Accredited</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Staff ID: <strong className="font-mono text-slate-700">STF-101</strong> • Agency: <strong className="text-cyan-800">LifeCare Home Health (AG-01)</strong>
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-600">
                      <span className="flex items-center gap-1 font-bold text-amber-600">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> 4.95 Rating (142 Reviews)
                      </span>
                      <span>• Experience: <strong>7+ Years (Critical Care & Home Nursing)</strong></span>
                      <span className="flex items-center gap-1 font-mono text-slate-700">
                        <Phone className="w-3.5 h-3.5 text-cyan-600" /> {authUser.phone || '+91 98765 43210'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-row md:flex-col items-center md:items-end gap-2 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                  {(() => {
                    const currentStaff = staffList.find(s => s.id === (authUser.staffId || 'STF-101'));
                    const isOnline = currentStaff ? currentStaff.online : true;
                    return (
                      <button
                        onClick={() => handleToggleDuty(authUser.staffId || 'STF-101', isOnline)}
                        className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer shadow-xs ${
                          isOnline
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-300 hover:bg-rose-200'
                        }`}
                        title="Click to change your radar duty status"
                      >
                        <span className={`w-2 h-2 rounded-full mr-1.5 ${isOnline ? 'bg-emerald-600 animate-pulse' : 'bg-rose-600'}`}></span>
                        {isOnline ? 'ON-DUTY (ACCEPTING VISITS)' : 'OFF-DUTY (RADAR PAUSED)'}
                      </button>
                    );
                  })()}
                  <button
                    onClick={() => setActiveTab('portal')}
                    className="w-full md:w-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
                  >
                    Back to Assigned Visits
                  </button>
                </div>
              </div>

              {/* Paramedic Attributes Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Available Hours & Shifts */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-5 h-5 text-cyan-600" />
                    <h3 className="font-bold text-slate-900 text-base">Working Shifts & Availability</h3>
                  </div>
                  <div className="space-y-3 text-xs text-slate-600">
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-400">Shift Hours:</span>
                      <span className="font-bold text-slate-900">08:00 AM – 08:00 PM (12-Hr Shift)</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-400">Working Days:</span>
                      <span className="font-bold text-slate-900">Monday – Saturday</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-400">Max Visits/Day:</span>
                      <span className="font-bold text-slate-900">6 Home Procedures</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-slate-400">Emergency On-Call:</span>
                      <span className="font-bold text-emerald-600">Enabled (Within 5 km)</span>
                    </div>
                  </div>
                </div>

                {/* Available Coverage Areas (5km / 10km Radius) */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-bold text-slate-900 text-base">Designated Service Areas</h3>
                  </div>
                  <p className="text-xs text-slate-500 mb-3">Geo-fenced radar dispatch zones tagged to Home Base (Green Park, Delhi):</p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {['Green Park (Primary)', 'Hauz Khas', 'Safdarjung Enclave', 'South Extension', 'Greater Kailash 1', 'Defence Colony', 'Lajpat Nagar'].map(area => (
                      <span key={area} className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium">
                        {area}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
                    Radar Broadcast Radius: <strong>5.0 km</strong> (Auto-expands to 10.0 km upon SLA delay)
                  </div>
                </div>

                {/* Clinical Qualifications & Certificates */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-bold text-slate-900 text-base">Credentials & Registration</h3>
                  </div>
                  <div className="space-y-2.5 text-xs text-slate-600">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Nursing Council Reg No:</span>
                      <span className="font-mono font-bold text-slate-900">INC-DEL-RN-88492</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Degree & University:</span>
                      <span className="font-semibold text-slate-800">B.Sc Nursing (AIIMS New Delhi)</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Certifications:</span>
                      <span className="text-slate-700">BLS (Basic Life Support), ACLS, Infection Control</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Services Offered by this Paramedic */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Certified Clinical Procedures Offered</h3>
                    <p className="text-xs text-slate-500">Authorized services performed in home settings with sterile clinical kit</p>
                  </div>
                  <span className="text-xs font-bold text-cyan-800 bg-cyan-50 px-3 py-1 rounded-full border border-cyan-200">
                    4 Authorized Clinical Competencies
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { name: 'IV Drip / Infusion Setup', cat: 'Nursing', time: '1-3 Hours', fee: '₹699' },
                    { name: 'Injection (IM / IV / SC)', cat: 'Nursing', time: '15-30 Min', fee: '₹299' },
                    { name: 'Catheter Insertion & Wash', cat: 'Nursing', time: '30-45 Min', fee: '₹549' },
                    { name: 'Aseptic Wound Dressing', cat: 'Nursing', time: '30-60 Min', fee: '₹499' }
                  ].map(srv => (
                    <div key={srv.name} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-cyan-700 bg-cyan-100/50 px-2 py-0.5 rounded">
                          {srv.cat}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm mt-2">{srv.name}</h4>
                        <p className="text-xs text-slate-500 mt-1">Duration: {srv.time}</p>
                      </div>
                      <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-400">Standard Fee</span>
                        <span className="text-slate-900">{srv.fee}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Patient Reviews & Feedback */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Recent Patient Reviews & Feedback</h3>
                    <p className="text-xs text-slate-500">Verified home visit ratings collected after procedure sign-off</p>
                  </div>
                  <div className="flex items-center gap-1 font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full text-xs">
                    <Star className="w-3.5 h-3.5 fill-amber-400" /> 4.95 Average Score
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xs text-slate-900">Mrs. Priya Sharma (Green Glen Layout)</span>
                      <div className="flex items-center text-amber-500">
                        <Star className="w-3 h-3 fill-current" />
                        <Star className="w-3 h-3 fill-current" />
                        <Star className="w-3 h-3 fill-current" />
                        <Star className="w-3 h-3 fill-current" />
                        <Star className="w-3 h-3 fill-current" />
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      "Nurse Pooja was extremely gentle while changing the post-op knee dressing. She checked my mother's blood pressure and oxygen without rushing and explained all medication reminders."
                    </p>
                    <span className="text-[10px] text-slate-400 mt-2 block font-mono">Verified Visit: Oct 19, 2026</span>
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xs text-slate-900">Col. S. K. Mehta (Safdarjung Enclave)</span>
                      <div className="flex items-center text-amber-500">
                        <Star className="w-3 h-3 fill-current" />
                        <Star className="w-3 h-3 fill-current" />
                        <Star className="w-3 h-3 fill-current" />
                        <Star className="w-3 h-3 fill-current" />
                        <Star className="w-3 h-3 fill-current" />
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      "Very punctual arrival within 25 minutes of booking. The IV saline drip setup was sterile and monitored with utmost professional care."
                    </p>
                    <span className="text-[10px] text-slate-400 mt-2 block font-mono">Verified Visit: Oct 12, 2026</span>
                  </div>
                </div>
              </div>
            </div>
          )}

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
      {/* 3. CLINICAL VITALS UPDATE MODAL (PARAMEDIC & AGENCY CARE)                 */}
      {/* ========================================================================= */}
      {selectedBookingForUpdate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedBookingForUpdate(null)}
              className="absolute top-5 right-5 p-1 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-1">Clinical Visit & Vitals Logging</h3>
            <p className="text-xs text-slate-500 mb-4">Patient: <strong>{selectedBookingForUpdate.patientName}</strong> ({selectedBookingForUpdate.serviceName})</p>

            <form onSubmit={handleUpdateVisit} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Blood Pressure</label>
                  <input
                    type="text"
                    value={visitBP}
                    onChange={e => setVisitBP(e.target.value)}
                    placeholder="120/80 mmHg"
                    className="w-full px-3 py-2 border rounded-xl text-xs mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">SpO2 Level</label>
                  <input
                    type="text"
                    value={visitSpO2}
                    onChange={e => setVisitSpO2(e.target.value)}
                    placeholder="99%"
                    className="w-full px-3 py-2 border rounded-xl text-xs mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Pulse Rate</label>
                  <input
                    type="text"
                    value={visitPulse}
                    onChange={e => setVisitPulse(e.target.value)}
                    placeholder="72 bpm"
                    className="w-full px-3 py-2 border rounded-xl text-xs mt-1"
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
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                Sign Off & Complete Visit
              </button>
            </form>
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
                      <label className="text-xs font-semibold text-slate-700">Category</label>
                      <select
                        value={newMasterService.category}
                        onChange={e => setNewMasterService({ ...newMasterService, category: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-xs mt-1"
                      >
                        <option value="Nursing">Nursing</option>
                        <option value="Physiotherapy">Physiotherapy</option>
                        <option value="Elderly Care">Elderly Care</option>
                        <option value="Lab & Diagnostics">Lab & Diagnostics</option>
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

            {/* AgencyAdmin: Onboard Staff */}
            {showAddModal === 'staff' && (
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Onboard Paramedical Staff</h3>
                <p className="text-xs text-slate-500 mb-4">Add nurse or physiotherapist to your agency roster</p>
                <form onSubmit={handleCreateStaff} className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Anjali Nair, B.Sc Nursing"
                      value={newStaff.name}
                      onChange={e => setNewStaff({ ...newStaff, name: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-xs mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Clinical Role</label>
                      <select
                        value={newStaff.role}
                        onChange={e => setNewStaff({ ...newStaff, role: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-xs mt-1"
                      >
                        <option value="Registered Nurse">Registered Nurse</option>
                        <option value="Physiotherapist">Physiotherapist</option>
                        <option value="Certified Caregiver">Certified Caregiver</option>
                        <option value="Phlebotomist">Phlebotomist</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Experience (Yrs)</label>
                      <input
                        type="number"
                        required
                        value={newStaff.experienceYrs}
                        onChange={e => setNewStaff({ ...newStaff, experienceYrs: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border rounded-xl text-xs mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Mobile Phone</label>
                    <input
                      type="text"
                      required
                      placeholder="+91 98765 00000"
                      value={newStaff.phone}
                      onChange={e => setNewStaff({ ...newStaff, phone: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-xs mt-1"
                    />
                  </div>
                  <button type="submit" className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold mt-4">
                    Verify & Onboard Staff
                  </button>
                </form>
              </div>
            )}

            {/* AgencyAdmin: Create Package */}
            {showAddModal === 'package' && (
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Create Agency Care Package</h3>
                <p className="text-xs text-slate-500 mb-4">Multi-visit bundled care plan</p>
                <form onSubmit={handleCreatePackage} className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Package Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 14-Day Stroke Rehab Plan"
                      value={newPackage.name}
                      onChange={e => setNewPackage({ ...newPackage, name: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-xs mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Category</label>
                      <select
                        value={newPackage.category}
                        onChange={e => setNewPackage({ ...newPackage, category: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-xs mt-1"
                      >
                        <option value="Nursing">Nursing</option>
                        <option value="Physiotherapy">Physiotherapy</option>
                        <option value="Elderly Care">Elderly Care</option>
                        <option value="Lab & Diagnostics">Lab & Diagnostics</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Duration (Days)</label>
                      <input
                        type="number"
                        required
                        value={newPackage.durationDays}
                        onChange={e => setNewPackage({ ...newPackage, durationDays: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border rounded-xl text-xs mt-1"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Visits</label>
                      <input
                        type="number"
                        required
                        value={newPackage.totalVisits}
                        onChange={e => setNewPackage({ ...newPackage, totalVisits: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border rounded-xl text-xs mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Orig Price</label>
                      <input
                        type="number"
                        required
                        value={newPackage.originalPrice}
                        onChange={e => setNewPackage({ ...newPackage, originalPrice: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border rounded-xl text-xs mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Discount Price</label>
                      <input
                        type="number"
                        required
                        value={newPackage.price}
                        onChange={e => setNewPackage({ ...newPackage, price: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border rounded-xl text-xs mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Description</label>
                    <textarea
                      required
                      rows={3}
                      value={newPackage.description}
                      onChange={e => setNewPackage({ ...newPackage, description: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-xs mt-1"
                    />
                  </div>
                  <button type="submit" className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold mt-4">
                    Publish Package
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
                      <label className="text-xs font-semibold text-slate-700">Category</label>
                      <select
                        value={newAgencyService.category}
                        onChange={e => setNewAgencyService({ ...newAgencyService, category: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-xs mt-1"
                      >
                        <option value="Physiotherapy">Physiotherapy</option>
                        <option value="Nursing">Nursing</option>
                        <option value="Elderly Care">Elderly Care</option>
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
                  <span>Confirm & Broadcast (5 km)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. PATIENT RADAR DISPATCH OVERLAY                                         */}
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

            <h3 className="mt-3 text-xl font-bold text-slate-900">Broadcasting to Nearest Caregivers</h3>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              Searching certified paramedics within <strong>{dispatchRadius}.0 km</strong>. First-to-accept with atomic concurrency locking active.
            </p>

            <div className="mt-6 p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center space-x-2 text-xs text-slate-600">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span>Connecting to LifeCare Agency dispatch queue...</span>
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

            <h3 className="text-xl font-bold text-slate-900">Caregiver Dispatched!</h3>
            <p className="text-xs text-slate-500 mt-1">Confirmed with atomic concurrency lock (0% double-booking)</p>

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
              onClick={() => setBookingStep('browse')}
              className="mt-6 w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              Back to Patient Home
            </button>
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
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setEditingPackage(null)}
              className="absolute top-5 right-5 p-1 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Edit Care Package & Pricing</h3>
            <p className="text-xs text-slate-500 mb-4">Update package duration, visits, discount savings, or status</p>
            
            <form onSubmit={handleSavePackageEdit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Package Title</label>
                <input
                  type="text"
                  required
                  value={editingPackage.name}
                  onChange={e => setEditingPackage({ ...editingPackage, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Duration (Days)</label>
                  <input
                    type="number"
                    required
                    value={editingPackage.durationDays}
                    onChange={e => setEditingPackage({ ...editingPackage, durationDays: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-xl text-xs mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Total Visits</label>
                  <input
                    type="number"
                    required
                    value={editingPackage.totalVisits}
                    onChange={e => setEditingPackage({ ...editingPackage, totalVisits: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-xl text-xs mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Package Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={editingPackage.price}
                    onChange={e => {
                      const p = Number(e.target.value);
                      const orig = editingPackage.originalPrice || p;
                      const disc = orig > p ? Math.round(((orig - p) / orig) * 100) : 0;
                      setEditingPackage({ ...editingPackage, price: p, discountPercent: disc });
                    }}
                    className="w-full px-3 py-2 border bg-white rounded-xl text-xs mt-1 font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Original Price (₹)</label>
                  <input
                    type="number"
                    value={editingPackage.originalPrice}
                    onChange={e => {
                      const orig = Number(e.target.value);
                      const p = editingPackage.price;
                      const disc = orig > p ? Math.round(((orig - p) / orig) * 100) : 0;
                      setEditingPackage({ ...editingPackage, originalPrice: orig, discountPercent: disc });
                    }}
                    className="w-full px-3 py-2 border bg-white rounded-xl text-xs mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Discount %</label>
                  <input
                    type="number"
                    value={editingPackage.discountPercent}
                    onChange={e => {
                      const disc = Number(e.target.value);
                      const orig = editingPackage.originalPrice;
                      const p = Math.round(orig * (1 - disc / 100));
                      setEditingPackage({ ...editingPackage, discountPercent: disc, price: p });
                    }}
                    className="w-full px-3 py-2 border bg-white rounded-xl text-xs mt-1 text-emerald-600 font-bold"
                  />
                </div>
              </div>

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
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Update Package
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

      {/* D. EDIT STAFF MODAL (AGENCY ADMIN EDIT PARAMEDICAL STAFF) */}
      {editingStaff && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setEditingStaff(null)}
              className="absolute top-5 right-5 p-1 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Edit Paramedical Staff Member</h3>
            <p className="text-xs text-slate-500 mb-4">Update paramedic role, phone, experience, and radar readiness</p>
            
            <form onSubmit={handleSaveStaffEdit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Staff Full Name</label>
                <input
                  type="text"
                  required
                  value={editingStaff.name}
                  onChange={e => setEditingStaff({ ...editingStaff, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Clinical Role</label>
                  <select
                    value={editingStaff.role}
                    onChange={e => setEditingStaff({ ...editingStaff, role: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-xs mt-1"
                  >
                    <option value="Registered Nurse">Registered Nurse</option>
                    <option value="Physiotherapist">Physiotherapist</option>
                    <option value="Phlebotomist">Phlebotomist</option>
                    <option value="Certified Caregiver">Certified Caregiver</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Experience (Years)</label>
                  <input
                    type="number"
                    value={editingStaff.experienceYrs}
                    onChange={e => setEditingStaff({ ...editingStaff, experienceYrs: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-xl text-xs mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Phone Number</label>
                <input
                  type="text"
                  required
                  value={editingStaff.phone}
                  onChange={e => setEditingStaff({ ...editingStaff, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs mt-1 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Radar Duty Status</label>
                  <select
                    value={editingStaff.online ? '1' : '0'}
                    onChange={e => setEditingStaff({ ...editingStaff, online: e.target.value === '1' })}
                    className="w-full px-3 py-2 border rounded-xl text-xs mt-1 font-bold"
                  >
                    <option value="1">ON-DUTY (Radar Active)</option>
                    <option value="0">OFF-DUTY (Radar Paused)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Verification Status</label>
                  <select
                    value={editingStaff.status}
                    onChange={e => setEditingStaff({ ...editingStaff, status: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-xs mt-1"
                  >
                    <option value="VERIFIED">VERIFIED</option>
                    <option value="PENDING">PENDING AUDIT</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Save Staff Updates
              </button>
            </form>
          </div>
        </div>
      )}

      {/* E. CREATE CUSTOM PACKAGE MODAL (AGENCY CARE & AGENCY ADMIN) */}
      {showAddModal === 'custom_package' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowAddModal(null)}
              className="absolute top-5 right-5 p-1 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-bold text-slate-900">Create Customized Package for Customer</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Tagged exclusively to customer. Will automatically expire after 2 weeks if not purchased.
            </p>

            <form onSubmit={handleCreateCustomPackage} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Tagged Customer / Patient</label>
                <select
                  value={newCustomPackage.customerId}
                  onChange={e => setNewCustomPackage({ ...newCustomPackage, customerId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs mt-1 font-semibold text-slate-900 bg-indigo-50/50"
                >
                  <option value="USR-005">Priya Sharma (Patient) - USR-005 (+91 98765 12345)</option>
                  <option value="USR-006">Rajiv Khanna - USR-006 (+91 98111 22334)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Custom Package Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tailored Post-Op Recovery & Physio Bundle"
                  value={newCustomPackage.name}
                  onChange={e => setNewCustomPackage({ ...newCustomPackage, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Duration (Days)</label>
                  <input
                    type="number"
                    required
                    value={newCustomPackage.durationDays}
                    onChange={e => setNewCustomPackage({ ...newCustomPackage, durationDays: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-xl text-xs mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Total Clinical Visits</label>
                  <input
                    type="number"
                    required
                    value={newCustomPackage.totalVisits}
                    onChange={e => setNewCustomPackage({ ...newCustomPackage, totalVisits: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-xl text-xs mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-indigo-50/50 p-3 rounded-2xl border border-indigo-100">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Special Offered Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={newCustomPackage.price}
                    onChange={e => setNewCustomPackage({ ...newCustomPackage, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 border bg-white rounded-xl text-xs mt-1 font-bold text-indigo-700"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Standard Price (₹)</label>
                  <input
                    type="number"
                    value={newCustomPackage.originalPrice}
                    onChange={e => setNewCustomPackage({ ...newCustomPackage, originalPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 border bg-white rounded-xl text-xs mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Custom Inclusions & Instructions</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Includes daily vitals check, 2x wound dressings, and emergency nurse call support..."
                  value={newCustomPackage.description}
                  onChange={e => setNewCustomPackage({ ...newCustomPackage, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs mt-1"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800">
                <Clock className="w-3.5 h-3.5 inline mr-1 text-amber-600" />
                This package will only appear in the selected customer's portal and will auto-expire in <strong>14 days</strong> if not purchased.
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Generate & Dispatch Custom Package
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
