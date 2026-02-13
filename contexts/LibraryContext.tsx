import React, { createContext, useContext, useState, useEffect } from 'react';
import { LibraryItem, LibraryFolder } from '../types';
import { db, storage } from '../config/firebase';
import { useAuth } from './AuthContext';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy
} from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

interface LibraryContextType {
  items: LibraryItem[];
  folders: LibraryFolder[];
  addItem: (item: Omit<LibraryItem, 'id' | 'timestamp'>) => Promise<void>;
  removeItem: (id: string) => void;
  clearLibrary: () => void;
  createFolder: (name: string, brandId?: string) => Promise<void>;
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

    try {
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
        }, (err) => {
            console.error("Library Subscription Error:", err);
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
        }, (err) => {
            console.error("Folder Subscription Error:", err);
        });

        return () => {
        unsubscribeItems();
        unsubscribeFolders();
        };
    } catch (e) {
        console.error("Error setting up listeners", e);
    }
  }, [user]);

  const addItem = async (itemData: Omit<LibraryItem, 'id' | 'timestamp'>) => {
    if (!user) {
        console.error("Cannot add item: No user logged in");
        return;
    }

    let finalImageUrl = itemData.imageUrl;

    // Handle Image Upload to Storage if Base64
    if (finalImageUrl && finalImageUrl.startsWith('data:')) {
        try {
            const fileName = `library/${Date.now()}_${Math.random().toString(36).substring(7)}.png`;
            const storageRef = ref(storage, `users/${user.uid}/${fileName}`);
            
            // Upload
            await uploadString(storageRef, finalImageUrl, 'data_url');
            
            // Get URL
            finalImageUrl = await getDownloadURL(storageRef);
        } catch (storageError) {
            console.error("Error uploading to storage:", storageError);
            // Fallback: try to save keeping null if upload fails to avoid firestore crash
            // or keep base64 if small (risk)
        }
    }

    try {
      await addDoc(collection(db, 'users', user.uid, 'library'), {
        ...itemData,
        imageUrl: finalImageUrl,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error("Error adding document to library: ", error);
      if (error.toString().includes("exceeded")) {
          alert("Erro: O item é muito grande para salvar. Tente uma imagem menor.");
      }
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
    items.forEach(async (item) => {
        await removeItem(item.id);
    });
  };

  const createFolder = async (name: string, brandId?: string) => {
    if (!user) {
        console.error("Cannot create folder: User not logged in");
        return;
    }
    try {
        await addDoc(collection(db, 'users', user.uid, 'folders'), {
            name,
            brandId: brandId || null,
            createdAt: Date.now()
        });
    } catch (error) {
        console.error("Error creating folder in Firestore: ", error);
        throw error; // Re-throw to UI
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