import type { VercelRequest, VercelResponse } from "@vercel/node";
import fs from 'fs';
import path from 'path';

// Helper to get persistent file path
const DATA_DIR = path.join(process.cwd(), 'data');
const APPOINTMENTS_FILE = path.join(DATA_DIR, 'appointments.json');
const DOCTORS_FILE = path.join(DATA_DIR, 'doctors.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch (e) {
        console.warn("Failed to create data directory (likely read-only filesystem)", e);
    }
}

// In-memory fallback for Vercel/Serverless environments where filesystem is ephemeral
let inMemoryAppointments: any[] | null = null;
let inMemoryDoctors: any[] | null = null;

// Helper to read data
const readData = (filePath: string, defaultData: any[]) => {
    try {
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            const data = JSON.parse(content);
            if (Array.isArray(data) && data.length > 0) {
                return data;
            }
        }
    } catch (e) {
        console.error(`Error reading ${filePath}:`, e);
    }
    return defaultData;
};

// Helper to write data
const writeData = (filePath: string, data: any[]) => {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
        console.error(`Error writing ${filePath}:`, e);
    }
};

// Initial Data
const initialAppointments = [
    {
        id: '1',
        patientName: 'Alex Johnson',
        patientMobile: '9876543210',
        doctorName: 'Dr. Sarah Chen',
        specialty: 'Cardiology Specialist',
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
        doctorName: 'Dr. Michael Ross',
        specialty: 'Neurologist',
        date: 'Tomorrow',
        time: '09:00',
        status: 'upcoming',
        imageUrl: 'https://picsum.photos/102/102',
        type: 'in-person',
        location: 'MedCentral Clinic',
        meetLink: 'https://meet.google.com/xyz-uvwx-yz'
    }
];

const initialDoctors = [
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
    }
];

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Load data from files on each request for persistence, with in-memory fallback
    let appointmentsStore = inMemoryAppointments || readData(APPOINTMENTS_FILE, initialAppointments);
    let doctorsStore = inMemoryDoctors || readData(DOCTORS_FILE, initialDoctors);

    // Ensure we sync back to memory if we just loaded from file
    if (!inMemoryAppointments) inMemoryAppointments = appointmentsStore;
    if (!inMemoryDoctors) inMemoryDoctors = doctorsStore;

    if (req.method === 'GET') {
        const { type } = req.query;
        if (type === 'doctors') return res.status(200).json(doctorsStore);
        return res.status(200).json(appointmentsStore);
    }

    if (req.method === 'POST') {
        const { appointments, doctors, appointment, action } = req.body;

        if (action === 'add' && appointment) {
            const exists = appointmentsStore.some((a: any) => a.id === appointment.id);
            if (!exists) {
                appointmentsStore = [appointment, ...appointmentsStore];
                inMemoryAppointments = appointmentsStore;
                writeData(APPOINTMENTS_FILE, appointmentsStore);
            }
            return res.status(200).json({ success: true, appointments: appointmentsStore });
        }

        if (action === 'update' && appointment) {
            appointmentsStore = appointmentsStore.map((a: any) =>
                a.id === appointment.id ? { ...a, ...appointment } : a
            );
            inMemoryAppointments = appointmentsStore;
            writeData(APPOINTMENTS_FILE, appointmentsStore);
            return res.status(200).json({ success: true, appointments: appointmentsStore });
        }

        if (action === 'delete' && req.body.appointmentId) {
            const id = req.body.appointmentId;
            appointmentsStore = appointmentsStore.filter((a: any) => a.id !== id);
            inMemoryAppointments = appointmentsStore;
            writeData(APPOINTMENTS_FILE, appointmentsStore);
            return res.status(200).json({ success: true, appointments: appointmentsStore });
        }

        // Broad sync for doctors only
        if (doctors && Array.isArray(doctors)) {
            doctorsStore = doctors;
            inMemoryDoctors = doctorsStore;
            writeData(DOCTORS_FILE, doctorsStore);
        }
        return res.status(200).json({ success: true, message: "Action completed successfully" });
    }

    return res.status(405).json({ error: "Method not allowed" });
}

