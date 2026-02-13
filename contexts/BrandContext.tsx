
import React, { createContext, useContext, useState, useEffect } from 'react';

interface BrandColors {
  primary: string;
  secondary: string;
  accent: string;
}

export interface Brand {
  id: string;
  name: string;
  colors: BrandColors;
  logo: string | null; // Logo ativa
  savedLogos: string[]; // Coleção de logos deste cliente
}

interface BrandContextType {
  brands: Brand[]; // Lista de todas as marcas
  activeBrandId: string; // ID da marca sendo usada no momento
  brand: Brand; // Getter de conveniência para a marca ativa (para componentes consumidores)
  
  activateBrand: (id: string) => void;
  addBrand: () => void;
  removeBrand: (id: string) => void;
  updateBrand: (id: string, updates: Partial<Brand>) => void;
  
  saveBrandSettings: () => void;
  isDirty: boolean;
}

const DEFAULT_BRAND_ID = 'default-brand';

const DEFAULT_BRAND: Brand = {
  id: DEFAULT_BRAND_ID,
  name: 'Cliente Principal',
  colors: {
    primary: '#F1B701',
    secondary: '#F8851A',
    accent: '#FFB020',
  },
  logo: null,
  savedLogos: [],
};

const BrandContext = createContext<BrandContextType | undefined>(undefined);

export const BrandProvider = ({ children }: { children?: React.ReactNode }) => {
  // Inicialização de Estado com Migração de Dados Antigos
  const [brands, setBrands] = useState<Brand[]>(() => {
    if (typeof window === 'undefined') return [DEFAULT_BRAND];
    
    const saved = localStorage.getItem('shivuk_brands_v2');
    
    // Se já existe o formato V2 (Array), usa ele
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) { console.error(e); }
    }

    // Se não, tenta migrar o formato V1 (Objeto único)
    const oldSaved = localStorage.getItem('shivuk_brand');
    if (oldSaved) {
      try {
        const parsedOld = JSON.parse(oldSaved);
        // Adapta o objeto antigo para o novo formato com ID
        const migratedBrand: Brand = {
          ...DEFAULT_BRAND,
          ...parsedOld,
          id: DEFAULT_BRAND_ID
        };
        // Garante a estrutura de cores antiga
        if ((parsedOld as any).color) {
            migratedBrand.colors.primary = (parsedOld as any).color;
        }
        return [migratedBrand];
      } catch (e) { console.error(e); }
    }

    return [DEFAULT_BRAND];
  });

  const [activeBrandId, setActiveBrandId] = useState<string>(() => {
    return localStorage.getItem('shivuk_active_brand_id') || (brands[0]?.id || DEFAULT_BRAND_ID);
  });

  const [isDirty, setIsDirty] = useState(false);

  // Helper para pegar a marca ativa atual
  const activeBrand = brands.find(b => b.id === activeBrandId) || brands[0] || DEFAULT_BRAND;

  const activateBrand = (id: string) => {
    setActiveBrandId(id);
    localStorage.setItem('shivuk_active_brand_id', id);
  };

  const addBrand = () => {
    const newId = crypto.randomUUID();
    const newBrand: Brand = {
      id: newId,
      name: 'Novo Cliente',
      colors: { ...DEFAULT_BRAND.colors },
      logo: null,
      savedLogos: []
    };
    const updatedBrands = [...brands, newBrand];
    
    setBrands(updatedBrands);
    setActiveBrandId(newId);
    
    // Auto-Save para criação (UX Melhor)
    localStorage.setItem('shivuk_brands_v2', JSON.stringify(updatedBrands));
    localStorage.setItem('shivuk_active_brand_id', newId);
  };

  const removeBrand = (idToDelete: string) => {
    // 1. Validação de Segurança
    if (brands.length <= 1) {
      alert("Você precisa ter pelo menos um cliente na carteira.");
      return;
    }

    // 2. Filtra a lista removendo o ID alvo
    const updatedBrands = brands.filter(b => b.id !== idToDelete);
    
    // 3. Determina qual será o novo ID ativo se apagarmos o atual
    let nextActiveId = activeBrandId;
    if (idToDelete === activeBrandId) {
      // Se apagou o ativo, seleciona o primeiro da nova lista
      nextActiveId = updatedBrands[0].id;
    }

    // 4. Atualiza Estados
    setBrands(updatedBrands);
    setActiveBrandId(nextActiveId);
    
    // 5. Persistência Imediata (O "Banco de Dados")
    localStorage.setItem('shivuk_brands_v2', JSON.stringify(updatedBrands));
    localStorage.setItem('shivuk_active_brand_id', nextActiveId);
    
    // Reseta estado de "sujo" pois acabamos de salvar
    setIsDirty(false); 
  };

  const updateBrand = (id: string, updates: Partial<Brand>) => {
    setBrands(prev => prev.map(b => {
      if (b.id === id) {
        return { ...b, ...updates };
      }
      return b;
    }));
    setIsDirty(true);
  };

  const saveBrandSettings = () => {
    localStorage.setItem('shivuk_brands_v2', JSON.stringify(brands));
    localStorage.setItem('shivuk_active_brand_id', activeBrandId);
    setIsDirty(false);
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
      saveBrandSettings, 
      isDirty 
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
