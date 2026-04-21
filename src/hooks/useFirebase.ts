import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, orderBy, limit, serverTimestamp } from 'firebase/firestore';
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

    // Listen for appointments
    const qAppointments = query(
      collection(db, 'agendamentos'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const unsubscribeAppointments = onSnapshot(qAppointments, (snap) => {
      setAppointments(snap.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data,
          // Robust mapping for compatibility
          clientName: data.clientName || data.cliente || 'Cliente',
          service: data.service || data.servico || 'Geral',
          status: data.status || 'pending',
          laborValue: Number(data.laborValue || data.maoDeObra || 0),
          partsValue: Number(data.partsValue || data.pecas || 0),
          oilValue: Number(data.oilValue || data.oleo || 0),
          date: data.date || (data.createdAt?.toDate ? data.createdAt.toDate().toISOString().split('T')[0] : new Date().toISOString().split('T')[0])
        } as Appointment;
      }));
    }, (err) => {
      console.warn('Firestore fallback mode for agendamentos');
      // If composite index is missing, try without orderBy
      const fallbackQuery = query(collection(db, 'agendamentos'), where('userId', '==', user.uid));
      onSnapshot(fallbackQuery, (fallbackSnap) => {
        setAppointments(fallbackSnap.docs.map(doc => {
          const data = doc.data();
          return { id: doc.id, ...data, clientName: data.clientName || data.cliente || 'Cliente', service: data.service || data.servico || 'Geral' } as Appointment;
        }));
      });
    });

    // Listen for services
    const qServices = query(
      collection(db, 'servicos'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
    const unsubscribeServices = onSnapshot(qServices, (snap) => {
      setServices(snap.docs.map(doc => {
          const data = doc.data();
          return { 
            id: doc.id, 
            ...data,
            clientName: data.clientName || data.cliente || 'Cliente',
            value: Number(data.value || data.total || data.valor || 0),
            laborValue: Number(data.laborValue || data.maoDeObra || 0),
            partsValue: Number(data.partsValue || data.pecas || 0),
            oilValue: Number(data.oilValue || data.oleo || 0),
            date: data.date || (data.createdAt?.toDate ? data.createdAt.toDate().toISOString().split('T')[0] : new Date().toISOString().split('T')[0])
          } as ServiceRecord;
      }));
    }, (err) => {
      console.warn('Firestore fallback mode for servicos');
      const fallbackQuery = query(collection(db, 'servicos'), where('userId', '==', user.uid));
      onSnapshot(fallbackQuery, (fallbackSnap) => {
        setServices(fallbackSnap.docs.map(doc => {
          const data = doc.data();
          return { id: doc.id, ...data, clientName: data.clientName || data.cliente || 'Cliente', value: Number(data.value || data.total || data.valor || 0) } as ServiceRecord;
        }));
      });
    });

    // Listen for cash flow
    const qCashFlow = query(
      collection(db, 'caixa'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubscribeCashFlow = onSnapshot(qCashFlow, (snap) => {
      setCashFlow(snap.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data,
          type: data.tipo === 'entrada' ? 'entry' : (data.type || 'entry'),
          value: Number(data.valor || data.value || 0)
        } as CashFlowEntry;
      }));
    }, (err) => {
      console.warn('Firestore fallback mode for caixa');
      const fallbackQuery = query(collection(db, 'caixa'), where('userId', '==', user.uid));
      onSnapshot(fallbackQuery, (fallbackSnap) => {
        setCashFlow(fallbackSnap.docs.map(doc => {
          const data = doc.data();
          return { id: doc.id, ...data, type: data.tipo === 'entrada' ? 'entry' : (data.type || 'entry'), value: Number(data.valor || data.value || 0) } as CashFlowEntry;
        }));
      });
    });

    // Listen for budgets
    const qBudgets = query(
      collection(db, 'orcamentos'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const unsubscribeBudgets = onSnapshot(qBudgets, (snap) => {
      setBudgets(snap.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data,
          clientName: data.clientName || data.cliente || 'Cliente',
          totalGeneral: Number(data.totalGeneral || data.total || 0),
          date: data.date || (data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString())
        } as Budget;
      }));
      setLoading(false);
    }, (err) => {
      console.warn('Firestore fallback mode for orcamentos');
      const fallbackQuery = query(collection(db, 'orcamentos'), where('userId', '==', user.uid));
      onSnapshot(fallbackQuery, (fallbackSnap) => {
        setBudgets(fallbackSnap.docs.map(doc => {
          const data = doc.data();
          return { id: doc.id, ...data, clientName: data.clientName || data.cliente || 'Cliente' } as Budget;
        }));
        setLoading(false);
      });
    });

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
      await addDoc(collection(db, 'agendamentos'), { 
        ...data, 
        cliente: data.clientName, // compatibility
        servico: data.service,    // compatibility
        maoDeObra: data.laborValue, // compatibility
        pecas: data.partsValue,     // compatibility
        oleo: data.oilValue,        // compatibility
        userId: currentUser.uid,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, 'CREATE', `agendamentos`);
      throw err;
    }
  };

  const updateAppointment = async (id: string, data: Partial<Appointment>) => {
    const currentUser = auth.currentUser || user;
    if (!currentUser) throw new Error('Usuário não autenticado');
    try {
      await updateDoc(doc(db, 'agendamentos', id), data);
    } catch (err) {
      handleFirestoreError(err, 'UPDATE', `agendamentos/${id}`);
      throw err;
    }
  };

  const deleteAppointment = async (id: string) => {
    const currentUser = auth.currentUser || user;
    if (!currentUser) throw new Error('Usuário não autenticado');
    try {
      await deleteDoc(doc(db, 'agendamentos', id));
    } catch (err) {
      handleFirestoreError(err, 'DELETE', `agendamentos/${id}`);
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
        cliente: data.clientName, // compatibility
        maoDeObra: laborValue,
        pecas: partsValue,
        oleo: oilValue,
        total: totalValue,
        valor: totalValue,
        userId: currentUser.uid,
        createdAt: serverTimestamp()
      };
      
      const serviceRef = await addDoc(collection(db, 'servicos'), serviceData);
      
      await addDoc(collection(db, 'caixa'), {
        userId: currentUser.uid,
        tipo: 'entrada',
        type: 'entry',
        valor: totalValue,
        value: totalValue,
        origem: 'servico',
        referenciaId: serviceRef.id,
        description: `Serviço: ${data.clientName} (${data.vehicle || 'Geral'})`,
        paymentMethod: data.paymentMethod,
        date: data.date,
        createdAt: serverTimestamp()
      });
      
      return serviceRef;
    } catch (err) {
      handleFirestoreError(err, 'CREATE', `servicos`);
      throw err;
    }
  };

  const addCashFlowEntry = async (data: Omit<CashFlowEntry, 'id' | 'userId'>) => {
    const currentUser = auth.currentUser || user;
    if (!currentUser) throw new Error('Usuário não autenticado');
    try {
      await addDoc(collection(db, 'caixa'), { 
        userId: currentUser.uid,
        tipo: data.type === 'entry' ? 'entrada' : 'saída',
        type: data.type,
        valor: data.value,
        value: data.value,
        description: data.description,
        descricao: data.description, // compatibility
        paymentMethod: data.paymentMethod,
        date: data.date,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, 'CREATE', `caixa`);
      throw err;
    }
  };

  const addBudget = async (data: any) => {
    const currentUser = auth.currentUser || user;
    if (!currentUser) throw new Error('Usuário não autenticado');
    try {
      const laborValue = parseFloat(String(data.laborValue || data.maoDeObra || data.totalLabor)) || 0;
      const partsValue = parseFloat(String(data.partsValue || data.pecas || data.totalParts)) || 0;
      const oilValue = parseFloat(String(data.oilValue || data.oleo)) || 0;
      const totalValue = laborValue + partsValue + oilValue;

      // Concatenate services for the 'servico' legacy field if not provided
      const serviceDescription = data.service || data.servico || (data.services && data.services.length > 0 
        ? data.services.map((s: any) => s.description).join(', ') 
        : '');

      return await addDoc(collection(db, 'orcamentos'), { 
        ...data, 
        cliente: data.clientName || data.cliente || '',
        servico: serviceDescription,
        maoDeObra: laborValue,
        pecas: partsValue,
        oleo: oilValue,
        total: totalValue,
        totalGeneral: totalValue,
        userId: currentUser.uid,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, 'CREATE', `orcamentos`);
      throw err;
    }
  };

  const deleteBudget = async (id: string) => {
    const currentUser = auth.currentUser || user;
    if (!currentUser) throw new Error('Usuário não autenticado');
    try {
      await deleteDoc(doc(db, 'orcamentos', id));
    } catch (err) {
      handleFirestoreError(err, 'DELETE', `orcamentos/${id}`);
      throw err;
    }
  };

  const deleteService = async (id: string) => {
    const currentUser = auth.currentUser || user;
    if (!currentUser) throw new Error('Usuário não autenticado');
    try {
      await deleteDoc(doc(db, 'servicos', id));
    } catch (err) {
      handleFirestoreError(err, 'DELETE', `servicos/${id}`);
      throw err;
    }
  };

  const deleteCashFlowEntry = async (id: string) => {
    const currentUser = auth.currentUser || user;
    if (!currentUser) throw new Error('Usuário não autenticado');
    try {
      await deleteDoc(doc(db, 'caixa', id));
    } catch (err) {
      handleFirestoreError(err, 'DELETE', `caixa/${id}`);
      throw err;
    }
  };

  const deleteItem = async (collectionName: string, id: string) => {
    const currentUser = auth.currentUser || user;
    if (!currentUser) throw new Error('Usuário não autenticado');
    
    if (!confirm("Deseja realmente excluir este registro?")) return;

    try {
      await deleteDoc(doc(db, collectionName, id));
    } catch (err) {
      handleFirestoreError(err, 'DELETE', `${collectionName}/${id}`);
      throw err;
    }
  };

  const completeAppointment = async (appointment: Appointment) => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Usuário não autenticado');
    try {
      // 1. Update status to completed
      await updateDoc(doc(db, 'agendamentos', appointment.id), { status: 'completed' });
      
      // 2. Automatically record in finance
      const totalValue = (appointment.laborValue || 0) + (appointment.partsValue || 0) + (appointment.oilValue || 0);
      if (totalValue > 0) {
        await addDoc(collection(db, 'caixa'), {
          userId: currentUser.uid,
          tipo: 'entrada',
          type: 'entry',
          valor: totalValue,
          value: totalValue,
          description: `Agenda Concluída: ${appointment.clientName} (${appointment.vehicle || 'Geral'})`,
          descricao: `Agenda Concluída: ${appointment.clientName} (${appointment.vehicle || 'Geral'})`,
          paymentMethod: 'Dinheiro', 
          date: new Date().toISOString().split('T')[0],
          appointmentId: appointment.id,
          createdAt: serverTimestamp()
        });
      }
    } catch (err) {
      handleFirestoreError(err, 'UPDATE', `agendamentos/${appointment.id}`);
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
    deleteService,
    addCashFlowEntry,
    deleteCashFlowEntry,
    addBudget,
    deleteBudget,
    deleteItem
  };
}
