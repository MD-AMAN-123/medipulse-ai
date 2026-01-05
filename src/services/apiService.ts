import axios from 'axios';
import { Appointment, Doctor } from '../types';

const API_BASE = '/api/appointments';

export const apiService = {
    async fetchAppointments(): Promise<Appointment[]> {
        try {
            const response = await axios.get(API_BASE);
            return response.data;
        } catch (error) {
            console.error('Failed to fetch appointments:', error);
            throw error;
        }
    },

    async fetchDoctors(): Promise<Doctor[]> {
        try {
            const response = await axios.get(`${API_BASE}?type=doctors`);
            return response.data;
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
    }
};
