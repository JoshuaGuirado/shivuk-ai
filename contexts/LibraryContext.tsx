
import React, { createContext, useContext, useState, useEffect } from 'react';
import { LibraryItem, LibraryFolder } from '../types';

interface LibraryContextType {
  items: LibraryItem[];
  folders: LibraryFolder[];
  addItem: (item: Omit<LibraryItem, 'id' | 'timestamp'>) => void;
  removeItem: (id: string) => void;
  clearLibrary: () => void;
  createFolder: (name: string, brandId?: string) => void;
  deleteFolder: (id: string) => void;
}

const DEFAULT_ITEMS: LibraryItem[] = [];
const DEFAULT_FOLDERS: LibraryFolder[] = [];

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export const LibraryProvider = ({ children }: { children?: React.ReactNode }) => {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [folders, setFolders] = useState<LibraryFolder[]>([]);

  // Load Items
  useEffect(() => {
    const saved = localStorage.getItem('shivuk_library');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setItems(parsed);
      } catch (e) {
        console.error("Failed to load library", e);
      }
    } else {
      setItems(DEFAULT_ITEMS);
      localStorage.setItem('shivuk_library', JSON.stringify(DEFAULT_ITEMS));
    }
  }, []);

  // Load Folders
  useEffect(() => {
    const savedFolders = localStorage.getItem('shivuk_library_folders');
    if (savedFolders) {
      try {
        const parsed = JSON.parse(savedFolders);
        setFolders(parsed);
      } catch (e) {
        console.error("Failed to load folders", e);
      }
    }
  }, []);

  const addItem = (itemData: Omit<LibraryItem, 'id' | 'timestamp'>) => {
    const newItem: LibraryItem = {
      ...itemData,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    setItems((prev) => {
      const newItems = [newItem, ...prev];
      localStorage.setItem('shivuk_library', JSON.stringify(newItems));
      return newItems;
    });
  };

  const removeItem = (id: string) => {
    setItems((prev) => {
      const newItems = prev.filter((item) => item.id !== id);
      localStorage.setItem('shivuk_library', JSON.stringify(newItems));
      return newItems;
    });
  };

  const clearLibrary = () => {
    setItems([]);
    setFolders([]);
    localStorage.removeItem('shivuk_library');
    localStorage.removeItem('shivuk_library_folders');
  };

  const createFolder = (name: string, brandId?: string) => {
    const newFolder: LibraryFolder = {
      id: crypto.randomUUID(),
      name,
      brandId,
      createdAt: Date.now()
    };
    setFolders(prev => {
      const updated = [...prev, newFolder];
      localStorage.setItem('shivuk_library_folders', JSON.stringify(updated));
      return updated;
    });
  };

  const deleteFolder = (id: string) => {
    setFolders(prev => {
      const updated = prev.filter(f => f.id !== id);
      localStorage.setItem('shivuk_library_folders', JSON.stringify(updated));
      return updated;
    });
    // Optional: Move items inside this folder back to root or delete them?
    // Current behavior: Items remain but folderId points to nothing (effectively root or orphan)
  };

  return (
    <LibraryContext.Provider value={{ items, folders, addItem, removeItem, clearLibrary, createFolder, deleteFolder }}>
      {children}
    </LibraryContext.Provider>
  );
};

export const useLibrary = () => {
  const context = useContext(LibraryContext);
  if (!context) throw new Error('useLibrary must be used within a LibraryProvider');
  return context;
};
