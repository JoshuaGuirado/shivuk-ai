import React, { createContext, useContext, useState, useEffect } from 'react';
import { LibraryItem, LibraryFolder } from '../types';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy,
  where
} from 'firebase/firestore';

interface LibraryContextType {
  items: LibraryItem[];
  folders: LibraryFolder[];
  addItem: (item: Omit<LibraryItem, 'id' | 'timestamp'>) => void;
  removeItem: (id: string) => void;
  clearLibrary: () => void;
  createFolder: (name: string, brandId?: string) => void;
  deleteFolder: (id: string) => void;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export const LibraryProvider = ({ children }: { children?: React.ReactNode }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [folders, setFolders] = useState<LibraryFolder[]>([]);

  // Subscribe to Firestore Collections when user logs in
  useEffect(() => {
    if (!user) {
      setItems([]);
      setFolders([]);
      return;
    }

    // Subscribe to Items
    const itemsQuery = query(
      collection(db, 'users', user.uid, 'library'),
      orderBy('timestamp', 'desc')
    );
    
    const unsubscribeItems = onSnapshot(itemsQuery, (snapshot) => {
      const loadedItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LibraryItem[];
      setItems(loadedItems);
    });

    // Subscribe to Folders
    const foldersQuery = query(
      collection(db, 'users', user.uid, 'folders'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeFolders = onSnapshot(foldersQuery, (snapshot) => {
        const loadedFolders = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as LibraryFolder[];
        setFolders(loadedFolders);
    });

    return () => {
      unsubscribeItems();
      unsubscribeFolders();
    };
  }, [user]);

  const addItem = async (itemData: Omit<LibraryItem, 'id' | 'timestamp'>) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'users', user.uid, 'library'), {
        ...itemData,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  const removeItem = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'library', id));
    } catch (error) {
      console.error("Error deleting document: ", error);
    }
  };

  const clearLibrary = async () => {
    if (!user) return;
    // Batch delete is recommended for production but loop is fine for small scale/MVP
    items.forEach(async (item) => {
        await removeItem(item.id);
    });
  };

  const createFolder = async (name: string, brandId?: string) => {
    if (!user) return;
    try {
        await addDoc(collection(db, 'users', user.uid, 'folders'), {
            name,
            brandId,
            createdAt: Date.now()
        });
    } catch (error) {
        console.error("Error creating folder: ", error);
    }
  };

  const deleteFolder = async (id: string) => {
    if (!user) return;
    try {
        await deleteDoc(doc(db, 'users', user.uid, 'folders', id));
    } catch (error) {
        console.error("Error deleting folder: ", error);
    }
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