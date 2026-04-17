import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, orderBy, limit } from 'firebase/firestore';
import { db, handleFirestoreError } from '../lib/firebase';
import { useAuth } from './useAuth';
import { Appointment, ServiceRecord, CashFlowEntry, Budget } from '../types';

export function useFirebase() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [cashFlow, setCashFlow] = useState<CashFlowEntry[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setAppointments([]);
      setServices([]);
      setCashFlow([]);
      setBudgets([]);
      setLoading(false);
      return;
    }

    const qAppointments = query(
      collection(db, 'usuarios', user.uid, 'agendamentos'),
      orderBy('date', 'desc'),
      limit(50)
    );
    const unsubscribeAppointments = onSnapshot(qAppointments, (snap) => {
      setAppointments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment)));
    }, (err) => handleFirestoreError(err, 'LIST', `usuarios/${user.uid}/agendamentos`));

    const qServices = query(
      collection(db, 'usuarios', user.uid, 'servicos'),
      orderBy('date', 'desc'),
      limit(100)
    );
    const unsubscribeServices = onSnapshot(qServices, (snap) => {
      setServices(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceRecord)));
    }, (err) => handleFirestoreError(err, 'LIST', `usuarios/${user.uid}/servicos`));

    const qCashFlow = query(
      collection(db, 'usuarios', user.uid, 'caixa'),
      orderBy('date', 'desc')
    );
    const unsubscribeCashFlow = onSnapshot(qCashFlow, (snap) => {
      setCashFlow(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as CashFlowEntry)));
    }, (err) => handleFirestoreError(err, 'LIST', `usuarios/${user.uid}/caixa`));

    const qBudgets = query(
      collection(db, 'usuarios', user.uid, 'orcamentos'),
      orderBy('date', 'desc'),
      limit(50)
    );
    const unsubscribeBudgets = onSnapshot(qBudgets, (snap) => {
      setBudgets(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Budget)));
      setLoading(false);
    }, (err) => handleFirestoreError(err, 'LIST', `usuarios/${user.uid}/orcamentos`));

    return () => {
      unsubscribeAppointments();
      unsubscribeServices();
      unsubscribeCashFlow();
      unsubscribeBudgets();
    };
  }, [user]);

  const addAppointment = async (data: Omit<Appointment, 'id' | 'userId'>) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'usuarios', user.uid, 'agendamentos'), { ...data, userId: user.uid });
    } catch (err) {
      handleFirestoreError(err, 'CREATE', `usuarios/${user.uid}/agendamentos`);
    }
  };

  const updateAppointment = async (id: string, data: Partial<Appointment>) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'usuarios', user.uid, 'agendamentos', id), data);
    } catch (err) {
      handleFirestoreError(err, 'UPDATE', `usuarios/${user.uid}/agendamentos/${id}`);
    }
  };

  const deleteAppointment = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'usuarios', user.uid, 'agendamentos', id));
    } catch (err) {
      handleFirestoreError(err, 'DELETE', `usuarios/${user.uid}/agendamentos/${id}`);
    }
  };

  const addService = async (data: Omit<ServiceRecord, 'id' | 'userId'>) => {
    if (!user) return;
    try {
      // Valor total = Mão de Obra + Peças (Óleo já consolidado em Peças)
      const laborValue = parseFloat(String(data.laborValue)) || 0;
      const partsValue = parseFloat(String(data.partsValue)) || 0;
      const totalValue = laborValue + partsValue;
      
      const serviceData = { 
        ...data, 
        laborValue,
        partsValue,
        value: totalValue, 
        userId: user.uid,
        createdAt: new Date().toISOString()
      };
      
      // Step 1: Save the service record
      const serviceRef = await addDoc(collection(db, 'usuarios', user.uid, 'servicos'), serviceData);
      
      // Step 2: Automatically record in cash flow (FINANCEIRO INTEGRADO)
      await addDoc(collection(db, 'usuarios', user.uid, 'caixa'), {
        userId: user.uid,
        type: 'entry',
        value: totalValue,
        description: `Serviço: ${data.clientName} (${data.vehicle || 'Geral'})`,
        paymentMethod: data.paymentMethod,
        date: data.date,
        serviceId: serviceRef.id,
        createdAt: new Date().toISOString()
      });
      
      return serviceRef;
    } catch (err) {
      handleFirestoreError(err, 'CREATE', `usuarios/${user.uid}/servicos`);
      throw err;
    }
  };

  const addCashFlowEntry = async (data: Omit<CashFlowEntry, 'id' | 'userId'>) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'usuarios', user.uid, 'caixa'), { ...data, userId: user.uid });
    } catch (err) {
      handleFirestoreError(err, 'CREATE', `usuarios/${user.uid}/caixa`);
    }
  };

  const addBudget = async (data: Omit<Budget, 'id' | 'userId'>) => {
    if (!user) return;
    try {
      return await addDoc(collection(db, 'usuarios', user.uid, 'orcamentos'), { ...data, userId: user.uid });
    } catch (err) {
      handleFirestoreError(err, 'CREATE', `usuarios/${user.uid}/orcamentos`);
    }
  };

  const deleteBudget = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'usuarios', user.uid, 'orcamentos', id));
    } catch (err) {
      handleFirestoreError(err, 'DELETE', `usuarios/${user.uid}/orcamentos/${id}`);
    }
  };

  return {
    appointments,
    services,
    cashFlow,
    budgets,
    loading,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    addService,
    addCashFlowEntry,
    addBudget,
    deleteBudget
  };
}
