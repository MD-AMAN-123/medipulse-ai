import React, { useState, useEffect } from 'react';
import { ChevronLeft, MoreHorizontal, Star, Video, MapPin, Calendar, Check, Clock, ChevronRight, CheckCircle2, Loader2, ArrowRight, Edit2, Trash2, Plus, X, Image as ImageIcon } from 'lucide-react';
import { Appointment, Doctor } from '../types';

interface DateOption {
  id: number;
  dayLabel: string; // 'Today', 'Mon', etc.
  dateNum: string; // '24', '25'
  fullDate: string; // 'Thu, Oct 24'
  isoDate: string; // '2023-10-24'
}

interface AppointmentsProps {
  onBack: () => void;
  onBook: (appointment: Appointment) => void;
  doctors: Doctor[];
  isAdmin?: boolean;
  onAddDoctor?: (doctor: Doctor) => void;
  onUpdateDoctor?: (doctor: Doctor) => void;
  onDeleteDoctor?: (id: string | number) => void;
}

const Appointments: React.FC<AppointmentsProps> = ({
  onBack,
  onBook,
  doctors,
  isAdmin = false,
  onAddDoctor,
  onUpdateDoctor,
  onDeleteDoctor
}) => {
  const [selectedSpecialist, setSelectedSpecialist] = useState<Doctor | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [generatedSlots, setGeneratedSlots] = useState<string[]>([]);

  // Admin Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Partial<Doctor>>({});
  const [isNewDoctor, setIsNewDoctor] = useState(false);

  // Sync selected specialist when doctors list changes (e.g. deletion or initial load)
  useEffect(() => {
    if (doctors.length === 0) {
      setSelectedSpecialist(null);
    } else {
      // If no selection, or current selection is not in the list anymore
      const exists = selectedSpecialist && doctors.some(d => d.id === selectedSpecialist.id);
      if (!selectedSpecialist || !exists) {
        setSelectedSpecialist(doctors[0]);
      }
    }
  }, [doctors, selectedSpecialist]);

  // Generate next 14 days
  const [dates] = useState<DateOption[]>(() => {
    const arr: DateOption[] = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      arr.push({
        id: i,
        dayLabel: i === 0 ? 'Today' : i === 1 ? 'Tmrrw' : d.toLocaleDateString('en-US', { weekday: 'short' }),
        dateNum: d.toLocaleDateString('en-US', { day: 'numeric' }),
        fullDate: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        isoDate: d.toISOString().split('T')[0]
      });
    }
    return arr;
  });

  const [selectedDate, setSelectedDate] = useState<DateOption>(dates[0]);

  // Generate Slots based on selected specialist's availability
  useEffect(() => {
    if (selectedSpecialist) {
      const start = parseInt(selectedSpecialist.startTime?.split(':')[0] || "09");
      // Ensure default extends to 22 (10 PM) if not set or if parsing fails
      const endStr = selectedSpecialist.endTime?.split(':')[0];
      const end = endStr ? parseInt(endStr) : 22;

      const slots: string[] = [];

      for (let hour = start; hour < end; hour++) {
        slots.push(`${hour.toString().padStart(2, '0')}:00`);
        slots.push(`${hour.toString().padStart(2, '0')}:30`);
      }

      // Filter based on real-time if today
      let finalSlots = slots;

      // Check if selected date is today (id 0)
      if (selectedDate.id === 0) {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        finalSlots = slots.filter(slot => {
          const [h, m] = slot.split(':').map(Number);
          if (h > currentHour) return true;
          if (h === currentHour && m > currentMinute) return true;
          return false;
        });
      }

      setGeneratedSlots(finalSlots);

      // Auto-select first available if current selection is invalid
      if (finalSlots.length > 0) {
        if (!selectedSlot || !finalSlots.includes(selectedSlot)) {
          setSelectedSlot(finalSlots[0]);
        }
      } else {
        setSelectedSlot(null);
      }
    }
  }, [selectedSpecialist, selectedDate]);

  const handleConfirmBooking = () => {
    if (!selectedSpecialist || !selectedSlot) return;

    setIsBooking(true);

    // Simulate API call
    setTimeout(() => {
      const newAppointment: Appointment = {
        id: Date.now().toString(),
        doctorName: selectedSpecialist.name,
        specialty: selectedSpecialist.specialty,
        date: selectedDate.fullDate,
        time: selectedSlot,
        status: 'pending', // Set to pending for admin approval
        imageUrl: selectedSpecialist.image,
        type: 'video', // Defaulting to video for now
        location: 'Virtual Clinic'
      };

      onBook(newAppointment);
      setIsBooking(false);
      setShowSuccess(true);
    }, 1500);
  };

  const handleMoreOptions = () => {
    alert("More options menu would appear here.");
  };

  // --- Admin Functions ---

  const openEditModal = (doctor?: Doctor) => {
    if (doctor) {
      setEditingDoctor({ ...doctor });
      setIsNewDoctor(false);
    } else {
      setEditingDoctor({
        name: '',
        specialty: '',
        price: 100,
        rating: 4.8,
        match: 90,
        image: 'https://picsum.photos/200/300',
        startTime: '09:00',
        endTime: '22:00',
        about: ''
      });
      setIsNewDoctor(true);
    }
    setIsEditModalOpen(true);
  };

  const handleSaveDoctor = () => {
    if (isNewDoctor && onAddDoctor) {
      onAddDoctor({
        ...editingDoctor,
        id: Date.now(),
      } as Doctor);
    } else if (!isNewDoctor && onUpdateDoctor) {
      onUpdateDoctor(editingDoctor as Doctor);
    }
    setIsEditModalOpen(false);
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string | number) => {
    e.stopPropagation(); // Stop event bubbling to card selection
    if (window.confirm("Are you sure you want to delete this doctor?") && onDeleteDoctor) {
      onDeleteDoctor(id);
      // Selection update is handled by useEffect
    }
  };


  if (!selectedSpecialist && doctors.length === 0 && !isAdmin) {
    return <div className="p-8 text-center text-slate-500">No doctors available.</div>
  }

  return (
    <div className="pb-32 animate-fade-in font-['Plus_Jakarta_Sans'] relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-lg font-bold text-slate-800 dark:text-white">
          {isAdmin ? 'Manage Appointments' : 'New Appointment'}
        </h2>
        <button
          onClick={handleMoreOptions}
          className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Select Specialist Section */}
      <div className="mb-8">
        <div className="flex justify-between items-end mb-4 px-1">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">Select Specialist</h3>
          {isAdmin && (
            <span className="text-xs font-bold bg-indigo-100 text-indigo-600 px-2 py-1 rounded">ADMIN MODE</span>
          )}
        </div>

        <div className="flex gap-4 overflow-x-auto pb-6 -mx-4 px-4 no-scrollbar snap-x items-center">

          {/* Admin Add New Card */}
          {isAdmin && (
            <div
              onClick={() => openEditModal()}
              className="relative min-w-[260px] h-[320px] rounded-[32px] border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors snap-center"
            >
              <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400">
                <Plus size={32} />
              </div>
              <span className="font-bold text-slate-500">Add New Doctor</span>
            </div>
          )}

          {doctors.map((doctor) => {
            const isSelected = selectedSpecialist?.id === doctor.id;
            return (
              <div
                key={doctor.id}
                onClick={() => setSelectedSpecialist(doctor)}
                className={`relative min-w-[260px] h-[320px] rounded-[32px] overflow-hidden snap-center cursor-pointer transition-all duration-300 group ${isSelected ? 'ring-4 ring-blue-500/20 scale-[1.02]' : 'opacity-70 scale-95'}`}
              >
                <img src={doctor.image} alt={doctor.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent opacity-90"></div>

                {/* Admin Controls Overlay */}
                {isAdmin && (
                  <div className="absolute top-4 left-4 flex gap-2 z-20">
                    <button
                      onClick={(e) => { e.stopPropagation(); openEditModal(doctor); }}
                      className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={(e) => handleDeleteClick(e, doctor.id)}
                      className="p-2 bg-red-500/80 backdrop-blur-md rounded-full text-white hover:bg-red-600 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}

                {/* Match Badge */}
                <div className="absolute top-4 right-4 bg-emerald-500/90 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg shadow-emerald-500/20">
                  <Star size={10} fill="currentColor" />
                  {doctor.match}% Match
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h4 className="text-2xl font-bold text-white mb-1 leading-tight">{doctor.name}</h4>
                  <p className="text-slate-300 text-sm mb-4 font-medium">{doctor.specialty}</p>

                  <div className="flex gap-2">
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-3 py-1.5 flex items-center gap-1.5">
                      <Video size={12} className="text-white" />
                      <span className="text-[10px] text-white font-bold uppercase tracking-wider">Video</span>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-3 py-1.5 flex items-center gap-1.5">
                      <MapPin size={12} className="text-white" />
                      <span className="text-[10px] text-white font-bold uppercase tracking-wider">In-Person</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Availability Section */}
      {selectedSpecialist && (
        <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 shadow-sm border border-slate-100 dark:border-slate-800 animate-fade-in">
          {/* Drag Handle (Visual) */}
          <div className="w-12 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6"></div>

          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Availability</h3>
              {selectedSpecialist.startTime && (
                <p className="text-xs text-slate-400">Hours: {selectedSpecialist.startTime} - {selectedSpecialist.endTime || '22:00'}</p>
              )}
            </div>
            <div className="flex items-center gap-2 text-blue-500 bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 rounded-full text-xs font-bold">
              <span>{selectedDate.fullDate}</span>
              <Calendar size={12} />
            </div>
          </div>

          {/* Date Selector Strip */}
          <div className="flex gap-3 overflow-x-auto pb-6 no-scrollbar -mx-2 px-2">
            {dates.map((date) => {
              const isSelected = selectedDate.id === date.id;
              return (
                <button
                  key={date.id}
                  onClick={() => setSelectedDate(date)}
                  className={`flex-shrink-0 min-w-[72px] p-3 rounded-2xl border flex flex-col items-center gap-1 transition-all duration-200 ${isSelected
                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/25 scale-105'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-blue-300 dark:hover:border-blue-500'
                    }`}
                >
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'opacity-80' : 'opacity-60'}`}>
                    {date.dayLabel}
                  </span>
                  <span className="text-lg font-bold">{date.dateNum}</span>
                </button>
              );
            })}
          </div>

          <div className="mb-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6 ml-10">Available Slots</p>

            <div className="relative space-y-0">
              {/* Vertical Timeline Line */}
              <div className="absolute left-[18px] top-2 bottom-8 w-0.5 bg-slate-100 dark:bg-slate-800"></div>

              {generatedSlots.length === 0 ? (
                <div className="ml-10 py-6 text-slate-400 text-sm italic">
                  No available slots for this time.
                </div>
              ) : (
                generatedSlots.map((slot) => {
                  const isSelected = selectedSlot === slot;

                  return (
                    <div key={slot} className="flex gap-4 relative mb-6 cursor-pointer" onClick={() => setSelectedSlot(slot)}>
                      <div className={`w-10 text-xs font-bold pt-3 transition-colors ${isSelected ? 'text-blue-500' : 'text-slate-400'}`}>{slot}</div>
                      {isSelected ? (
                        <div className="flex-1 bg-blue-600 rounded-2xl p-4 text-white shadow-lg shadow-blue-600/30 relative overflow-hidden animate-fade-in">
                          <div className="flex items-center gap-3 relative z-10">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                              <Video size={20} className="text-white" />
                            </div>
                            <div>
                              <p className="font-bold text-sm">Selected Slot</p>
                              <p className="text-blue-100 text-xs">Video Consultation</p>
                            </div>
                            <div className="ml-auto bg-white text-blue-600 text-[10px] font-bold px-2 py-1 rounded-lg">
                              CONFIRM
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 p-3 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-400 flex items-center justify-center h-14 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all">
                          Tap to select
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Booking Summary Bar */}
          <div className="bg-slate-900 dark:bg-black rounded-3xl p-5 text-white shadow-xl relative overflow-hidden">
            {isBooking && (
              <div className="absolute inset-0 bg-slate-900/80 z-20 flex items-center justify-center backdrop-blur-sm animate-fade-in">
                <Loader2 size={32} className="text-blue-500 animate-spin" />
              </div>
            )}

            <div className="flex items-center gap-4 mb-5">
              <img src={selectedSpecialist.image} alt="Doctor" className="w-10 h-10 rounded-full object-cover border-2 border-slate-700" />
              <div>
                <p className="text-xs text-slate-400">Booking with <span className="text-white font-bold">{selectedSpecialist.name.split(' ')[1]}</span></p>
                <p className="text-[10px] text-slate-500">{selectedDate.fullDate} • {selectedSlot} • Video Call</p>
              </div>
              <div className="ml-auto">
                <span className="text-xl font-bold text-blue-400">Free/-</span>
              </div>
            </div>

            <button
              onClick={handleConfirmBooking}
              disabled={isBooking || !selectedSlot}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isBooking ? 'Sending Request...' : 'Send Booking Request'}
              {!isBooking && <Check size={18} strokeWidth={3} />}
            </button>
          </div>
        </div>
      )}

      {/* Admin Edit Doctor Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 relative shadow-2xl overflow-y-auto max-h-[90vh]">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X size={24} />
            </button>

            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">
              {isNewDoctor ? 'Add Specialist' : 'Edit Specialist'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Full Name</label>
                <input
                  type="text"
                  value={editingDoctor.name || ''}
                  onChange={e => setEditingDoctor({ ...editingDoctor, name: e.target.value })}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  placeholder="Dr. Jane Doe"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Specialty</label>
                <input
                  type="text"
                  value={editingDoctor.specialty || ''}
                  onChange={e => setEditingDoctor({ ...editingDoctor, specialty: e.target.value })}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  placeholder="Cardiologist"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Price ($)</label>
                  <input
                    type="number"
                    value={editingDoctor.price || ''}
                    onChange={e => setEditingDoctor({ ...editingDoctor, price: parseFloat(e.target.value) })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Match %</label>
                  <input
                    type="number"
                    value={editingDoctor.match || ''}
                    onChange={e => setEditingDoctor({ ...editingDoctor, match: parseInt(e.target.value) })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Availability Settings</h4>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Start Time</label>
                    <input
                      type="time"
                      value={editingDoctor.startTime || '09:00'}
                      onChange={e => setEditingDoctor({ ...editingDoctor, startTime: e.target.value })}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">End Time</label>
                    <input
                      type="time"
                      value={editingDoctor.endTime || '17:00'}
                      onChange={e => setEditingDoctor({ ...editingDoctor, endTime: e.target.value })}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Image URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editingDoctor.image || ''}
                    onChange={e => setEditingDoctor({ ...editingDoctor, image: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                    placeholder="https://..."
                  />
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-200 flex-shrink-0">
                    {editingDoctor.image && <img src={editingDoctor.image} className="w-full h-full object-cover" />}
                  </div>
                </div>
              </div>

              <button
                onClick={handleSaveDoctor}
                className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 transition-all mt-4"
              >
                {isNewDoctor ? 'Add Doctor' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal Overlay */}
      {showSuccess && selectedSpecialist && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] p-8 text-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-teal-400"></div>

            <div className="w-20 h-20 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={40} className="text-teal-600 dark:text-teal-400" />
            </div>

            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Request Sent!</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
              Your appointment request for <span className="font-bold text-slate-700 dark:text-slate-300">{selectedSpecialist.name}</span> has been sent. Please wait for admin approval.
            </p>

            <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 mb-8 text-left">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-slate-400">Date</span>
                <span className="text-sm font-bold text-slate-700 dark:text-white">{selectedDate.fullDate}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Time</span>
                <span className="text-sm font-bold text-slate-700 dark:text-white">{selectedSlot}</span>
              </div>
            </div>

            <button
              onClick={onBack}
              className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-4 rounded-2xl shadow-lg hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
            >
              Go to Dashboard
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;