// src/store/dataStore.ts
import { create } from 'zustand';
import api from '../lib/api';

type Theme = 'normal' | 'independence-day';

interface DataStore {
  data: any[];
  theme: Theme;
  loading: boolean;
  fetchData: () => Promise<void>;
}

export const useDataStore = create<DataStore>((set) => ({
  data: [],
  theme: 'normal', // Initial theme
  loading: false,
  fetchData: async () => {
    set({ loading: true });
    try {
      const response = await api.get('/content/all-content');
      const toggle = response.data.toggle; // Extract toggle from response
      set({
        data: response.data,
        theme: toggle ? 'independence-day' : 'normal', // Set theme based on toggle
        loading: false,
      });
      console.log('Data fetched:', response.data);
     console.log('Current theme from store:', useDataStore.getState().theme);
    } catch (error) {
      console.error('Error fetching data:', error);
      set({ loading: false });
    }
  },
}));