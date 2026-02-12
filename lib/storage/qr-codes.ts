import { createClient } from '@/utils/supabase/server';
import { QRCode } from '@/lib/types/qr-codes';
import { QRSettings } from '@/lib/types/forms';

async function getUser() {
    const supabase = await createClient();
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();
    if (error || !user) throw new Error('Unauthorized');
    return { supabase, user };
}

export async function getQRCodes(query?: string, sort?: string): Promise<QRCode[]> {
    const { supabase, user } = await getUser();

    let queryBuilder = supabase
        .from('qr_codes')
        .select('*')
        .eq('user_id', user.id);

    if (query) {
        queryBuilder = queryBuilder.ilike('title', `%${query}%`);
    }

    // Initial sort from DB - but we might refine in JS for consistency with Forms
    // Default to newest
    queryBuilder = queryBuilder.order('created_at', { ascending: false });

    const { data, error } = await queryBuilder;

    if (error) {
        console.error('Error fetching QR codes:', JSON.stringify(error, null, 2));
        return [];
    }

    let qrCodes = data.map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        title: row.title,
        content: row.content,
        settings: row.settings as QRSettings,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    }));

    // Apply manual sorting if needed (though DB is better for large datasets)
    // Replicating the logic from forms/page.tsx for consistency
    if (sort) {
        qrCodes = qrCodes.sort((a: QRCode, b: QRCode) => {
            switch (sort) {
                case 'oldest':
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                case 'az':
                    return a.title.localeCompare(b.title);
                case 'za':
                    return b.title.localeCompare(a.title);
                case 'newest':
                default:
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
        });
    }

    return qrCodes;
}

export async function getQRCodeById(id: string): Promise<QRCode | undefined> {
    const { supabase, user } = await getUser();

    const { data, error } = await supabase
        .from('qr_codes')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

    if (error || !data) return undefined;

    return {
        id: data.id,
        userId: data.user_id,
        title: data.title,
        content: data.content,
        settings: data.settings as QRSettings,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
    };
}

export async function getUserQRCodeCount(userId: string): Promise<number> {
    const supabase = await createClient();
    const { count, error } = await supabase
        .from('qr_codes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

    if (error) {
        console.error('Error getting QR code count:', error);
        return 0;
    }
    return count || 0;
}

export async function saveQRCode(qr: Partial<QRCode> & { content: string; title: string }): Promise<string> {
    const { supabase, user } = await getUser();

    // Input Validation
    if (qr.title && qr.title.length > 100) {
        throw new Error('Title is too long (max 100 characters)');
    }
    if (qr.content && qr.content.length > 2000) {
        throw new Error('Content is too long (max 2000 characters)');
    }

    const dataToSave = {
        user_id: user.id,
        title: qr.title,
        content: qr.content,
        settings: qr.settings || {},
        updated_at: new Date().toISOString(),
    };

    let result;
    if (qr.id) {
        // Update
        result = await supabase
            .from('qr_codes')
            .update(dataToSave)
            .eq('id', qr.id)
            .eq('user_id', user.id)
            .select()
            .single();
    } else {
        // Insert
        result = await supabase
            .from('qr_codes')
            .insert(dataToSave)
            .select()
            .single();
    }

    if (result.error) throw result.error;
    return result.data.id;
}

export async function deleteQRCode(id: string): Promise<void> {
    const { supabase, user } = await getUser();
    const { error } = await supabase
        .from('qr_codes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) throw error;
}
