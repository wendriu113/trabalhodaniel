import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { collection, collectionGroup, onSnapshot, query } from 'firebase/firestore';
import { firebase } from '../config/firebase';
import { useAuth } from './AuthContext';
import type { Customer, Vehicle, ServiceOrder, Movement } from '../types';
import { errorMessage } from '../utils/errors';

type DataState = { orders: ServiceOrder[]; customers: Customer[]; vehicles: Vehicle[]; movements: Movement[]; loading: boolean; error: string; retry: () => void };
const DataContext = createContext<DataState | null>(null);
export function DataProvider({ children }: PropsWithChildren) {
  const { user, isAdmin } = useAuth();
  const [orders, setOrders] = useState<ServiceOrder[]>([]), [internal, setInternal] = useState<Record<string, Partial<ServiceOrder>>>({});
  const [legacy, setLegacy] = useState<ServiceOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]), [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]), [pending, setPending] = useState(6);
  const [errors, setErrors] = useState<Record<string, string>>({}), [attempt, setAttempt] = useState(0);
  useEffect(() => {
    setOrders([]); setLegacy([]); setInternal({}); setCustomers([]); setVehicles([]); setMovements([]); setErrors({}); setPending(6);
    if (!user || !isAdmin) { setPending(0); return; }
    // Small workshop: introduce pagination when real data volume requires it.
    const subscribe = <T,>(path: string, setter: (data: T[]) => void) => {
      let first = true;
      const ready = () => { if (first) { first = false; setPending(n => n - 1); } };
      return onSnapshot(query(collection(firebase().db, path)), snapshot => {
        setter(snapshot.docs.map(doc => ({ ...doc.data({ serverTimestamps: 'estimate' }), id: doc.id }) as T));
        setErrors(previous => ({ ...previous, [path]: '' })); ready();
      }, error => { setter([]); setErrors(previous => ({ ...previous, [path]: errorMessage(error) })); ready(); });
    };
    const stops = [subscribe('serviceOrders', setOrders), subscribe<ServiceOrder>('serviceOrderInternal', values => setInternal(Object.fromEntries(values.map(v => [v.id, v])))),
      subscribe('customers', setCustomers), subscribe('vehicles', setVehicles), subscribe(`users/${user.uid}/movements`, setMovements)];
    let firstLegacy = true;
    const legacyReady = () => { if (firstLegacy) { firstLegacy = false; setPending(n => n - 1); } };
    stops.push(onSnapshot(collectionGroup(firebase().db, 'orders'), snapshot => {
      setLegacy(snapshot.docs.filter(d => d.ref.path.startsWith('users/') && d.ref.path.split('/').length === 4).map(d => {
        const uid = d.ref.parent.parent!.id;
        return { ...d.data({ serverTimestamps: 'estimate' }), id: `legacy:${uid}:${d.id}`, legacyUid: uid, legacyOrderId: d.id, createdBy: uid, publicNotes: '', internalNotes: '' } as ServiceOrder;
      })); legacyReady();
    }, e => { setErrors(previous => ({ ...previous, legacy: errorMessage(e) })); legacyReady(); }));
    return () => stops.forEach(stop => stop());
  }, [user?.uid, isAdmin, attempt]);
  const joined = [...orders.filter(order => internal[order.id]).map(order => ({ ...order, ...internal[order.id] })),
    ...legacy.filter(old => !orders.some(order => order.id === old.legacyOrderId && order.createdBy === old.legacyUid))]
    .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
  return <DataContext.Provider value={{ orders: joined, customers, vehicles, movements, loading: pending > 0, error: Object.values(errors).filter(Boolean).join('\n'), retry: () => setAttempt(n => n + 1) }}>{children}</DataContext.Provider>;
}
export function useData() {
  const data = useContext(DataContext);
  if (!data) throw new Error('DataProvider ausente.');
  return data;
}
