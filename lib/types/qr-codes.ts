import { QRSettings } from './forms';

export interface QRCode {
    id: string;
    userId: string;
    title: string;
    content: string;
    settings: QRSettings;
    createdAt: string;
    updatedAt: string;
}
