import firestore from '@react-native-firebase/firestore';
import { UserProfile } from './user.service';

export interface Contact extends UserProfile {
    status: 'pending' | 'accepted' | 'blocked';
    lastSeen: Date;
    isOnline: boolean;
}

class ContactsService {
    private static instance: ContactsService;
    private readonly contactsCollection = 'contacts';

    private constructor() {}

    public static getInstance(): ContactsService {
        if (!ContactsService.instance) {
            ContactsService.instance = new ContactsService();
        }
        return ContactsService.instance;
    }

    async getContacts(userId: string): Promise<Contact[]> {
        try {
            const snapshot = await firestore()
                .collection(this.contactsCollection)
                .where('userId', '==', userId)
                .where('status', '==', 'accepted')
                .get();

            return snapshot.docs.map(doc => doc.data() as Contact);
        } catch (error) {
            console.error('Get contacts error:', error);
            throw error;
        }
    }

    async deleteContact(userId: string, contactId: string): Promise<void> {
        try {
            await firestore()
                .collection(this.contactsCollection)
                .doc(`${userId}_${contactId}`)
                .delete();
        } catch (error) {
            console.error('Delete contact error:', error);
            throw error;
        }
    }

    async blockContact(userId: string, contactId: string): Promise<void> {
        try {
            await firestore()
                .collection(this.contactsCollection)
                .doc(`${userId}_${contactId}`)
                .update({
                    status: 'blocked',
                    updatedAt: new Date()
                });
        } catch (error) {
            console.error('Block contact error:', error);
            throw error;
        }
    }
}

export const contactsService = ContactsService.getInstance();