import { httpsCallable } from 'firebase/functions';
import { firebase } from '../config/firebase';
export async function saveCustomer(input: { id: string; name: string; phone: string }) {
  await httpsCallable(firebase().functions, 'saveCustomer')(input);
}
export async function saveVehicle(input: { customerId: string; plate: string; model: string }) {
  await httpsCallable(firebase().functions, 'saveVehicle')(input);
}
export async function provisionClient(input: { customerId: string; plate: string; password: string }) {
  return (await httpsCallable<typeof input, { success: boolean; resumed: boolean }>(firebase().functions, 'provisionClient')(input)).data;
}
export async function changeInitialPassword(password: string) {
  await httpsCallable(firebase().functions, 'changeInitialPassword')({ password });
}
