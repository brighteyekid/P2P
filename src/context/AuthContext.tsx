import { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { User } from '../types';
import { createUserDocument, getUserById, updateUserProfile as updateFirestoreProfile } from '../services/firestore';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user data from Firestore when auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      
      if (user) {
        try {
          // Fetch user data from Firestore
          let userDoc = await getUserById(user.uid);
          
          // If user document doesn't exist in Firestore but we have a Firebase auth user
          if (!userDoc) {
            console.log("User document doesn't exist in Firestore, creating it");
            // Create initial user data in Firestore
            const newUser: User = {
              id: user.uid,
              email: user.email!,
              displayName: user.displayName || 'User',
              skills: [],
              desiredSkills: [],
              rating: 0,
              connections: [],
              connectionRequests: [],
            };
            
            await createUserDocument(newUser);
            userDoc = newUser;
          }
          
          setUserData(userDoc);
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(user, { displayName });
      
      // Create initial user data in Firestore
      const newUser: User = {
        id: user.uid,
        email: user.email!,
        displayName: displayName,
        skills: [],
        desiredSkills: [],
        rating: 0,
        connections: [],
        connectionRequests: [],
      };
      
      await createUserDocument(newUser);
      setUserData(newUser);
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      
      // Fetch user data from Firestore
      let userDoc = await getUserById(user.uid);
      
      // If user document doesn't exist in Firestore
      if (!userDoc) {
        console.log("User document doesn't exist in Firestore for existing user, creating it");
        // Create user data with available information
        const newUser: User = {
          id: user.uid,
          email: user.email!,
          displayName: user.displayName || 'User',
          skills: [],
          desiredSkills: [],
          rating: 0,
          connections: [],
          connectionRequests: [],
        };
        
        await createUserDocument(newUser);
        userDoc = newUser;
      }
      
      setUserData(userDoc);
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUserData(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const updateUserProfile = async (data: Partial<User>) => {
    if (!currentUser) return;
    
    try {
      // Update in Firestore
      await updateFirestoreProfile(currentUser.uid, data);
      
      // Update local state
      setUserData((prev) => prev ? { ...prev, ...data } : null);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const value = {
    currentUser,
    userData,
    loading,
    signUp,
    signIn,
    signOut,
    updateUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 