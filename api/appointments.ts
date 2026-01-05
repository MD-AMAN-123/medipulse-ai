import type { VercelRequest, VercelResponse } from "@vercel/node";

// In-memory store (volatile, will reset on cold starts)
// For a production app, use a real database like MongoDB, PostgreSQL, or Upstash Redis.
let appointmentsStore: any[] = [
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

let doctorsStore: any[] = [
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

    if (req.method === 'GET') {
        const { type } = req.query;
        if (type === 'doctors') return res.status(200).json(doctorsStore);
        return res.status(200).json(appointmentsStore);
    }

    if (req.method === 'POST') {
        const { appointments, doctors, appointment, action } = req.body;

        if (action === 'add' && appointment) {
            // Check if appointment already exists to prevent duplicates
            const exists = appointmentsStore.some(a => a.id === appointment.id);
            if (!exists) {
                appointmentsStore = [appointment, ...appointmentsStore];
            }
            return res.status(200).json({
                success: true,
                message: "Appointment added successfully",
                appointments: appointmentsStore
            });
        }

        if (appointments && Array.isArray(appointments)) {
            appointmentsStore = appointments;
        }
        if (doctors && Array.isArray(doctors)) {
            doctorsStore = doctors;
        }
        return res.status(200).json({ success: true, message: "Data synced successfully" });
    }

    return res.status(405).json({ error: "Method not allowed" });
}
