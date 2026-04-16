import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, orderBy } from 'firebase/firestore';
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
      orderBy('date', 'desc')
    );
    const unsubscribeAppointments = onSnapshot(qAppointments, (snap) => {
      setAppointments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment)));
    }, (err) => handleFirestoreError(err, 'LIST', `usuarios/${user.uid}/agendamentos`));

    const qServices = query(
      collection(db, 'usuarios', user.uid, 'servicos'),
      orderBy('date', 'desc')
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
      orderBy('date', 'desc')
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
      await addDoc(collection(db, 'usuarios', user.uid, 'servicos'), { ...data, userId: user.uid });
      // Also add to cash flow
      await addDoc(collection(db, 'usuarios', user.uid, 'caixa'), {
        userId: user.uid,
        type: 'entry',
        value: data.value,
        description: `Serviço: ${data.clientName}`,
        paymentMethod: data.paymentMethod,
        date: data.date
      });
    } catch (err) {
      handleFirestoreError(err, 'CREATE', `usuarios/${user.uid}/servicos`);
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
