import { getFirestore, doc, getDoc } from 'firebase/firestore';

export const getCompanyName = async () => {
  const db = getFirestore();
  const docRef = doc(db, 'config', 'company');
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data().name || '';
  }
  return '';
};