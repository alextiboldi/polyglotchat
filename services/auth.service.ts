import { GoogleSignIn } from '@nativescript/google-signin';
import auth from '@react-native-firebase/auth';
import { firebaseConfig } from '../config/firebase.config';

export interface AuthUser {
    id: string;
    email: string;
    displayName: string;
}

class AuthService {
    private static instance: AuthService;

    private constructor() {
        // Initialize Firebase
        if (!auth().app) {
            auth().initializeApp(firebaseConfig);
        }
    }

    public static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }

    async signInWithGoogle(): Promise<AuthUser> {
        try {
            const googleUser = await GoogleSignIn.signIn();
            if (!googleUser) throw new Error('Google sign in failed');

            // Create Firebase credential
            const credential = auth.GoogleAuthProvider.credential(googleUser.idToken);
            const userCredential = await auth().signInWithCredential(credential);

            return {
                id: userCredential.user.uid,
                email: userCredential.user.email || '',
                displayName: userCredential.user.displayName || ''
            };
        } catch (error) {
            console.error('Auth Service Error:', error);
            throw error;
        }
    }

    async signOut(): Promise<void> {
        try {
            await auth().signOut();
            await GoogleSignIn.signOut();
        } catch (error) {
            console.error('Sign out error:', error);
            throw error;
        }
    }

    getCurrentUser(): AuthUser | null {
        const user = auth().currentUser;
        if (!user) return null;

        return {
            id: user.uid,
            email: user.email || '',
            displayName: user.displayName || ''
        };
    }
}

export const authService = AuthService.getInstance();