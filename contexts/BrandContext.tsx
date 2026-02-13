import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, storage } from '../config/firebase';
import { useAuth } from './AuthContext';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  updateDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy
} from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

interface BrandColors {
  primary: string;
  secondary: string;
  accent: string;
}

export interface Brand {
  id: string;
  name: string;
  colors: BrandColors;
  logo: string | null;
  savedLogos: string[];
}

interface BrandContextType {
  brands: Brand[];
  activeBrandId: string;
  brand: Brand;
  
  activateBrand: (id: string) => void;
  addBrand: () => void;
  removeBrand: (id: string) => void;
  updateBrand: (id: string, updates: Partial<Brand>) => void;
  
  isDirty: boolean; // Mantido para compatibilidade, mas sempre false no modo Firestore realtime
}

const DEFAULT_BRAND_ID = 'default-brand-placeholder';

// Fallback brand visual enquanto carrega
const LOADING_BRAND: Brand = {
  id: DEFAULT_BRAND_ID,
  name: 'Carregando...',
  colors: { primary: '#333', secondary: '#444', accent: '#555' },
  logo: null,
  savedLogos: [],
};

const BrandContext = createContext<BrandContextType | undefined>(undefined);

export const BrandProvider = ({ children }: { children?: React.ReactNode }) => {
  const { user } = useAuth();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [activeBrandId, setActiveBrandId] = useState<string>('');

  // 1. Subscribe to Firestore
  useEffect(() => {
    if (!user) {
      setBrands([]);
      return;
    }

    const q = query(collection(db, 'users', user.uid, 'brands'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedBrands = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Brand[];

      // Se não tiver nenhuma marca no banco, cria a padrão automaticamente
      if (loadedBrands.length === 0) {
        createDefaultBrand(user.uid);
      } else {
        setBrands(loadedBrands);
        // Se a marca ativa não estiver na lista (ou vazia), seleciona a primeira
        if (!activeBrandId || !loadedBrands.find(b => b.id === activeBrandId)) {
           const savedId = localStorage.getItem('shivuk_active_brand_id');
           if (savedId && loadedBrands.find(b => b.id === savedId)) {
             setActiveBrandId(savedId);
           } else {
             setActiveBrandId(loadedBrands[0].id);
           }
        }
      }
    });

    return () => unsubscribe();
  }, [user]);

  const createDefaultBrand = async (uid: string) => {
    try {
        await addDoc(collection(db, 'users', uid, 'brands'), {
            name: 'Minha Marca',
            colors: {
                primary: '#F1B701',
                secondary: '#F8851A',
                accent: '#FFB020',
            },
            logo: null,
            savedLogos: []
        });
    } catch (e) {
        console.error("Erro ao criar marca padrão", e);
    }
  };

  const activeBrand = brands.find(b => b.id === activeBrandId) || brands[0] || LOADING_BRAND;

  const activateBrand = (id: string) => {
    setActiveBrandId(id);
    localStorage.setItem('shivuk_active_brand_id', id);
  };

  const addBrand = async () => {
    if (!user) return;
    try {
        const docRef = await addDoc(collection(db, 'users', user.uid, 'brands'), {
            name: 'Nova Marca',
            colors: {
                primary: '#000000',
                secondary: '#333333',
                accent: '#666666',
            },
            logo: null,
            savedLogos: []
        });
        activateBrand(docRef.id);
    } catch (error) {
        console.error("Error adding brand: ", error);
    }
  };

  const removeBrand = async (idToDelete: string) => {
    if (!user) return;
    if (brands.length <= 1) {
      alert("Você precisa ter pelo menos um cliente na carteira.");
      return;
    }
    try {
        await deleteDoc(doc(db, 'users', user.uid, 'brands', idToDelete));
        // A atualização do estado activeBrandId acontece via useEffect quando o snapshot mudar
    } catch (error) {
        console.error("Error removing brand: ", error);
    }
  };

  const updateBrand = async (id: string, updates: Partial<Brand>) => {
    if (!user) return;
    
    // Logic to handle image uploads for 'logo' and 'savedLogos'
    const finalUpdates = { ...updates };
    
    try {
        // Upload logo if base64
        if (finalUpdates.logo && finalUpdates.logo.startsWith('data:')) {
             const logoRef = ref(storage, `users/${user.uid}/brands/${id}/logo_${Date.now()}.png`);
             await uploadString(logoRef, finalUpdates.logo, 'data_url');
             finalUpdates.logo = await getDownloadURL(logoRef);
        }

        // Upload savedLogos items if they are base64
        // Note: This logic assumes new logos are added to the beginning of the array as per BrandsPage.tsx
        if (finalUpdates.savedLogos && finalUpdates.savedLogos.length > 0) {
             const newSavedLogos = await Promise.all(finalUpdates.savedLogos.map(async (logoStr) => {
                 if (logoStr.startsWith('data:')) {
                     const logoRef = ref(storage, `users/${user.uid}/brands/${id}/saved_${Date.now()}_${Math.random().toString(36).substr(2,5)}.png`);
                     await uploadString(logoRef, logoStr, 'data_url');
                     return await getDownloadURL(logoRef);
                 }
                 return logoStr; // Already a URL
             }));
             finalUpdates.savedLogos = newSavedLogos;
        }

        // Firestore update
        await updateDoc(doc(db, 'users', user.uid, 'brands', id), finalUpdates);
    } catch (error) {
        console.error("Error updating brand: ", error);
    }
  };

  return (
    <BrandContext.Provider value={{ 
      brands, 
      activeBrandId, 
      brand: activeBrand, 
      activateBrand,
      addBrand,
      removeBrand,
      updateBrand,
      isDirty: false // Firestore is realtime, no dirty state needed
    }}>
      {children}
    </BrandContext.Provider>
  );
};

export const useBrand = () => {
  const context = useContext(BrandContext);
  if (!context) throw new Error('useBrand must be used within a BrandProvider');
  return context;
};