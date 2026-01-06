import React, { useState, useEffect, useRef } from 'react';
import {
  Heart,
  Moon,
  Droplets,
  ArrowUpRight,
  Zap,
  Clock,
  ChevronRight,
  Sparkles,
  Dumbbell,
  Apple,
  Activity,
  Brain,
  Pill,
  Check,
  Camera,
  Video,
  Play,
  Loader2,
  Wind,
  X,
  Lock,
  Sun,
  Moon as MoonIcon,
  Image as ImageIcon,
  AlertCircle,
  RefreshCw,
  Bell,
  BellOff,
  Smile,
  Meh,
  Frown,
  ChevronDown,
  Info,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';
import { AreaChart, Area, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { HealthMetric, ChartDataPoint, Appointment, HealthTip, Medication, Notification } from '../types';
import { generateHealthInsights, generateVideoForTip, generateHealthImage } from '../services/geminiService';
import { HydrationDashboardModal } from './HydrationDashboardModal';
import { MindfulMovementModal } from './MindfulMovementModal';
import { StressManagementModal } from './StressManagementModal';

interface DashboardProps {
  userName: string;
  userImage?: string;
  metrics: HealthMetric[];
  appointments: Appointment[];
  notifications?: Notification[]; // New Prop
  onMarkNotificationRead?: (id: string) => void; // New Prop
  onLogVitals: () => void;
  isPremium: boolean;
  onUpgrade: () => void;
  isDarkMode?: boolean;
  toggleTheme?: () => void;
  isAdmin?: boolean;
}

const heartRateData: ChartDataPoint[] = [
  { day: 'Mon', value: 72 },
  { day: 'Tue', value: 68 },
  { day: 'Wed', value: 75 },
  { day: 'Thu', value: 71 },
  { day: 'Fri', value: 65 },
  { day: 'Sat', value: 82 },
  { day: 'Sun', value: 78 },
];

const initialHealthTips: HealthTip[] = [
  {
    id: 1,
    title: "The Science of Sleep",
    description: "Quality sleep is essential for physical repair and cognitive function.",
    category: "Wellness",
    readTime: "3 min",
    image: "https://picsum.photos/seed/sleep1/400/300"
  },
  {
    id: 2,
    title: "Hydration Habits",
    description: "Staying hydrated boosts energy levels and aids in digestion.",
    category: "Lifestyle",
    readTime: "2 min",
    image: "https://picsum.photos/seed/water1/400/300"
  },
  {
    id: 3,
    title: "Mindful Movement",
    description: "Incorporating gentle exercises like yoga can reduce stress significantly.",
    category: "Fitness",
    readTime: "5 min",
    image: "https://picsum.photos/seed/yoga1/400/300"
  },
  {
    id: 4,
    title: "Stress Management",
    description: "Effective techniques to manage daily stress for a balanced life.",
    category: "Mental",
    readTime: "4 min",
    image: "https://picsum.photos/seed/calm1/400/300"
  }
];

const Dashboard: React.FC<DashboardProps> = ({ userName, userImage, metrics, appointments, notifications = [], onMarkNotificationRead, onLogVitals, isPremium, onUpgrade, isDarkMode, toggleTheme, isAdmin }) => {
  const [aiInsights, setAiInsights] = useState<HealthTip[]>([]);
  const [isLoadingInsights, setIsLoadingInsights] = useState(true);
  const [displayTips, setDisplayTips] = useState<HealthTip[]>(initialHealthTips);
  const [isBreathingActive, setIsBreathingActive] = useState(false);
  const [isHydrationModalOpen, setIsHydrationModalOpen] = useState(false);
  const [isMindfulMovementModalOpen, setIsMindfulMovementModalOpen] = useState(false);
  const [isStressModalOpen, setIsStressModalOpen] = useState(false);

  // Notification State
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [activeNotification, setActiveNotification] = useState<Notification | null>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  // View State for expansion
  const [showAllAppointments, setShowAllAppointments] = useState(false);
  const [showAllInsights, setShowAllInsights] = useState(false);

  const [medications, setMedications] = useState<Medication[]>([
    { id: '1', name: 'Vitamin D', dosage: '1000 IU', frequency: 'Daily', isTaken: true, reminderEnabled: true },
    { id: '2', name: 'Amoxicillin', dosage: '500 mg', frequency: 'Every 8 hours', isTaken: false, reminderEnabled: true },
    { id: '3', name: 'Omega-3', dosage: '1000 mg', frequency: 'With meals', isTaken: false, reminderEnabled: false },
  ]);

  // Heart Rate Simulation State
  const [isDetectingHeartRate, setIsDetectingHeartRate] = useState(false);
  const [liveHeartRate, setLiveHeartRate] = useState<string | number>('--');

  // Real-time Health Score State
  const [healthScore, setHealthScore] = useState<number>(76);
  const [healthStatus, setHealthStatus] = useState<string>('Excellent');

  // Media Generation State
  const [generatingMediaId, setGeneratingMediaId] = useState<number | string | null>(null);
  const [selectedTipForResolution, setSelectedTipForResolution] = useState<number | string | null>(null);
  // Error state mapping: tipId -> errorMessage
  const [generationErrors, setGenerationErrors] = useState<Record<string | number, string>>({});

  // Mood Tracker State
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  // Current Time for Live Updates (e.g. Appointment Button)
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Update time every minute to check appointment status
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Sync initial value from props
    const hr = metrics.find(m => m.label === 'Heart Rate');
    if (hr) setLiveHeartRate(hr.value);
  }, [metrics]);

  // Real-time Health Score Algorithm
  useEffect(() => {
    // Determine numerical heart rate
    let currentHR = 72; // Default fallback
    if (liveHeartRate !== '--') {
      currentHR = typeof liveHeartRate === 'number' ? liveHeartRate : parseInt(liveHeartRate as string) || 72;
    }

    // Algorithm:
    // Ideal resting range: 60-80. 
    // Score starts at 100 and degrades as we move away from ideal range.
    // Includes random micro-fluctuation for "live" feel if scanning.

    let baseScore = 0;
    let label = 'Fair';

    if (currentHR >= 60 && currentHR <= 80) {
      // Excellent Range
      const diff = Math.abs(currentHR - 70); // Deviation from perfect 70
      baseScore = 98 - (diff * 0.5);
      label = 'Excellent';
    } else if ((currentHR > 80 && currentHR <= 90) || (currentHR >= 50 && currentHR < 60)) {
      // Good Range
      const diff = Math.abs(currentHR - 70);
      baseScore = 90 - (diff * 0.8);
      label = 'Good';
    } else if ((currentHR > 90 && currentHR <= 100)) {
      // Average Range
      baseScore = 80 - ((currentHR - 90) * 1.5);
      label = 'Fair';
    } else {
      // Needs Attention (High stress or too low)
      baseScore = 70 - (Math.abs(currentHR - 70) * 0.5);
      label = 'Attention';
    }

    // Clamp score 0-100
    baseScore = Math.max(0, Math.min(100, Math.round(baseScore)));

    setHealthScore(baseScore);
    setHealthStatus(label);

  }, [liveHeartRate]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isDetectingHeartRate) {
      interval = setInterval(() => {
        setLiveHeartRate(prev => {
          const current = typeof prev === 'number' ? prev : parseInt(prev.toString()) || 75;
          const fluctuation = Math.floor(Math.random() * 7) - 3;
          return Math.max(60, Math.min(180, current + fluctuation));
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isDetectingHeartRate]);

  useEffect(() => {
    const loadInsights = async () => {
      setIsLoadingInsights(true);
      // Pass current mood if already selected (rare on first load, but good practice)
      const tips = await generateHealthInsights(metrics, selectedMood);
      setAiInsights(tips);
      setIsLoadingInsights(false);
    };
    if (isPremium && metrics && metrics.length > 0) {
      loadInsights();
    } else {
      setTimeout(() => setIsLoadingInsights(false), 500);
    }
  }, [metrics, isPremium]);

  const handleMoodSelect = async (mood: string) => {
    setSelectedMood(mood);
    // If user is premium, trigger immediate analysis based on new mood
    if (isPremium) {
      setIsLoadingInsights(true);
      const tips = await generateHealthInsights(metrics, mood);
      setAiInsights(tips);
      setIsLoadingInsights(false);
    }
  };

  const handleToggleMedication = (id: string) => {
    setMedications(prev => prev.map(med =>
      med.id === id ? { ...med, isTaken: !med.isTaken } : med
    ));
  };

  const handleToggleReminder = (id: string) => {
    setMedications(prev => prev.map(med =>
      med.id === id ? { ...med, reminderEnabled: !med.reminderEnabled } : med
    ));
  };

  // Helper to ensure API Key (Used for both Video and Image generation with Pro models)
  const ensureApiKey = async (): Promise<boolean> => {
    const win = window as any;
    if (win.aistudio) {
      const hasKey = await win.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        try {
          await win.aistudio.openSelectKey();
          return await win.aistudio.hasSelectedApiKey();
        } catch (e) {
          console.error("Key selection failed/cancelled", e);
          return false;
        }
      }
      return true;
    }
    return true;
  };

  const clearError = (tipId: string | number) => {
    setGenerationErrors(prev => {
      const newState = { ...prev };
      delete newState[tipId];
      return newState;
    });
  };

  const getFriendlyErrorMessage = (error: any): string => {
    // Attempt to parse if error string is JSON
    let errStr = String(error);
    if (error && typeof error === 'object' && error.message) {
      errStr = error.message;
    }

    try {
      // Sometimes the error object toString() is just the message, but if it's the full JSON string
      if (errStr.startsWith('Error: ')) {
        errStr = errStr.substring(7);
      }

      // Check if it looks like JSON
      if (errStr.startsWith('{')) {
        const parsed = JSON.parse(errStr);
        if (parsed.error && parsed.error.message) {
          // Use the inner message for checks
          errStr = parsed.error.message;
        }
      }
    } catch (e) {
      // Fallback to raw string if parse fails
    }

    if (errStr.includes("404") || errStr.includes("NOT_FOUND") || errStr.includes("Requested entity was not found")) {
      return "Access denied. Please select a valid paid Google Cloud Project.";
    }
    if (errStr.includes("429") || errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("quota")) {
      return "Daily quota exceeded. Please try again later or check billing.";
    }
    if (errStr.includes("500") || errStr.includes("INTERNAL")) {
      return "AI Service is temporarily unavailable. Please retry.";
    }
    if (errStr.includes("503") || errStr.includes("UNAVAILABLE")) {
      return "Model is currently overloaded. Please retry in a moment.";
    }

    // Truncate very long error messages
    return errStr.length > 100 ? "Generation failed. Please check your connection." : errStr;
  };

  const handleGenerateVideo = async (tip: HealthTip) => {
    if (!isPremium) {
      onUpgrade();
      return;
    }

    // Specific override for "The Science of Sleep" to use HeyGen
    if (tip.title === "The Science of Sleep") {
      setDisplayTips(prev => prev.map(t =>
        t.id === tip.id ? { ...t, videoUrl: "https://app.heygen.com/embedded-player/93a911f12c0245208fdcd5bbead4253d" } : t
      ));
      return;
    }

    if (generatingMediaId || !tip.id) return;

    clearError(tip.id);
    setGeneratingMediaId(tip.id);

    try {
      const hasValidKey = await ensureApiKey();
      if (!hasValidKey) {
        setGenerationErrors(prev => ({ ...prev, [tip.id!]: "API Key selection cancelled." }));
        setGeneratingMediaId(null);
        return;
      }

      const videoUri = await generateVideoForTip(tip);

      if (videoUri) {
        setDisplayTips(prev => prev.map(t =>
          t.id === tip.id ? { ...t, videoUrl: videoUri } : t
        ));
      } else {
        throw new Error("Video generation returned no result.");
      }
    } catch (error: any) {
      // If it's a 404, we might want to prompt key selection one more time
      if (String(error).includes("404") || String(error).includes("NOT_FOUND")) {
        try {
          const win = window as any;
          if (win.aistudio) {
            await win.aistudio.openSelectKey();
            // Do not retry immediately to avoid infinite loops, let user click retry
            setGenerationErrors(prev => ({ ...prev, [tip.id!]: "Key updated. Please click Retry." }));
          } else {
            setGenerationErrors(prev => ({ ...prev, [tip.id!]: getFriendlyErrorMessage(error) }));
          }
        } catch {
          setGenerationErrors(prev => ({ ...prev, [tip.id!]: getFriendlyErrorMessage(error) }));
        }
      } else {
        setGenerationErrors(prev => ({ ...prev, [tip.id!]: getFriendlyErrorMessage(error) }));
      }
    } finally {
      setGeneratingMediaId(null);
    }
  };

  const handleGenerateImage = async (tip: HealthTip, size: '1K' | '2K' | '4K') => {
    setSelectedTipForResolution(null); // Close modal

    if (generatingMediaId || !tip.id) return;

    clearError(tip.id);
    setGeneratingMediaId(tip.id);

    try {
      const hasValidKey = await ensureApiKey();
      if (!hasValidKey) {
        setGenerationErrors(prev => ({ ...prev, [tip.id!]: "API Key selection cancelled." }));
        setGeneratingMediaId(null);
        return;
      }

      const imageUrl = await generateHealthImage(tip, size);

      if (imageUrl) {
        setDisplayTips(prev => prev.map(t =>
          t.id === tip.id ? { ...t, image: imageUrl } : t
        ));
      } else {
        throw new Error("Image generation returned no result.");
      }
    } catch (error: any) {
      setGenerationErrors(prev => ({ ...prev, [tip.id!]: getFriendlyErrorMessage(error) }));
    } finally {
      setGeneratingMediaId(null);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Fitness': return <Dumbbell size={18} className="text-blue-500" />;
      case 'Nutrition': return <Apple size={18} className="text-green-500" />;
      case 'Medical': return <Activity size={18} className="text-rose-500" />;
      case 'Mental': return <Brain size={18} className="text-purple-500" />;
      default: return <Sparkles size={18} className="text-teal-500" />;
    }
  };

  const renderTipAction = (tip: HealthTip) => {
    if (tip.title === 'Hydration Habits') {
      return (
        <button
          onClick={(e) => { e.stopPropagation(); onLogVitals(); }}
          className="mt-3 w-full py-2 bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 transition-colors"
        >
          <Droplets size={14} />
          Log Water
        </button>
      );
    }
    if (tip.title === 'Mindful Movement' || tip.category === 'Mental') {
      return (
        <button
          onClick={(e) => { e.stopPropagation(); setIsBreathingActive(true); }}
          className="mt-3 w-full py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
        >
          <Wind size={14} />
          Start Breathing
        </button>
      );
    }
    return null;
  };

  // Enhanced Circular Gauge
  const CircularGauge = ({ value }: { value: number }) => {
    const radius = 68; // Slightly larger
    const stroke = 10;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (value / 100) * circumference;

    return (
      <div className="relative flex items-center justify-center w-48 h-48 group">
        {/* Glowing Background Effect */}
        <div className="absolute inset-0 bg-teal-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-40 transition-opacity duration-700"></div>

        <svg height={radius * 2} width={radius * 2} className="transform -rotate-90 relative z-10">
          {/* Track */}
          <circle
            stroke="rgba(255,255,255,0.1)"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* Progress */}
          <circle
            stroke="url(#gradientScore)"
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset, transition: 'stroke-dashoffset 1.5s ease-out' }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className="filter drop-shadow-[0_0_8px_rgba(45,212,191,0.5)]"
          />
          <defs>
            <linearGradient id="gradientScore" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2dd4bf" /> {/* teal-400 */}
              <stop offset="100%" stopColor="#3b82f6" /> {/* blue-500 */}
            </linearGradient>
          </defs>
        </svg>

        {/* Inner Content */}
        <div className="absolute flex flex-col items-center justify-center">
          <div className="flex items-start">
            <span className="text-5xl font-bold text-white tracking-tighter drop-shadow-md">{value}</span>
            <span className="text-sm font-bold text-teal-400 mt-1">%</span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-[0.2em] mt-1">Health IQ</span>
        </div>
      </div>
    );
  };

  // Get appointments to display
  const displayAppointments = showAllAppointments ? appointments : appointments.slice(0, 1);
  const unreadNotifications = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6 pb-24 animate-fade-in relative">
      <HydrationDashboardModal
        isOpen={isHydrationModalOpen}
        onClose={() => setIsHydrationModalOpen(false)}
      />

      <MindfulMovementModal
        isOpen={isMindfulMovementModalOpen}
        onClose={() => setIsMindfulMovementModalOpen(false)}
      />

      <StressManagementModal
        isOpen={isStressModalOpen}
        onClose={() => setIsStressModalOpen(false)}
      />

      {/* Breathing Exercise Overlay */}
      {isBreathingActive && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/95 backdrop-blur-sm animate-fade-in">
          <style>{`
              @keyframes breathe {
                0%, 100% { transform: scale(1); opacity: 0.8; }
                50% { transform: scale(1.3); opacity: 1; }
              }
              .animate-breathe {
                animation: breathe 4s infinite ease-in-out;
              }
            `}</style>
          <button
            onClick={() => setIsBreathingActive(false)}
            className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors"
          >
            <X size={32} />
          </button>

          <div className="text-center">
            <h2 className="text-white text-3xl font-bold mb-12">Breathe In... Breathe Out</h2>
            <div className="w-64 h-64 mx-auto bg-gradient-to-br from-teal-400 to-emerald-600 rounded-full shadow-[0_0_100px_rgba(45,212,191,0.3)] flex items-center justify-center animate-breathe relative">
              <div className="absolute inset-0 bg-white/20 rounded-full animate-ping opacity-20" style={{ animationDuration: '4s' }}></div>
              <Wind className="text-white w-24 h-24 opacity-80" />
            </div>
            <p className="text-slate-400 mt-12 text-lg max-w-xs mx-auto">
              Focus on your breath. Inhale as the circle expands, exhale as it contracts.
            </p>
          </div>
        </div>
      )}

      {/* Header Section with User Greeting and Notification Bar */}
      <div className="flex justify-between items-center relative">
        <div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Hello, {userName} 👋</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Notification Bell - Hidden for Admins */}
          {!isAdmin && (
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2.5 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-sm border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all relative"
              >
                <Bell size={20} />
                {unreadNotifications > 0 && (
                  <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-white dark:border-slate-800 rounded-full animate-pulse"></span>
                )}
              </button>

              {/* Notification Dropdown Panel */}
              {isNotificationsOpen && (
                <div className="absolute -right-[88px] top-14 w-[24rem] bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 z-50 animate-fade-in overflow-hidden">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                    <h3 className="font-bold text-slate-800 dark:text-white text-sm">Notifications</h3>
                    <span className="text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-100 dark:border-slate-700">{unreadNotifications} New</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length > 0 ? notifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => {
                          if (onMarkNotificationRead) onMarkNotificationRead(notification.id);
                          setActiveNotification(notification);
                          setIsNotificationsOpen(false);
                        }}
                        className={`p-4 border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer flex gap-3 ${!notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                      >
                        <div className={`mt-1 p-1.5 rounded-full flex-shrink-0 h-fit ${notification.type === 'alert' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                          notification.type === 'success' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                            'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                          }`}>
                          {notification.type === 'alert' && <AlertTriangle size={14} />}
                          {notification.type === 'success' && <CheckCircle size={14} />}
                          {notification.type === 'info' && <Info size={14} />}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className={`text-sm font-bold ${!notification.read ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>{notification.title}</h4>
                            {!notification.read && <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5"></div>}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-2 line-clamp-2">{notification.message}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{notification.time}</p>
                        </div>
                      </div>
                    )) : (
                      <div className="p-8 text-center text-slate-400 text-sm">
                        <BellOff size={24} className="mx-auto mb-2 opacity-50" />
                        No notifications yet.
                      </div>
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 text-center border-t border-slate-100 dark:border-slate-800">
                      <button className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline">Mark all as read</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {toggleTheme && (
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-sm border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
            >
              {isDarkMode ? <Sun size={20} /> : <MoonIcon size={20} />}
            </button>
          )}
          <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden border-2 border-white dark:border-slate-800 shadow-sm">
            <img
              src={userImage || "https://picsum.photos/200/200"}
              alt="Profile"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Mood Tracker Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm">
        <h3 className="font-bold text-slate-800 dark:text-white mb-4">How do you feel today?</h3>
        <div className="flex justify-between gap-2">
          {['Terrible', 'Bad', 'Okay', 'Good', 'Great'].map((mood, idx) => (
            <button
              key={mood}
              onClick={() => handleMoodSelect(mood)}
              className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all w-full ${selectedMood === mood
                ? 'bg-teal-50 dark:bg-teal-900/30 ring-2 ring-teal-500 scale-105 shadow-md shadow-teal-500/20'
                : 'hover:bg-slate-50 dark:hover:bg-slate-800 grayscale hover:grayscale-0 opacity-70 hover:opacity-100'
                }`}
            >
              <div className="text-2xl transform transition-transform duration-300">
                {idx === 0 && '😣'}
                {idx === 1 && '😔'}
                {idx === 2 && '😐'}
                {idx === 3 && '🙂'}
                {idx === 4 && '😁'}
              </div>
              <span className={`text-[10px] font-bold ${selectedMood === mood ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400'}`}>{mood}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Health Card with Circular Gauge */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-[32px] p-6 text-white shadow-2xl relative overflow-hidden group border border-slate-700/50">

        {/* Animated Background Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-teal-500/20 transition-all duration-1000"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl -ml-12 -mb-12 group-hover:bg-blue-500/20 transition-all duration-1000"></div>

        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>

        <div className="relative z-10 flex items-center justify-between gap-6">
          <div className="flex-1 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></div>
                <p className="text-teal-400 text-xs font-bold uppercase tracking-wider">Real-time Analysis</p>
              </div>
              <h3 className="text-2xl font-bold text-white leading-tight">Your Health <br />Score</h3>
            </div>

            <div className="flex flex-col gap-2">
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-3 border border-white/10 flex items-center gap-3 transition-transform hover:scale-102">
                <div className={`p-2 rounded-lg ${healthStatus === 'Excellent' || healthStatus === 'Good' ? 'bg-emerald-500/20 text-emerald-400' :
                  healthStatus === 'Fair' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                  {healthStatus === 'Excellent' || healthStatus === 'Good' ? <Sparkles size={18} /> : <Activity size={18} />}
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Status</p>
                  <p className={`text-sm font-bold ${healthStatus === 'Excellent' || healthStatus === 'Good' ? 'text-emerald-400' :
                    healthStatus === 'Fair' ? 'text-yellow-400' : 'text-red-400'
                    }`}>{healthStatus}</p>
                </div>
              </div>

              <p className="text-slate-400 text-xs leading-relaxed max-w-[180px]">
                {healthStatus === 'Excellent' ? 'Vital signs are optimal. Keep up the great work!' :
                  healthStatus === 'Good' ? 'Your vitals are stable and within normal ranges.' :
                    healthStatus === 'Fair' ? 'Slight variations detected. Monitor closely.' : 'Attention needed on recent vital readings.'}
              </p>
            </div>
          </div>

          <div className="relative">
            <CircularGauge value={healthScore} />
          </div>
        </div>
      </div>

      {/* Quick Metrics Grid with Mini Charts */}
      <div className="grid grid-cols-2 gap-4">
        {metrics.map((metric, idx) => {
          const isHeartRate = metric.label === 'Heart Rate';
          return (
            <div key={idx} className={`p-4 rounded-3xl ${idx === 0 ? 'col-span-2' : 'col-span-1'} bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between hover:shadow-md transition-all duration-300 overflow-hidden relative`}>
              <div className="flex justify-between items-start mb-2 relative z-10">
                <div className={`p-2 rounded-xl ${metric.color} bg-opacity-20`}>
                  {metric.icon === 'heart' && <Heart size={20} className={metric.color.split(' ')[1]} />}
                  {metric.icon === 'moon' && <Moon size={20} className={metric.color.split(' ')[1]} />}
                  {metric.icon === 'water' && <Droplets size={20} className={metric.color.split(' ')[1]} />}
                </div>

                {isHeartRate && (
                  <button
                    onClick={() => setIsDetectingHeartRate(!isDetectingHeartRate)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${isDetectingHeartRate
                      ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30'
                      : 'bg-rose-50 text-rose-500 hover:bg-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:hover:bg-rose-900/40'
                      }`}
                  >
                    {isDetectingHeartRate ? 'Live' : 'Detect'}
                  </button>
                )}
              </div>

              <div className="relative z-10">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-slate-800 dark:text-white">
                    {isHeartRate ? liveHeartRate : metric.value}
                  </span>
                  <span className="text-sm text-slate-400">{metric.unit}</span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">{metric.label}</p>
              </div>

              {/* Mini Chart for Heart Rate */}
              {isHeartRate && (
                <div className="absolute bottom-0 left-0 right-0 h-16 opacity-30">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={heartRateData}>
                      <defs>
                        <linearGradient id="colorHeartMini" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="value" stroke="#f43f5e" strokeWidth={3} fill="url(#colorHeartMini)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* AI Health Analysis Section */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-3xl p-0.5 shadow-xl shadow-indigo-500/10 relative overflow-hidden">

        {/* Premium Gate Overlay */}
        {!isPremium && (
          <div className="absolute inset-0 z-20 bg-white/10 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
            <div className="bg-white/20 p-3 rounded-full mb-3">
              <Lock className="text-white" size={24} />
            </div>
            <h3 className="text-white font-bold text-xl mb-1">Advanced AI Analysis</h3>
            <p className="text-indigo-100 text-sm mb-4 max-w-xs">Unlock personalized health insights driven by Gemini.</p>
            <button
              onClick={onUpgrade}
              className="bg-white text-indigo-600 py-2.5 px-6 rounded-xl font-bold shadow-lg shadow-black/10 hover:bg-indigo-50 transition-colors"
            >
              Unlock Premium
            </button>
          </div>
        )}

        <div className="bg-white dark:bg-slate-900 rounded-[22px] p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-xl">
              <Sparkles className="text-indigo-600 dark:text-indigo-400" size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white leading-tight">AI Health Analysis</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Personalized insights based on your metrics {selectedMood && `& mood`}</p>
            </div>
          </div>

          {isLoadingInsights ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex-shrink-0"></div>
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-1/3"></div>
                    <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-full"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {aiInsights.length > 0 ? aiInsights.map((tip, idx) => (
                <div key={idx} className="flex gap-3 items-start animate-fade-in" style={{ animationDelay: `${idx * 100}ms` }}>
                  <div className={`p-2.5 rounded-xl flex-shrink-0 ${tip.category === 'Nutrition' ? 'bg-emerald-50 dark:bg-emerald-900/20' :
                    tip.category === 'Fitness' ? 'bg-blue-50 dark:bg-blue-900/20' :
                      tip.category === 'Medical' ? 'bg-rose-50 dark:bg-rose-900/20' :
                        tip.category === 'Mental' ? 'bg-purple-50 dark:bg-purple-900/20' : 'bg-teal-50 dark:bg-teal-900/20'
                    }`}>
                    {getCategoryIcon(tip.category)}
                  </div>
                  <div className="pt-0.5">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-0.5">{tip.title}</h4>
                    <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">{tip.description}</p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-4 text-slate-400 text-sm">
                  No insights available. Log more data to get started.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Medications Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-rose-50 dark:bg-rose-900/20 p-2 rounded-xl">
              <Pill className="text-rose-500 dark:text-rose-400" size={20} />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-white">Medications</h3>
          </div>
        </div>

        <div className="space-y-3">
          {medications.map((med) => (
            <div key={med.id} className={`flex items-center justify-between p-3 rounded-2xl transition-all ${med.isTaken ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30' : 'bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700'}`}>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleToggleMedication(med.id)}
                  className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${med.isTaken
                    ? 'bg-emerald-500 border-emerald-500 shadow-sm shadow-emerald-500/20'
                    : 'border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 hover:border-emerald-400'
                    }`}
                >
                  {med.isTaken && <Check size={14} className="text-white" strokeWidth={3} />}
                </button>
                <div>
                  <p className={`font-bold text-sm text-slate-800 dark:text-slate-200 transition-all ${med.isTaken ? 'line-through text-slate-400' : ''}`}>
                    {med.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {med.dosage} • {med.frequency}
                  </p>
                </div>
              </div>

              {/* Reminder Toggle Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleReminder(med.id);
                }}
                className={`p-2.5 rounded-xl transition-all duration-200 ${med.reminderEnabled
                  ? 'text-teal-600 dark:text-teal-400 bg-teal-100/50 dark:bg-teal-900/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                title={med.reminderEnabled ? "Turn off reminder" : "Turn on reminder"}
              >
                {med.reminderEnabled ? <Bell size={18} className="fill-current" /> : <BellOff size={18} />}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Appointment */}
      <div className="bg-teal-50 dark:bg-teal-900/10 rounded-3xl p-5 border border-teal-100 dark:border-teal-900/30">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-800 dark:text-white">{showAllAppointments ? 'All Appointments' : 'Next Appointment'}</h3>
          <button
            onClick={() => setShowAllAppointments(!showAllAppointments)}
            className="text-teal-600 dark:text-teal-400 text-sm font-semibold hover:text-teal-700 dark:hover:text-teal-300 transition-colors flex items-center gap-1"
          >
            {showAllAppointments ? 'Show Less' : 'See All'}
            {showAllAppointments && <ChevronDown size={14} />}
          </button>
        </div>

        <div className={`space-y-3 ${showAllAppointments ? 'flex flex-col' : ''}`}>
          {(displayAppointments).map((apt) => {
            // Robust check for "Today"
            const todayObj = new Date();
            const todayStr = todayObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            const isToday = apt.date === 'Today' || apt.date === todayStr;

            let showJoinButton = false;

            // Check logic for button visibility:
            // 1. Has Meeting Link
            // 2. Status is NOT cancelled or completed
            // 3. Either it is TODAY or it is PENDING (so admin/patient see it immediately)
            if (apt.meetLink && apt.status !== 'cancelled' && apt.status !== 'completed') {
              if (isToday) {
                // Use the live updated currentTime
                const now = currentTime;
                const [h, m] = apt.time.split(':').map(Number);
                const aptTime = new Date();
                aptTime.setHours(h, m, 0, 0);

                const diff = (aptTime.getTime() - now.getTime()) / 60000;

                // Show if within 60 mins before or after
                if (diff <= 60 && diff > -60) {
                  showJoinButton = true;
                }
              } else if (apt.status === 'pending') {
                // For pending appointments with a link (e.g. initial demo ones), show the link
                showJoinButton = true;
              }
            }

            return (
              <div key={apt.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm animate-fade-in relative overflow-hidden transition-all hover:shadow-md">
                <div className="flex items-center gap-4 relative z-10">
                  <img src={apt.imageUrl} alt={apt.doctorName} className="w-12 h-12 rounded-full object-cover border border-slate-100 dark:border-slate-700" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="font-bold text-slate-800 dark:text-white text-sm">{apt.doctorName}</h4>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-[0.05em] ${apt.status === 'upcoming' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        apt.status === 'pending' ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' :
                          'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                        {apt.status === 'upcoming' ? 'Confirmed' : apt.status}
                      </span>
                    </div>
                    <p className="text-teal-600 dark:text-teal-400 text-xs font-medium">{apt.specialty}</p>
                  </div>
                  <div className={`p-2 rounded-xl text-center min-w-[60px] ${showJoinButton ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-slate-50 dark:bg-slate-700'}`}>
                    <p className={`text-xs ${showJoinButton ? 'text-blue-500 font-bold' : 'text-slate-400 dark:text-slate-300'}`}>{apt.date}</p>
                    <p className={`text-sm font-bold ${showJoinButton ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-white'}`}>{apt.time}</p>
                  </div>
                </div>

                {/* Join Call Action Button - Only when near time and active */}
                {showJoinButton && (
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end animate-fade-in">
                    <a
                      href={apt.meetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-500/20 hover:scale-105"
                    >
                      <Video size={18} />
                      Join Google Meet
                    </a>
                  </div>
                )}
              </div>
            )
          })}
          {displayAppointments.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-sm italic bg-white dark:bg-slate-800 rounded-2xl">No upcoming appointments.</div>
          )}
        </div>
      </div>

      {/* Daily Insights - Health Tips Carousel */}
      <div className="pt-2">
        <div className="flex justify-between items-center mb-4 px-1">
          <h3 className="font-bold text-slate-800 dark:text-white">Daily Insights</h3>
          <button
            onClick={() => setShowAllInsights(!showAllInsights)}
            className="text-teal-600 dark:text-teal-400 text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all"
          >
            {showAllInsights ? 'Show Less' : 'View All'}
            {showAllInsights ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>

        <div className={showAllInsights
          ? "flex flex-col gap-4 pb-6 px-1 animate-fade-in"
          : "flex gap-4 overflow-x-auto pb-6 -mx-4 px-4 no-scrollbar snap-x cursor-grab active:cursor-grabbing"
        }>
          {displayTips.map((tip) => (
            <div
              key={tip.id}
              className={`${showAllInsights ? 'w-full' : 'min-w-[220px]'} bg-white dark:bg-slate-900 p-3 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 snap-center hover:shadow-md transition-shadow`}
            >
              <div
                className="h-28 w-full rounded-xl overflow-hidden mb-3 relative bg-slate-100 dark:bg-slate-800 group cursor-pointer"
                onClick={() => {
                  if (tip.title === 'Hydration Habits') setIsHydrationModalOpen(true);
                  if (tip.title === 'Mindful Movement') setIsMindfulMovementModalOpen(true);
                  if (tip.title === 'Stress Management') setIsStressModalOpen(true);
                }}
              >
                {/* Error Overlay */}
                {tip.id && generationErrors[tip.id] ? (
                  <div className="absolute inset-0 bg-slate-900/90 z-20 flex flex-col items-center justify-center p-4 text-center animate-fade-in">
                    <AlertCircle className="text-red-500 mb-2" size={24} />
                    <p className="text-white text-[10px] mb-3 leading-tight font-medium">{generationErrors[tip.id]}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); clearError(tip.id!); }}
                        className="text-slate-400 hover:text-white text-[10px] bg-slate-800 px-2 py-1 rounded"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleGenerateVideo(tip); }}
                        className="text-white bg-red-600 hover:bg-red-700 text-[10px] px-2 py-1 rounded flex items-center gap-1"
                      >
                        <RefreshCw size={10} /> Retry
                      </button>
                    </div>
                  </div>
                ) : tip.videoUrl ? (
                  tip.videoUrl.includes('heygen') ? (
                    <iframe
                      src={tip.videoUrl}
                      className="w-full h-full rounded-xl object-cover"
                      title={tip.title}
                      frameBorder="0"
                      allow="encrypted-media; fullscreen;"
                      allowFullScreen
                    ></iframe>
                  ) : (
                    <video
                      src={`${tip.videoUrl}&key=${process.env.API_KEY}`}
                      controls
                      className="w-full h-full object-cover"
                    />
                  )
                ) : (
                  <>
                    <img src={tip.image} alt={tip.title} className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500" />

                    {/* Media Generation Buttons Overlay */}
                    <div className={`absolute inset-0 transition-opacity flex items-center justify-center gap-2 ${isPremium ? 'bg-black/30 opacity-0 group-hover:opacity-100' : 'bg-black/10'}`}>
                      {/* Video Button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleGenerateVideo(tip); }}
                        disabled={generatingMediaId === tip.id}
                        className={`backdrop-blur-md p-2.5 rounded-full transition-all border ${isPremium
                          ? 'bg-white/20 hover:bg-white/40 border-white/50 text-white'
                          : 'bg-black/50 border-transparent text-white/90 hover:bg-black/70'
                          }`}
                        title="Generate Video"
                      >
                        {generatingMediaId === tip.id ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : !isPremium ? (
                          <Lock size={18} />
                        ) : (
                          <Video size={18} />
                        )}
                      </button>

                      {/* Image Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isPremium) { onUpgrade(); return; }
                          setSelectedTipForResolution(tip.id!);
                        }}
                        disabled={generatingMediaId === tip.id}
                        className={`backdrop-blur-md p-2.5 rounded-full transition-all border ${isPremium
                          ? 'bg-white/20 hover:bg-white/40 border-white/50 text-white'
                          : 'bg-black/50 border-transparent text-white/90 hover:bg-black/70'
                          }`}
                        title="Generate Image (Nano Banana Pro)"
                      >
                        {!isPremium ? (
                          <Lock size={18} />
                        ) : (
                          <ImageIcon size={18} />
                        )}
                      </button>
                    </div>

                    {/* Resolution Selector Overlay */}
                    {selectedTipForResolution === tip.id && (
                      <div className="absolute inset-0 z-20 bg-slate-900/90 flex flex-col items-center justify-center gap-2 p-2 animate-fade-in" onClick={(e) => e.stopPropagation()}>
                        <span className="text-white text-xs font-bold mb-1">Select Size</span>
                        <div className="flex gap-1.5 w-full justify-center">
                          {(['1K', '2K', '4K'] as const).map(size => (
                            <button
                              key={size}
                              onClick={() => handleGenerateImage(tip, size)}
                              className="bg-teal-600 text-white text-[10px] font-bold px-2 py-1.5 rounded-lg hover:bg-teal-500 transition-colors"
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => setSelectedTipForResolution(null)}
                          className="text-slate-400 text-[10px] mt-1 hover:text-white"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </>
                )}

                <div className="absolute top-2 left-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-bold text-slate-800 dark:text-slate-200 shadow-sm pointer-events-none">
                  {tip.category}
                </div>
              </div>
              <div className="flex justify-between items-start gap-2">
                <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-1 line-clamp-1 flex-1">{tip.title}</h4>
                {tip.videoUrl && <div className="text-[10px] bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300 px-1.5 py-0.5 rounded font-bold">VIDEO</div>}
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Clock size={12} />
                <span>{tip.readTime} read</span>
              </div>

              {renderTipAction(tip)}
            </div>
          ))}
        </div>
      </div>

      {/* Active Notification Modal */}
      {activeNotification && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setActiveNotification(null)}>
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
            <button onClick={() => setActiveNotification(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-800 rounded-full p-2 transition-colors">
              <X size={20} />
            </button>
            <div className="flex flex-col items-center text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-5 shadow-lg ${activeNotification.type === 'alert' ? 'bg-red-100 text-red-600 shadow-red-500/20' :
                activeNotification.type === 'success' ? 'bg-emerald-100 text-emerald-600 shadow-emerald-500/20' :
                  'bg-blue-100 text-blue-600 shadow-blue-500/20'
                }`}>
                {activeNotification.type === 'alert' && <AlertTriangle size={32} />}
                {activeNotification.type === 'success' && <CheckCircle size={32} />}
                {activeNotification.type === 'info' && <Info size={32} />}
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">{activeNotification.title}</h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed mb-6 px-4">{activeNotification.message}</p>

              <div className="w-full bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 mb-6">
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Received</p>
                <p className="text-slate-600 dark:text-slate-300 font-semibold">{activeNotification.time}</p>
              </div>

              <button
                onClick={() => setActiveNotification(null)}
                className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-3.5 rounded-2xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-lg"
              >
                Close Notification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;