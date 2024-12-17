import QRCode from 'qrcode';
import CryptoJS from 'crypto-js';
import { knownFolders, path } from '@nativescript/core';

const SECRET_KEY = 'your-secret-key'; // Replace with a secure key in production

interface QRCodeData {
    userId: string;
    timestamp: number;
    signature: string;
}

class QRCodeService {
    private static instance: QRCodeService;

    private constructor() {}

    public static getInstance(): QRCodeService {
        if (!QRCodeService.instance) {
            QRCodeService.instance = new QRCodeService();
        }
        return QRCodeService.instance;
    }

    private generateSignature(userId: string, timestamp: number): string {
        const data = `${userId}:${timestamp}`;
        return CryptoJS.Hmac('SHA256', SECRET_KEY).update(data).toString();
    }

    private validateSignature(userId: string, timestamp: number, signature: string): boolean {
        const expectedSignature = this.generateSignature(userId, timestamp);
        return expectedSignature === signature;
    }

    async generateQRCode(userId: string): Promise<string> {
        try {
            const timestamp = Date.now();
            const signature = this.generateSignature(userId, timestamp);

            const data: QRCodeData = {
                userId,
                timestamp,
                signature
            };

            const qrCodeData = JSON.stringify(data);
            const documentsPath = knownFolders.documents().path;
            const qrCodePath = path.join(documentsPath, `qr_${userId}.png`);

            await QRCode.toFile(qrCodePath, qrCodeData, {
                errorCorrectionLevel: 'H',
                margin: 1,
                width: 300
            });

            return qrCodePath;
        } catch (error) {
            console.error('Generate QR code error:', error);
            throw error;
        }
    }

    validateQRCode(qrCodeData: string): { isValid: boolean; userId?: string } {
        try {
            const data: QRCodeData = JSON.parse(qrCodeData);
            const { userId, timestamp, signature } = data;

            // Check if QR code is expired (24 hours)
            const isExpired = Date.now() - timestamp > 24 * 60 * 60 * 1000;
            if (isExpired) {
                return { isValid: false };
            }

            // Validate signature
            const isValidSignature = this.validateSignature(userId, timestamp, signature);
            if (!isValidSignature) {
                return { isValid: false };
            }

            return { isValid: true, userId };
        } catch (error) {
            console.error('Validate QR code error:', error);
            return { isValid: false };
        }
    }
}

export const qrcodeService = QRCodeService.getInstance();