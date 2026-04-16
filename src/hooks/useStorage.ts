import { useState, useEffect } from 'react';
import { Appointment, ServiceRecord, CashFlowEntry, AppSettings } from '../types';

const STORAGE_KEYS = {
  APPOINTMENTS: 'toplubri_appointments',
  SERVICES: 'toplubri_services',
  CASHFLOW: 'toplubri_cashflow',
  SETTINGS: 'toplubri_settings',
};

export function useStorage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [cashFlow, setCashFlow] = useState<CashFlowEntry[]>([]);
  const [settings, setSettings] = useState<AppSettings>({ companyName: 'Top Lubri' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = () => {
      const storedAppointments = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
      const storedServices = localStorage.getItem(STORAGE_KEYS.SERVICES);
      const storedCashFlow = localStorage.getItem(STORAGE_KEYS.CASHFLOW);
      const storedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);

      if (storedAppointments) setAppointments(JSON.parse(storedAppointments));
      if (storedServices) setServices(JSON.parse(storedServices));
      if (storedCashFlow) setCashFlow(JSON.parse(storedCashFlow));
      if (storedSettings) setSettings(JSON.parse(storedSettings));
      
      setLoading(false);
    };

    loadData();
  }, []);

  const saveAppointments = (data: Appointment[]) => {
    setAppointments(data);
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(data));
  };

  const saveServices = (data: ServiceRecord[]) => {
    setServices(data);
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(data));
  };

  const saveCashFlow = (data: CashFlowEntry[]) => {
    setCashFlow(data);
    localStorage.setItem(STORAGE_KEYS.CASHFLOW, JSON.stringify(data));
  };

  const saveSettings = (data: AppSettings) => {
    setSettings(data);
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data));
  };

  return {
    appointments,
    services,
    cashFlow,
    settings,
    loading,
    saveAppointments,
    saveServices,
    saveCashFlow,
    saveSettings,
  };
}
