import firestore from '@react-native-firebase/firestore';
import { AuthUser } from './auth.service';

export interface UserProfile extends AuthUser {
    nativeLanguage: string;
    createdAt: Date;
    lastActive: Date;
}

class UserService {
    private static instance: UserService;
    private readonly usersCollection = 'users';

    private constructor() {}

    public static getInstance(): UserService {
        if (!UserService.instance) {
            UserService.instance = new UserService();
        }
        return UserService.instance;
    }

    async createUserProfile(user: AuthUser, nativeLanguage: string): Promise<void> {
        try {
            const userProfile: UserProfile = {
                ...user,
                nativeLanguage,
                createdAt: new Date(),
                lastActive: new Date()
            };

            await firestore()
                .collection(this.usersCollection)
                .doc(user.id)
                .set(userProfile);
        } catch (error) {
            console.error('Create user profile error:', error);
            throw error;
        }
    }

    async getUserProfile(userId: string): Promise<UserProfile | null> {
        try {
            const doc = await firestore()
                .collection(this.usersCollection)
                .doc(userId)
                .get();

            return doc.exists ? (doc.data() as UserProfile) : null;
        } catch (error) {
            console.error('Get user profile error:', error);
            throw error;
        }
    }

    async updateUserLanguage(userId: string, language: string): Promise<void> {
        try {
            await firestore()
                .collection(this.usersCollection)
                .doc(userId)
                .update({
                    nativeLanguage: language,
                    lastActive: new Date()
                });
        } catch (error) {
            console.error('Update language error:', error);
            throw error;
        }
    }
}

export const userService = UserService.getInstance();