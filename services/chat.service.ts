import firestore from '@react-native-firebase/firestore';
import { LanguageCode } from '../constants/languages';

export interface Message {
    id: string;
    senderId: string;
    receiverId: string;
    content: string;
    originalContent: string;
    originalLanguage: LanguageCode;
    translatedLanguage: LanguageCode;
    timestamp: Date;
    status: 'sent' | 'delivered' | 'read';
    isVoiceMessage: boolean;
}

export interface ChatRoom {
    id: string;
    participants: string[];
    lastMessage?: Message;
    lastActivity: Date;
}

class ChatService {
    private static instance: ChatService;
    private readonly chatRoomsCollection = 'chatRooms';
    private readonly messagesCollection = 'messages';

    private constructor() {}

    public static getInstance(): ChatService {
        if (!ChatService.instance) {
            ChatService.instance = new ChatService();
        }
        return ChatService.instance;
    }

    async getChatRoom(userId: string, contactId: string): Promise<ChatRoom> {
        try {
            const participants = [userId, contactId].sort();
            const chatRoomId = `${participants[0]}_${participants[1]}`;

            const chatRoomRef = firestore().collection(this.chatRoomsCollection).doc(chatRoomId);
            const chatRoom = await chatRoomRef.get();

            if (!chatRoom.exists) {
                const newChatRoom: ChatRoom = {
                    id: chatRoomId,
                    participants,
                    lastActivity: new Date()
                };
                await chatRoomRef.set(newChatRoom);
                return newChatRoom;
            }

            return chatRoom.data() as ChatRoom;
        } catch (error) {
            console.error('Get chat room error:', error);
            throw error;
        }
    }

    subscribeToMessages(chatRoomId: string, callback: (messages: Message[]) => void): () => void {
        return firestore()
            .collection(this.messagesCollection)
            .where('chatRoomId', '==', chatRoomId)
            .orderBy('timestamp', 'desc')
            .limit(50)
            .onSnapshot(snapshot => {
                const messages = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Message[];
                callback(messages);
            });
    }

    async sendMessage(
        chatRoomId: string,
        senderId: string,
        receiverId: string,
        content: string,
        originalLanguage: LanguageCode,
        translatedLanguage: LanguageCode,
        isVoiceMessage: boolean = false
    ): Promise<void> {
        try {
            const message: Omit<Message, 'id'> = {
                senderId,
                receiverId,
                content,
                originalContent: content,
                originalLanguage,
                translatedLanguage,
                timestamp: new Date(),
                status: 'sent',
                isVoiceMessage
            };

            const batch = firestore().batch();

            // Add message
            const messageRef = firestore().collection(this.messagesCollection).doc();
            batch.set(messageRef, { ...message, chatRoomId });

            // Update chat room
            const chatRoomRef = firestore().collection(this.chatRoomsCollection).doc(chatRoomId);
            batch.update(chatRoomRef, {
                lastMessage: message,
                lastActivity: message.timestamp
            });

            await batch.commit();
        } catch (error) {
            console.error('Send message error:', error);
            throw error;
        }
    }

    async markMessagesAsRead(chatRoomId: string, userId: string): Promise<void> {
        try {
            const unreadMessages = await firestore()
                .collection(this.messagesCollection)
                .where('chatRoomId', '==', chatRoomId)
                .where('receiverId', '==', userId)
                .where('status', '!=', 'read')
                .get();

            const batch = firestore().batch();
            unreadMessages.docs.forEach(doc => {
                batch.update(doc.ref, { status: 'read' });
            });

            await batch.commit();
        } catch (error) {
            console.error('Mark messages as read error:', error);
            throw error;
        }
    }
}

export const chatService = ChatService.getInstance();