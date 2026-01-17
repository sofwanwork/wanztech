export interface FormField {
    id: string;
    type: 'text' | 'textarea' | 'email' | 'number' | 'date' | 'select' | 'file';
    label: string;
    required: boolean;
    options?: string[]; // For select type
    conditional?: {
        fieldId: string;
        value: string;
    };
}

export interface Form {
    id: string;
    title: string;
    description?: string;
    coverImage?: string;
    thankYouMessage?: string;
    googleSheetUrl?: string;
    fields: FormField[];
    createdAt: string;
    shortCode?: string;
}

export interface Settings {
    googleClientEmail?: string;
    googlePrivateKey?: string;
    googleDriveFolderId?: string;
    userPersonalEmail?: string;
}

export interface Profile {
    id: string;
    username: string;
    full_name?: string;
    avatar_url?: string;
}
