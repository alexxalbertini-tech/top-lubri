import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, orderBy, limit } from 'firebase/firestore';
import { db, auth, handleFirestoreError } from '../lib/firebase';
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
      setCashFlow(snap.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data,
          // Map Portuguese fields if they exist for UI compatibility
          type: data.tipo || data.type || 'entry',
          value: data.valor || data.value || 0
        } as CashFlowEntry;
      }));
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
    const currentUser = auth.currentUser || user;
    if (!currentUser) throw new Error('Usuário não autenticado');
    try {
      await addDoc(collection(db, 'usuarios', currentUser.uid, 'agendamentos'), { 
        ...data, 
        userId: currentUser.uid,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, 'CREATE', `usuarios/${currentUser.uid}/agendamentos`);
      throw err;
    }
  };

  const updateAppointment = async (id: string, data: Partial<Appointment>) => {
    const currentUser = auth.currentUser || user;
    if (!currentUser) throw new Error('Usuário não autenticado');
    try {
      await updateDoc(doc(db, 'usuarios', currentUser.uid, 'agendamentos', id), data);
    } catch (err) {
      handleFirestoreError(err, 'UPDATE', `usuarios/${currentUser.uid}/agendamentos/${id}`);
      throw err;
    }
  };

  const deleteAppointment = async (id: string) => {
    const currentUser = auth.currentUser || user;
    if (!currentUser) throw new Error('Usuário não autenticado');
    try {
      await deleteDoc(doc(db, 'usuarios', currentUser.uid, 'agendamentos', id));
    } catch (err) {
      handleFirestoreError(err, 'DELETE', `usuarios/${currentUser.uid}/agendamentos/${id}`);
      throw err;
    }
  };

  const addService = async (data: Omit<ServiceRecord, 'id' | 'userId'>) => {
    const currentUser = auth.currentUser || user;
    if (!currentUser) throw new Error('Usuário não autenticado');
    try {
      const laborValue = parseFloat(String(data.laborValue)) || 0;
      const partsValue = parseFloat(String(data.partsValue)) || 0;
      const oilValue = parseFloat(String(data.oilValue)) || 0;
      const totalValue = laborValue + partsValue + oilValue;
      
      const serviceData = { 
        ...data, 
        laborValue,
        partsValue,
        oilValue,
        value: totalValue, 
        // Portuguese aliases for the user's specific audit request
        maoDeObra: laborValue,
        pecas: partsValue,
        oleo: oilValue,
        total: totalValue,
        userId: currentUser.uid,
        createdAt: new Date().toISOString()
      };
      
      // Step 1: Save the service record
      const serviceRef = await addDoc(collection(db, 'usuarios', currentUser.uid, 'servicos'), serviceData);
      
      // Step 2: Automatically record in cash flow (INTEGRAÇÃO FINANCEIRA)
      await addDoc(collection(db, 'usuarios', currentUser.uid, 'caixa'), {
        userId: currentUser.uid,
        tipo: 'entrada',
        valor: totalValue,
        origem: 'servico',
        referenciaId: serviceRef.id,
        description: `Serviço: ${data.clientName} (${data.vehicle || 'Geral'})`,
        paymentMethod: data.paymentMethod,
        date: data.date,
        createdAt: new Date().toISOString()
      });
      
      return serviceRef;
    } catch (err) {
      handleFirestoreError(err, 'CREATE', `usuarios/${currentUser.uid}/servicos`);
      throw err;
    }
  };

  const addCashFlowEntry = async (data: Omit<CashFlowEntry, 'id' | 'userId'>) => {
    const currentUser = auth.currentUser || user;
    if (!currentUser) throw new Error('Usuário não autenticado');
    try {
      await addDoc(collection(db, 'usuarios', currentUser.uid, 'caixa'), { 
        userId: currentUser.uid,
        tipo: data.type === 'entry' ? 'entrada' : 'saída',
        type: data.type, // keep both for safety
        valor: data.value,
        value: data.value, // keep both for safety
        description: data.description,
        paymentMethod: data.paymentMethod,
        date: data.date,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, 'CREATE', `usuarios/${currentUser.uid}/caixa`);
      throw err;
    }
  };

  const addBudget = async (data: Omit<Budget, 'id' | 'userId'>) => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Usuário não autenticado');
    try {
      return await addDoc(collection(db, 'usuarios', currentUser.uid, 'orcamentos'), { 
        ...data, 
        userId: currentUser.uid,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, 'CREATE', `usuarios/${currentUser.uid}/orcamentos`);
      throw err;
    }
  };

  const deleteBudget = async (id: string) => {
    const currentUser = auth.currentUser || user;
    if (!currentUser) throw new Error('Usuário não autenticado');
    try {
      await deleteDoc(doc(db, 'usuarios', currentUser.uid, 'orcamentos', id));
    } catch (err) {
      handleFirestoreError(err, 'DELETE', `usuarios/${currentUser.uid}/orcamentos/${id}`);
      throw err;
    }
  };

  const completeAppointment = async (appointment: Appointment) => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Usuário não autenticado');
    try {
      // 1. Update status to completed
      await updateDoc(doc(db, 'usuarios', currentUser.uid, 'agendamentos', appointment.id), { status: 'completed' });
      
      // 2. Automatically record in finance (INTEGRAÇÃO FINANCEIRA)
      const totalValue = (appointment.laborValue || 0) + (appointment.partsValue || 0) + (appointment.oilValue || 0);
      if (totalValue > 0) {
        await addDoc(collection(db, 'usuarios', currentUser.uid, 'caixa'), {
          userId: currentUser.uid,
          type: 'entry',
          value: totalValue,
          description: `Agenda Concluída: ${appointment.clientName} (${appointment.vehicle || 'Geral'})`,
          paymentMethod: 'Dinheiro', 
          date: new Date().toISOString().split('T')[0],
          appointmentId: appointment.id,
          createdAt: new Date().toISOString()
        });
      }
    } catch (err) {
      handleFirestoreError(err, 'UPDATE', `usuarios/${currentUser.uid}/agendamentos/${appointment.id}`);
      throw err;
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
    completeAppointment,
    deleteAppointment,
    addService,
    addCashFlowEntry,
    addBudget,
    deleteBudget
  };
}
