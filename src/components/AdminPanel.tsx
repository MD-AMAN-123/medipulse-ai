import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Appointment } from '../types';
import { Calendar, Clock, User, CheckCircle, XCircle, Search, Filter, Shield, MoreHorizontal, Video, MapPin, Check, X, Phone, Link as LinkIcon, AlertCircle, Share2, Trash2 } from 'lucide-react';

interface AdminPanelProps {
  appointments: Appointment[];
  onUpdateStatus: (id: string, status: 'upcoming' | 'cancelled', meetLink?: string) => void;
  onDeleteAppointment: (id: string) => void;
}

// Helper to parse date strings like "Today", "Tomorrow", "Oct 28", "Thu, Oct 24" into a timestamp
const getAppointmentTimestamp = (dateStr: string, timeStr: string): number => {
  const now = new Date();
  let targetDate = new Date(now);

  const d = dateStr.trim().toLowerCase();

  if (d === 'today') {
    // Keep today's date
  } else if (d === 'tomorrow' || d === 'tmrrw') {
    targetDate.setDate(targetDate.getDate() + 1);
  } else if (d === 'yesterday') {
    targetDate.setDate(targetDate.getDate() - 1);
  } else {
    // Handle formats like "Oct 28" or "Thu, Oct 24"
    let cleanDateStr = dateStr;
    if (dateStr.includes(',')) {
      cleanDateStr = dateStr.split(',')[1].trim();
    }

    // Parse assuming current year
    const parsedTime = Date.parse(`${cleanDateStr} ${now.getFullYear()}`);
    if (!isNaN(parsedTime)) {
      targetDate = new Date(parsedTime);
    }
  }

  // Parse time (e.g., "14:30")
  const [hours, minutes] = timeStr.split(':').map(num => parseInt(num) || 0);
  targetDate.setHours(hours, minutes, 0, 0);

  return targetDate.getTime();
};

const AdminPanel: React.FC<AdminPanelProps> = ({ appointments, onUpdateStatus, onDeleteAppointment }) => {
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [editableLink, setEditableLink] = useState('');

  // Menu State
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is outside the entire table container
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sort appointments sequentially
  const sortedAppointments = useMemo(() => {
    return [...appointments].sort((a, b) => {
      const timeA = getAppointmentTimestamp(a.date, a.time);
      const timeB = getAppointmentTimestamp(b.date, b.time);
      return timeA - timeB; // Ascending order (Earliest first)
    });
  }, [appointments]);

  const handleAcceptClick = (apt: Appointment) => {
    // Only open modal for video appointments to edit the link
    if (apt.type === 'video') {
      setSelectedAppointment(apt);
      // Use existing link or generate a new random one
      setEditableLink(apt.meetLink || `https://meet.google.com/${Math.random().toString(36).substring(7)}-${Math.random().toString(36).substring(7)}-${Math.random().toString(36).substring(7)}`);
      setIsAcceptModalOpen(true);
    } else {
      // Direct accept for in-person appointments
      onUpdateStatus(apt.id, 'upcoming');
    }
  };

  const confirmAccept = () => {
    if (selectedAppointment) {
      onUpdateStatus(selectedAppointment.id, 'upcoming', editableLink);
      setIsAcceptModalOpen(false);
      setSelectedAppointment(null);
    }
  };

  const handleShare = (e: React.MouseEvent, apt: Appointment) => {
    e.stopPropagation();
    e.preventDefault();
    const shareText = `Medical Appointment Detail:\nPatient: ${apt.patientName || "Guest"}\nDoctor: ${apt.doctorName} (${apt.specialty})\nDate: ${apt.date} at ${apt.time}\nType: ${apt.type}\nStatus: ${apt.status}`;

    if (navigator.share) {
      navigator.share({
        title: 'Appointment Details',
        text: shareText,
      }).catch(err => console.log('Error sharing:', err));
    } else {
      navigator.clipboard.writeText(shareText);
      alert('Appointment details copied to clipboard!');
    }
    setActiveMenuId(null);
  };

  const handleDelete = (id: string) => {
    // Standard window.confirm is blocking, so we call it directly.
    if (window.confirm('Are you sure you want to delete this appointment record?')) {
      onDeleteAppointment(id);
      setActiveMenuId(null);
    }
  };

  const toggleMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  return (
    <div className="space-y-6 pb-24 animate-fade-in relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg">
              <Shield className="text-indigo-600 dark:text-indigo-400" size={20} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Admin Portal</h2>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Manage patient appointments and scheduling.</p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search patients..."
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
          <button className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400">
            <Filter size={18} />
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Total</p>
          <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{appointments.length}</h3>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Pending</p>
          <h3 className="text-3xl font-bold text-orange-500 dark:text-orange-400">
            {appointments.filter(a => a.status === 'pending').length}
          </h3>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Upcoming</p>
          <h3 className="text-3xl font-bold text-teal-600 dark:text-teal-400">
            {appointments.filter(a => a.status === 'upcoming').length}
          </h3>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Completed</p>
          <h3 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
            {appointments.filter(a => a.status === 'completed').length}
          </h3>
        </div>
      </div>

      {/* Appointment Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-visible min-h-[300px]" ref={menuRef}>
        <div className="overflow-x-auto pb-40"> {/* Added pb-40 to allow dropdown space within scrolling container if needed */}
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Patient Name</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contact</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Doctor & Specialty</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date & Time</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sortedAppointments.map((apt) => (
                <tr key={apt.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500">
                        <User size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-white text-sm">{apt.patientName || "Guest Patient"}</p>
                        <p className="text-xs text-slate-400">ID: #{apt.id.slice(-4)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <Phone size={14} className="text-slate-400" />
                      <span>{apt.patientMobile || "N/A"}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div>
                      <p className="font-medium text-slate-700 dark:text-slate-200 text-sm">{apt.doctorName}</p>
                      <p className="text-xs text-teal-600 dark:text-teal-400">{apt.specialty}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 text-sm">
                        <Calendar size={14} />
                        <span>{apt.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                        <Clock size={14} />
                        <span>{apt.time}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
                      {apt.type === 'video' ? <Video size={16} /> : <MapPin size={16} />}
                      <span className="capitalize">{apt.type}</span>
                    </div>
                    {apt.type === 'video' && apt.meetLink && (
                      <a href={apt.meetLink} target="_blank" rel="noreferrer" className="text-[10px] text-blue-500 hover:underline block mt-1">
                        Join Call
                      </a>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${apt.status === 'upcoming' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' :
                      apt.status === 'completed' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' :
                        apt.status === 'pending' ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400' :
                          'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                      {apt.status === 'upcoming' && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>}
                      {apt.status === 'pending' && <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></div>}
                      {apt.status}
                    </span>
                  </td>
                  {/* Applied z-index and position relative explicitly to the cell containing the dropdown */}
                  <td className="p-4 text-right" style={{ zIndex: activeMenuId === apt.id ? 50 : 'auto', position: activeMenuId === apt.id ? 'relative' : 'static' }}>
                    {apt.status === 'pending' ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleAcceptClick(apt)}
                          className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-lg transition-colors"
                          title="Accept"
                        >
                          <Check size={18} />
                        </button>
                        <button
                          onClick={() => onUpdateStatus(apt.id, 'cancelled')}
                          className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors"
                          title="Reject"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <div className="relative inline-block text-left">
                        <button
                          onClick={(e) => toggleMenu(e, apt.id)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                        >
                          <MoreHorizontal size={18} />
                        </button>

                        {/* Dropdown Menu */}
                        {activeMenuId === apt.id && (
                          <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 animate-fade-in overflow-hidden origin-top-right z-[100]">
                            <div className="py-1">
                              <button
                                onClick={(e) => handleShare(e, apt)}
                                className="flex w-full items-center gap-2 px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
                              >
                                <Share2 size={16} className="text-blue-500" />
                                <span>Share Details</span>
                              </button>
                              <div className="h-px bg-slate-100 dark:bg-slate-700 mx-2"></div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(apt.id);
                                }}
                                className="flex w-full items-center gap-2 px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
                              >
                                <Trash2 size={16} />
                                <span>Delete Record</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}

              {sortedAppointments.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No appointments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Accept Appointment Modal */}
      {isAcceptModalOpen && selectedAppointment && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 relative shadow-2xl">
            <button
              onClick={() => setIsAcceptModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4 text-emerald-600 dark:text-emerald-400">
                <CheckCircle size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">Accept Appointment</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                Verify details for <span className="font-bold text-slate-700 dark:text-slate-300">{selectedAppointment.patientName}</span>
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Google Meet Code</label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-3.5 text-slate-400" size={18} />
                  <input
                    type="text"
                    value={editableLink}
                    onChange={(e) => setEditableLink(e.target.value)}
                    placeholder="GIVE MEETING CODE"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800 dark:text-white"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1 ml-1 flex items-center gap-1">
                  <AlertCircle size={10} />
                  This link will be sent to the patient immediately.
                </p>
              </div>

              <button
                onClick={confirmAccept}
                className="w-full bg-emerald-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 transition-all"
              >
                Confirm & Notify Patient
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;