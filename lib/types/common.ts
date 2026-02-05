/**
 * Common type definitions
 */

/**
 * User profile information
 */
export interface Profile {
    id: string;
    username: string;
    full_name?: string;
    avatar_url?: string;
}

/**
 * Application settings (Google integration)
 */
export interface Settings {
    googleClientEmail?: string;
    googlePrivateKey?: string;
    googleDriveFolderId?: string;
    userPersonalEmail?: string;
}
