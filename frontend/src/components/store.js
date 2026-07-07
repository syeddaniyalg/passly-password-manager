import { create } from 'zustand';

export const useStore = create((set) => ({
    auth: false,
    status:'loading',
    fullName: '',
    setAuth: (val) => set({ auth: val }),
    setFullName: (val) => set({ fullName: val }),
    setStatus: (val)=> set({status:val})
}));