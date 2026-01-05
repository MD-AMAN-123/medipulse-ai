import React, { useState, useEffect } from 'react';
import { Plus, MessageSquare, CheckCircle, Crown, Edit2, Camera, Sun, Moon, Heart, Activity, LayoutGrid, ChevronRight, LogOut, Shield, Mic } from 'lucide-react';
import { AppView, HealthMetric, Appointment, Notification, Doctor } from './types';
import Dashboard from './components/Dashboard';
import AiChat from './components/AiChat';
import Appointments from './components/Appointments';
import Navigation from './components/Navigation';
import AdminPanel from './components/AdminPanel';
import { LiveAssistant } from './components/LiveAssistant';
import { LogVitalsModal } from './components/LogVitalsModal';
import { PaymentModal } from './components/PaymentModal';
import Login from './components/Login';
import { MediPulseLogo } from './components/MediPulseLogo';
import { apiService } from './services/apiService';

// Short pleasant notification chime (Valid Base64 WAV - 0.2s sine beep)
const NOTIFICATION_SOUND = "data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YUZvT18AAAAAAP//AAAAAAAA//8AAAAAAAAAAAAA//8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//wAA////////AAD//wAA//8AAAAA//8AAP//AAAAAP//AAAAAAAAAAAAAP//AAD//wAA//8AAAAA//8AAP//AAAAAP//AAD//wAA//8AAAAA//8AAP//AAAAAAAA//8AAP//AAAAAP//AAD//wAAAAAAAP//AAAAAAAA//8AAAAA//8AAP//AAAAAP//AAAAAAAA//8AAAAA//8AAP//AAAAAAAA//8AAAAA//8AAP//AAAAAP//AAD//wAAAAAAAP//AAAAAAAA//8AAAAA//8AAP//AAAAAP//AAAAAAAA//8AAAAA//8AAP//AAAAAAAA//8AAAAA//8AAP//AAAAAP//AAD//wAAAAAAAP//AAAAAAAA//8AAAAA//8AAP//AAAAAP//AAAAAAAA//8AAAAA//8AAP//AAAAAAAA//8AAAAA//8AAP//AAAAAP//AAD//wAAAAAAAP//AAAAAAAA//8AAAAA//8AAP//AAAAAP//AAAAAAAA//8AAAAA//8AAP//AAAAAAAA//8AAAAA//8AAP//AAAAAP//AAD//wAAAAAAAP//AAAAAAAA//8AAAAA//8AAP//AAAAAP//AAAAAAAA//8AAAAA//8AAP//AAAAAAAA//8AAAAA//8AAP//AAAAAP//AAD//wAAAAAAAP//AAAAAAAA//8AAAAA//8AAP//AAAAAP//AAAAAAAA//8AAAAA//8AAP//AAAAAAAA//8AAAAA//8AAP//AAAAAP//AAD//w==";

// Initial Data moved from Appointments.tsx
const initialDoctors: Doctor[] = [
  {
    id: 1,
    name: 'Dr. Sarah Chen',
    specialty: 'Cardiology Specialist',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=2070&auto=format&fit=crop',
    match: 98,
    price: 120,
    startTime: '09:00',
    endTime: '22:00',
    about: 'Expert in cardiovascular health with 15 years of experience.'
  },
  {
    id: 2,
    name: 'Dr. Michael Ross',
    specialty: 'Neurologist',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=2070&auto=format&fit=crop',
    match: 95,
    price: 150,
    startTime: '10:00',
    endTime: '22:00',
    about: 'Specializing in neurological disorders and migraine treatment.'
  },
  {
    id: 3,
    name: 'Dr. Emily White',
    specialty: 'Dermatologist',
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?q=80&w=1000&auto=format&fit=crop',
    match: 92,
    price: 100,
    startTime: '08:30',
    endTime: '22:00',
    about: 'Passionate about skin health and cosmetic dermatology.'
  }
];

const generateMeetLink = () => `https://meet.google.com/${Math.random().toString(36).substring(7)}-${Math.random().toString(36).substring(7)}-${Math.random().toString(36).substring(7)}`;

// Helper to get relative dates for dynamic data
const getRelativeDate = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  if (offset === 0) return 'Today';
  if (offset === 1) return 'Tomorrow';
  if (offset === -1) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<AppView>(AppView.DASHBOARD);
  const [isVitalsModalOpen, setIsVitalsModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Doctors State with Local Storage Persistence
  const [doctors, setDoctors] = useState<Doctor[]>(() => {
    try {
      const saved = localStorage.getItem('medipulse_doctors');
      return saved ? JSON.parse(saved) : initialDoctors;
    } catch (e) {
      return initialDoctors;
    }
  });

  // Save doctors to local storage whenever changed
  useEffect(() => {
    localStorage.setItem('medipulse_doctors', JSON.stringify(doctors));
  }, [doctors]);

  // Payment State
  const [isPremium, setIsPremium] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isUpgradeConfirmOpen, setIsUpgradeConfirmOpen] = useState(false);

  // Profile Editing State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedEmail, setEditedEmail] = useState('');
  const [editedMobile, setEditedMobile] = useState('');
  const [editedImage, setEditedImage] = useState('');

  // Admin Notifications State
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Flu Season Alert',
      message: 'Flu shots are now available. Book an appointment with a GP today.',
      time: '2 hours ago',
      type: 'alert',
      read: false
    },
    {
      id: '2',
      title: 'System Update',
      message: 'MediPulse AI has been updated with new symptom analysis models.',
      time: '1 day ago',
      type: 'success',
      read: false
    },
    {
      id: '3',
      title: 'Dr. Sarah Check-in',
      message: 'Dr. Sarah has reviewed your latest vitals and suggests increasing water intake.',
      time: '2 days ago',
      type: 'info',
      read: true
    }
  ]);

  // Appointments State with Local Storage Persistence
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    try {
      const saved = localStorage.getItem('medipulse_appointments');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // Fallback
    }

    // Default Initial Appointments
    return [
      {
        id: '1',
        patientName: 'Alex Johnson',
        patientMobile: '9876543210',
        doctorName: 'Dr. Sarah Johnson',
        specialty: 'Cardiologist',
        date: 'Today',
        time: '14:30',
        status: 'pending',
        imageUrl: 'https://picsum.photos/100/100',
        type: 'video',
        meetLink: 'https://meet.google.com/abc-defg-hij'
      },
      {
        id: '2',
        patientName: 'Alex Johnson',
        patientMobile: '9876543210',
        doctorName: 'Dr. Michael Chen',
        specialty: 'General Practitioner',
        date: getRelativeDate(2), // 2 days from now
        time: '09:00',
        status: 'upcoming',
        imageUrl: 'https://picsum.photos/102/102',
        type: 'in-person',
        location: 'MedCentral Clinic',
        meetLink: 'https://meet.google.com/xyz-uvwx-yz'
      },
      {
        id: '3',
        patientName: 'Alex Johnson',
        patientMobile: '9876543210',
        doctorName: 'Dr. Emily Davis',
        specialty: 'Dermatologist',
        date: getRelativeDate(5), // 5 days from now
        time: '11:15',
        status: 'pending',
        imageUrl: 'https://picsum.photos/103/103',
        type: 'in-person',
        location: 'Skin Care Center',
        meetLink: 'https://meet.google.com/lmn-opqr-stu'
      },
      // Additional patients for Admin view
      {
        id: '4',
        patientName: 'Maria Rodriguez',
        patientMobile: '9988776655',
        doctorName: 'Dr. Sarah Johnson',
        specialty: 'Cardiologist',
        date: 'Tomorrow',
        time: '10:00',
        status: 'pending',
        imageUrl: 'https://picsum.photos/104/104',
        type: 'video',
        meetLink: 'https://meet.google.com/def-ghij-klm'
      },
      {
        id: '5',
        patientName: 'David Kim',
        patientMobile: '9123456789',
        doctorName: 'Dr. Michael Chen',
        specialty: 'General Practitioner',
        date: 'Yesterday',
        time: '15:45',
        status: 'completed',
        imageUrl: 'https://picsum.photos/105/105',
        type: 'in-person',
        location: 'MedCentral Clinic'
      }
    ];
  });

  // Save appointments to local storage whenever changed
  useEffect(() => {
    localStorage.setItem('medipulse_appointments', JSON.stringify(appointments));
  }, [appointments]);

  // Lifted state to support "Realtime" updates
  const [metrics, setMetrics] = useState<HealthMetric[]>([
    {
      label: 'Heart Rate',
      value: 78,
      unit: 'bpm',
      trend: 'neutral',
      color: 'bg-rose-500 text-rose-500',
      icon: 'heart'
    },
    {
      label: 'Sleep',
      value: '7h 20m',
      unit: '',
      trend: 'up',
      change: 12,
      color: 'bg-indigo-500 text-indigo-500',
      icon: 'moon'
    },
    {
      label: 'Water',
      value: '1.2',
      unit: 'L',
      trend: 'down',
      change: -5,
      color: 'bg-cyan-500 text-cyan-500',
      icon: 'water'
    },
  ]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const isAdmin = user?.email === 'admin@medipulse.ai' || user?.role === 'admin';

  // Fetch from server on Admin Login or Periodically
  useEffect(() => {
    const fetchFromServer = async () => {
      if (isAdmin) {
        try {
          // Fetch Appointments
          const cloudAppointments = await apiService.fetchAppointments();
          if (cloudAppointments && cloudAppointments.length > 0) {
            setAppointments(cloudAppointments);
          }

          // Fetch Doctors
          const cloudDoctors = await apiService.fetchDoctors();
          if (cloudDoctors && cloudDoctors.length > 0) {
            setDoctors(cloudDoctors);
          }

          console.log("Admin: Full Cloud sync successful.");
        } catch (e) {
          console.warn("Cloud sync failed, using local data.", e);
        }
      }
    };

    fetchFromServer();

    // Optional: Refresh data every 30 seconds for Admin to see new patient requests
    let interval: any;
    if (isAdmin) {
      interval = setInterval(fetchFromServer, 30000);
    }
    return () => clearInterval(interval);
  }, [isAdmin]);

  // Sync to Cloud whenever data changes (Auto-save for Admin)
  useEffect(() => {
    if (isAdmin) {
      apiService.syncData({ appointments, doctors }).catch(console.error);
    }
  }, [appointments, doctors, isAdmin]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleLogin = (userData: any) => {
    setUser(userData);
  };

  const handleSaveVitals = (data: { heartRate: string; sleep: string; water: string }) => {
    setMetrics(prevMetrics => [
      { ...prevMetrics[0], value: data.heartRate || prevMetrics[0].value },
      { ...prevMetrics[1], value: data.sleep || prevMetrics[1].value },
      { ...prevMetrics[2], value: data.water || prevMetrics[2].value },
    ]);
    setIsVitalsModalOpen(false);
  };

  const handleBookAppointment = (newAppointment: Appointment) => {
    const appointmentWithUser: Appointment = {
      ...newAppointment,
      patientName: user?.name || "Guest User",
      patientMobile: user?.mobile || "",
      status: 'pending'
    };
    setAppointments(prev => [appointmentWithUser, ...prev]);
  };

  // Handler for AI Live Assistant Actions
  const handleAIUpdateProfile = (data: { name?: string; email?: string; mobile?: string }) => {
    setUser((prev: any) => ({
      ...prev,
      name: data.name || prev.name,
      email: data.email || prev.email,
      mobile: data.mobile || prev.mobile
    }));
    setNotifications(prev => [{
      id: Date.now().toString(),
      title: 'Profile Updated',
      message: 'Your profile details were updated via Voice Assistant.',
      time: 'Just now',
      type: 'success',
      read: false
    }, ...prev]);
  };

  const handleAIBookAppointment = (data: { doctorName: string; specialty: string; date: string; time: string; type: 'video' | 'in-person' }) => {
    const newAppointment: Appointment = {
      id: Date.now().toString(),
      doctorName: data.doctorName,
      specialty: data.specialty,
      date: data.date,
      time: data.time,
      type: data.type,
      status: 'pending',
      imageUrl: 'https://picsum.photos/100/100',
      patientName: user?.name || "Guest User",
      patientMobile: user?.mobile || "",
      meetLink: data.type === 'video' ? generateMeetLink() : undefined
    };
    setAppointments(prev => [newAppointment, ...prev]);

    setNotifications(prev => [{
      id: Date.now().toString(),
      title: 'Appointment Requested',
      message: `Voice Assistant booked with ${data.doctorName} for ${data.date}.`,
      time: 'Just now',
      type: 'success',
      read: false
    }, ...prev]);
  };

  const handleAddDoctor = (newDoctor: Doctor) => {
    setDoctors(prev => [...prev, newDoctor]);
  };

  const handleUpdateDoctor = (updatedDoctor: Doctor) => {
    setDoctors(prev => prev.map(d => d.id === updatedDoctor.id ? updatedDoctor : d));
  };

  const handleDeleteDoctor = (doctorId: string | number) => {
    setDoctors(prev => prev.filter(d => d.id !== doctorId));
  };

  const handleAIAddDoctor = (data: { name: string; specialty: string; price?: number; rating?: number }) => {
    const newDoctor: Doctor = {
      id: Date.now(),
      name: data.name,
      specialty: data.specialty,
      rating: data.rating || 4.8,
      price: data.price || 150,
      image: 'https://picsum.photos/100/100',
      match: 90,
      startTime: '09:00',
      endTime: '22:00'
    };

    handleAddDoctor(newDoctor);

    setNotifications(prev => [{
      id: Date.now().toString(),
      title: 'System Updated',
      message: `Added ${data.name} to the doctor's list.`,
      time: 'Just now',
      type: 'success',
      read: false
    }, ...prev]);
  };

  const handleAIUpdateAppointment = (data: { appointmentId: string; date?: string; time?: string; status?: string }) => {
    setAppointments(prev => prev.map(apt => {
      if (apt.id === data.appointmentId) {
        return {
          ...apt,
          date: data.date || apt.date,
          time: data.time || apt.time,
          status: (data.status as any) || apt.status
        };
      }
      return apt;
    }));

    setNotifications(prev => [{
      id: Date.now().toString(),
      title: 'Appointment Updated',
      message: `Appointment ID #${data.appointmentId} updated via Voice Command.`,
      time: 'Just now',
      type: 'info',
      read: true
    }, ...prev]);
  };

  const handleAIDeleteAppointment = (data: { appointmentId: string }) => {
    handleDeleteAppointment(data.appointmentId);
  };

  const handleUpdateAppointmentStatus = (id: string, newStatus: 'upcoming' | 'cancelled', meetLink?: string) => {
    setAppointments(prev => prev.map(apt =>
      apt.id === id ? { ...apt, status: newStatus, meetLink: meetLink || apt.meetLink } : apt
    ));

    const appointment = appointments.find(a => a.id === id);
    if (appointment) {
      const isAccepted = newStatus === 'upcoming';

      if (isAccepted) {
        try {
          const audio = new Audio(NOTIFICATION_SOUND);
          audio.volume = 0.5;
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise.catch(e => {
              console.error("Audio play failed:", e);
            });
          }
        } catch (e) {
          console.error("Audio init failed", e);
        }
      }

      let message = isAccepted
        ? `Your appointment with ${appointment.doctorName} on ${appointment.date} at ${appointment.time} has been accepted.`
        : `Your appointment with ${appointment.doctorName} on ${appointment.date} at ${appointment.time} has been declined.`;

      if (isAccepted && (meetLink || appointment.meetLink)) {
        message += ` Join Link: ${meetLink || appointment.meetLink}`;
      }

      const notification: Notification = {
        id: Date.now().toString(),
        title: isAccepted ? 'Appointment Confirmed' : 'Appointment Declined',
        message: message,
        time: 'Just now',
        type: isAccepted ? 'success' : 'alert',
        read: false
      };

      setNotifications(prev => [notification, ...prev]);
    }
  };

  const handleDeleteAppointment = (id: string) => {
    setAppointments(prev => prev.filter(apt => apt.id !== id));
    setNotifications(prev => [{
      id: Date.now().toString(),
      title: 'Appointment Deleted',
      message: 'The appointment record has been permanently removed.',
      time: 'Just now',
      type: 'info',
      read: true
    }, ...prev]);
  };

  const handleMarkNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleContactDoctor = () => {
    setActiveTab(AppView.APPOINTMENTS);
  };

  const handleEditProfile = () => {
    setEditedName(user?.name || "User");
    setEditedEmail(user?.email || "");
    setEditedImage(user?.picture || "");
    setEditedMobile(user?.mobile || "");
    setIsEditingProfile(true);
  };

  const handleSaveProfile = () => {
    if (editedMobile && editedMobile.length !== 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }
    setUser({ ...user, name: editedName, email: editedEmail, picture: editedImage, mobile: editedMobile });
    setIsEditingProfile(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case AppView.DASHBOARD:
        return (
          <Dashboard
            userName={user?.name || user?.given_name || "User"}
            userImage={user?.picture}
            metrics={metrics}
            appointments={appointments.filter(a => a.patientName === (user?.name || "Guest User") || a.patientName === "Alex Johnson")}
            notifications={notifications}
            onMarkNotificationRead={handleMarkNotificationRead}
            onLogVitals={() => setIsVitalsModalOpen(true)}
            isPremium={isPremium}
            onUpgrade={() => setIsUpgradeConfirmOpen(true)}
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
            isAdmin={isAdmin}
          />
        );
      case AppView.AI_CHAT:
        return <AiChat />;
      case AppView.LIVE_ASSISTANT:
        return (
          <LiveAssistant
            userName={user?.name || "User"}
            metrics={metrics}
            appointments={appointments}
            onUpdateProfile={handleAIUpdateProfile}
            onBookAppointment={handleAIBookAppointment}
            isAdmin={isAdmin}
            doctors={doctors}
            onAddDoctor={handleAIAddDoctor}
            onUpdateAppointment={handleAIUpdateAppointment}
            onDeleteAppointment={handleAIDeleteAppointment}
          />
        );
      case AppView.APPOINTMENTS:
        return (
          <Appointments
            doctors={doctors}
            onBook={handleBookAppointment}
            onBack={() => setActiveTab(AppView.DASHBOARD)}
            isAdmin={isAdmin}
            onAddDoctor={handleAddDoctor}
            onUpdateDoctor={handleUpdateDoctor}
            onDeleteDoctor={handleDeleteDoctor}
          />
        );
      case AppView.ADMIN_PANEL:
        return isAdmin ? (
          <AdminPanel
            appointments={appointments}
            onUpdateStatus={handleUpdateAppointmentStatus}
            onDeleteAppointment={handleDeleteAppointment}
          />
        ) : (
          <Dashboard
            userName={user?.name}
            metrics={metrics}
            appointments={appointments}
            notifications={notifications}
            onMarkNotificationRead={handleMarkNotificationRead}
            onLogVitals={() => setIsVitalsModalOpen(true)}
            isPremium={isPremium}
            onUpgrade={() => setIsUpgradeConfirmOpen(true)}
          />
        );
      case AppView.PROFILE:
        return (
          <div className="flex flex-col items-center pt-8 pb-32 text-slate-400 animate-fade-in w-full">
            <div className="relative mb-6">
              <div className="w-24 h-24 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shadow-lg border-4 border-white dark:border-slate-700 relative">
                {(isEditingProfile ? editedImage : user?.picture) ? (
                  <img src={isEditingProfile ? editedImage : user.picture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-teal-100 text-teal-600 font-bold text-2xl">
                    {((isEditingProfile ? editedName : user?.name) || "U").charAt(0)}
                  </div>
                )}

                {isEditingProfile && (
                  <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 cursor-pointer hover:bg-black/50 transition-colors z-10">
                    <Camera className="text-white opacity-90 mb-1" size={24} />
                    <span className="text-[9px] text-white font-semibold uppercase tracking-wide">Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {!isEditingProfile && (
                <button
                  onClick={handleEditProfile}
                  className="absolute bottom-0 right-0 bg-white dark:bg-slate-800 p-2 rounded-full shadow-md border border-slate-100 dark:border-slate-700 text-slate-400 hover:text-teal-600 transition-colors"
                >
                  <Edit2 size={14} />
                </button>
              )}
            </div>

            {isEditingProfile ? (
              <div className="w-full max-w-xs space-y-4 animate-fade-in">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Name</label>
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Email</label>
                  <input
                    type="email"
                    value={editedEmail}
                    onChange={(e) => setEditedEmail(e.target.value)}
                    className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Mobile Number</label>
                  <div className="relative">
                    <div className="absolute left-3 top-3.5 flex items-center gap-1 border-r border-slate-300 dark:border-slate-600 pr-2">
                      <img src="https://flagcdn.com/w20/in.png" alt="India" className="w-5 rounded-sm" />
                      <span className="text-slate-500 font-semibold text-sm">+91</span>
                    </div>
                    <input
                      type="tel"
                      value={editedMobile}
                      onChange={(e) => setEditedMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="98765 43210"
                      className="w-full pl-20 pr-4 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 ml-1">Must be exactly 10 digits.</p>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setIsEditingProfile(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    className="flex-1 py-2.5 rounded-xl bg-teal-600 text-white font-semibold shadow-lg shadow-teal-600/20 hover:bg-teal-700 transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">{user?.name || "User"}</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium">{user?.email}</p>
                {user?.mobile && (
                  <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1 mb-8 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">+91 {user.mobile}</p>
                )}
                {!user?.mobile && <div className="mb-8"></div>}

                {/* Navigation Menu */}
                <div className="w-full max-w-xs space-y-3 mb-8">
                  <button
                    onClick={() => setActiveTab(AppView.DASHBOARD)}
                    className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-teal-200 dark:hover:border-teal-900 transition-all shadow-sm group"
                  >
                    <div className="flex items-center gap-4">
                      <Activity size={20} className="text-slate-400 group-hover:text-teal-500 transition-colors" />
                      <span>Dashboard</span>
                    </div>
                    <ChevronRight size={18} className="text-slate-300 group-hover:text-teal-500 transition-colors" />
                  </button>

                  <button
                    onClick={() => setActiveTab(AppView.AI_CHAT)}
                    className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-teal-200 dark:hover:border-teal-900 transition-all shadow-sm group"
                  >
                    <div className="flex items-center gap-4">
                      <MessageSquare size={20} className="text-slate-400 group-hover:text-teal-500 transition-colors" />
                      <span>Chat Bot</span>
                    </div>
                    <ChevronRight size={18} className="text-slate-300 group-hover:text-teal-500 transition-colors" />
                  </button>

                  <button
                    onClick={() => setActiveTab(AppView.LIVE_ASSISTANT)}
                    className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-teal-200 dark:hover:border-teal-900 transition-all shadow-sm group"
                  >
                    <div className="flex items-center gap-4">
                      <Mic size={20} className="text-slate-400 group-hover:text-teal-500 transition-colors" />
                      <span>Live Voice Assistant</span>
                    </div>
                    <ChevronRight size={18} className="text-slate-300 group-hover:text-teal-500 transition-colors" />
                  </button>

                  <button
                    onClick={() => setActiveTab(AppView.APPOINTMENTS)}
                    className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-teal-200 dark:hover:border-teal-900 transition-all shadow-sm group"
                  >
                    <div className="flex items-center gap-4">
                      <CheckCircle size={20} className="text-slate-400 group-hover:text-teal-500 transition-colors" />
                      <span>Appointments</span>
                    </div>
                    <ChevronRight size={18} className="text-slate-300 group-hover:text-teal-500 transition-colors" />
                  </button>

                  {/* Admin Panel Link in Profile for quick access if Admin */}
                  {isAdmin && (
                    <button
                      onClick={() => setActiveTab(AppView.ADMIN_PANEL)}
                      className="w-full flex items-center justify-between p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800 text-indigo-700 dark:text-indigo-200 font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all shadow-sm group"
                    >
                      <div className="flex items-center gap-4">
                        <Shield size={20} className="text-indigo-500 group-hover:text-indigo-600 transition-colors" />
                        <span>Admin Portal</span>
                      </div>
                      <ChevronRight size={18} className="text-indigo-300 group-hover:text-indigo-500 transition-colors" />
                    </button>
                  )}
                </div>

                {/* Premium Banner */}
                {!isPremium && (
                  <div className="w-full max-w-xs bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden mb-6 group cursor-pointer" onClick={() => setIsUpgradeConfirmOpen(true)}>
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-2 font-bold text-lg">
                        <Crown size={20} fill="currentColor" className="text-yellow-300" />
                        <span>Go Premium</span>
                      </div>
                      <p className="text-indigo-100 text-sm mb-6 leading-relaxed opacity-90">
                        Unlock AI analysis, video insights & unlimited checks.
                      </p>
                      <button
                        onClick={(e) => { e.stopPropagation(); setIsUpgradeConfirmOpen(true); }}
                        className="w-full bg-white text-indigo-600 py-3 rounded-xl font-bold shadow-sm hover:bg-indigo-50 transition-colors"
                      >
                        Upgrade Now
                      </button>
                    </div>
                    <Crown className="absolute -bottom-6 -right-6 text-white opacity-10 w-32 h-32 group-hover:scale-110 transition-transform duration-700" />
                  </div>
                )}

                <div className="flex flex-col gap-3 w-full max-w-xs">
                  <button
                    onClick={() => setUser(null)}
                    className="w-full bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 py-3.5 rounded-2xl font-semibold hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex items-center justify-center gap-2"
                  >
                    <LogOut size={18} />
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        );
      default:
        return (
          <Dashboard
            userName={user?.given_name || "User"}
            userImage={user?.picture}
            metrics={metrics}
            appointments={appointments.filter(a => a.patientName === (user?.name || "Guest User") || a.patientName === "Alex Johnson")}
            notifications={notifications}
            onMarkNotificationRead={handleMarkNotificationRead}
            onLogVitals={() => setIsVitalsModalOpen(true)}
            isPremium={isPremium}
            onUpgrade={() => setIsUpgradeConfirmOpen(true)}
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
            isAdmin={isAdmin}
          />
        );
    }
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 md:flex font-sans">
      <div className="hidden md:flex flex-col w-64 border-r border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-900">
        <div className="flex items-center gap-3 mb-10">
          <MediPulseLogo className="w-12 h-12 animate-heartbeat" />
          <span className="font-bold text-2xl tracking-tight">
            <span className="text-[#1e3a8a] dark:text-blue-100">Medi</span>
            <span className="text-[#84cc16]">pulse</span>
          </span>
        </div>

        <nav className="space-y-2 flex-1">
          <button
            onClick={() => setActiveTab(AppView.DASHBOARD)}
            className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-3 ${activeTab === AppView.DASHBOARD ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <div className={`p-1.5 rounded-lg ${activeTab === AppView.DASHBOARD ? 'bg-teal-100 dark:bg-teal-900/40' : 'bg-transparent'}`}>
              <Activity size={18} />
            </div>
            Dashboard
          </button>

          <button
            onClick={() => setActiveTab(AppView.AI_CHAT)}
            className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-3 ${activeTab === AppView.AI_CHAT ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <div className={`p-1.5 rounded-lg ${activeTab === AppView.AI_CHAT ? 'bg-teal-100 dark:bg-teal-900/40' : 'bg-transparent'}`}>
              <MessageSquare size={18} />
            </div>
            Chat Bot
          </button>

          <button
            onClick={() => setActiveTab(AppView.LIVE_ASSISTANT)}
            className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-3 ${activeTab === AppView.LIVE_ASSISTANT ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <div className={`p-1.5 rounded-lg ${activeTab === AppView.LIVE_ASSISTANT ? 'bg-teal-100 dark:bg-teal-900/40' : 'bg-transparent'}`}>
              <Mic size={18} />
            </div>
            Voice Assistant
          </button>

          <button
            onClick={() => setActiveTab(AppView.APPOINTMENTS)}
            className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-3 ${activeTab === AppView.APPOINTMENTS ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <div className={`p-1.5 rounded-lg ${activeTab === AppView.APPOINTMENTS ? 'bg-teal-100 dark:bg-teal-900/40' : 'bg-transparent'}`}>
              <CheckCircle size={18} />
            </div>
            Appointments
          </button>

          {isAdmin && (
            <button
              onClick={() => setActiveTab(AppView.ADMIN_PANEL)}
              className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-3 mt-6 border-t border-slate-100 dark:border-slate-800 pt-6 ${activeTab === AppView.ADMIN_PANEL ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              <div className={`p-1.5 rounded-lg ${activeTab === AppView.ADMIN_PANEL ? 'bg-indigo-100 dark:bg-indigo-900/40' : 'bg-transparent'}`}>
                <Shield size={18} />
              </div>
              Admin Portal
            </button>
          )}
        </nav>

        {/* Premium Banner Sidebar */}
        {!isPremium && (
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-4 text-white shadow-lg shadow-indigo-600/20 mt-6 relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2 font-bold text-sm">
                <Crown size={16} />
                <span>Go Premium</span>
              </div>
              <p className="text-indigo-100 text-xs mb-3 leading-relaxed">
                Unlock AI analysis, video insights & unlimited checks.
              </p>
              <button
                onClick={() => setIsUpgradeConfirmOpen(true)}
                className="w-full bg-white text-indigo-600 py-2 rounded-lg text-xs font-bold shadow-sm hover:bg-indigo-50 transition-colors"
              >
                Upgrade Now
              </button>
            </div>
            <Crown className="absolute -bottom-4 -right-4 text-white opacity-10 w-24 h-24" />
          </div>
        )}
      </div>

      <main className="flex-1 w-full p-4 md:p-8 overflow-x-hidden pb-24 md:pb-8">
        {/* Mobile App Header */}
        <div className="md:hidden flex items-center gap-3 mb-6">
          <MediPulseLogo className="w-12 h-12 animate-heartbeat" />
          <span className="font-bold text-2xl tracking-tight">
            <span className="text-[#1e3a8a] dark:text-white">Medi</span>
            <span className="text-[#84cc16]">pulse</span>
          </span>
        </div>

        <div className="animate-fade-in">
          {renderContent()}
        </div>
      </main>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} isAdmin={isAdmin} />
      </div>

      <LogVitalsModal
        isOpen={isVitalsModalOpen}
        onClose={() => setIsVitalsModalOpen(false)}
        onSave={handleSaveVitals}
      />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={() => setIsPremium(true)}
      />

      {/* Confirmation Dialog */}
      {isUpgradeConfirmOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center">
            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown className="text-indigo-600 dark:text-indigo-400" size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Upgrade to Premium?</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">
              Unlock unlimited AI analysis, video generation, and detailed health reports for just $19.99/mo.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setIsUpgradeConfirmOpen(false)}
                className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsUpgradeConfirmOpen(false);
                  setIsPaymentModalOpen(true);
                }}
                className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;