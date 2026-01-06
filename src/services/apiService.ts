import axios from 'axios';
import { Appointment, Doctor } from '../types';

const API_BASE = '/api/appointments';

export const apiService = {
    async fetchAppointments(): Promise<Appointment[]> {
        try {
            const response = await axios.get(API_BASE);
            if (Array.isArray(response.data)) {
                return response.data;
            }
            console.error('API returned non-array for appointments:', response.data);
            return [];
        } catch (error) {
            console.error('Failed to fetch appointments:', error);
            throw error;
        }
    },

    async fetchDoctors(): Promise<Doctor[]> {
        try {
            const response = await axios.get(`${API_BASE}?type=doctors`);
            if (Array.isArray(response.data)) {
                return response.data;
            }
            return [];
        } catch (error) {
            console.error('Failed to fetch doctors:', error);
            throw error;
        }
    },

    async syncData(data: { appointments?: Appointment[], doctors?: Doctor[] }): Promise<void> {
        try {
            await axios.post(API_BASE, data);
        } catch (error) {
            console.error('Failed to sync data:', error);
            throw error;
        }
    },

    async bookAppointment(appointment: Appointment): Promise<void> {
        try {
            await axios.post(API_BASE, {
                appointment,
                action: 'add'
            });
        } catch (error) {
            console.error('Failed to book appointment:', error);
            throw error;
        }
    },

    async updateAppointment(appointment: Partial<Appointment> & { id: string }): Promise<void> {
        try {
            await axios.post(API_BASE, {
                appointment,
                action: 'update'
            });
        } catch (error) {
            console.error('Failed to update appointment:', error);
            throw error;
        }
    },

    async deleteAppointment(id: string): Promise<void> {
        try {
            await axios.post(API_BASE, {
                appointmentId: id,
                action: 'delete'
            });
        } catch (error) {
            console.error('Failed to delete appointment:', error);
            throw error;
        }
    }
};
