// Support Chat Service - handles live chat between customers and admin
import { supabase, TABLES } from './supabase';

export interface SupportChat {
    id: string;
    user_id: string;
    subject: string;
    status: 'open' | 'closed';
    created_at: string;
    updated_at: string;
    // joined fields
    user?: { full_name: string; email: string };
    lastMessage?: SupportMessage;
    unread_count?: number;
}

export interface SupportMessage {
    id: string;
    chat_id: string;
    sender_id: string;
    sender_role: 'customer' | 'admin';
    message: string;
    is_read: boolean;
    created_at: string;
}

class SupportService {
    // Create or get existing open chat for a user
    async getOrCreateChat(userId: string, subject: string = 'General Support'): Promise<{ data: SupportChat | null; error: string | null }> {
        try {
            // First try to find an existing open chat
            const { data: existing } = await supabase
                .from(TABLES.SUPPORT_CHATS)
                .select('*')
                .eq('user_id', userId)
                .eq('status', 'open')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (existing) return { data: existing, error: null };

            // Create new chat
            const { data, error } = await supabase
                .from(TABLES.SUPPORT_CHATS)
                .insert({ user_id: userId, subject, status: 'open' })
                .select()
                .single();

            if (error) return { data: null, error: error.message };
            return { data, error: null };
        } catch (error: any) {
            return { data: null, error: error.message };
        }
    }

    // Get all chats for admin with user info
    async getAllChats(): Promise<{ data: SupportChat[] | null; error: string | null }> {
        try {
            const { data, error } = await supabase
                .from(TABLES.SUPPORT_CHATS)
                .select(`
                    *,
                    user:user_id(full_name, email),
                    messages:${TABLES.SUPPORT_MESSAGES}(id, message, created_at, sender_role, is_read)
                `)
                .order('updated_at', { ascending: false });

            if (error) return { data: null, error: error.message };

            // Shape data to match SupportChat with lastMessage
            const shaped = (data || []).map((chat: any) => ({
                ...chat,
                user: Array.isArray(chat.user) ? chat.user[0] : chat.user,
                lastMessage: chat.messages?.sort((a: any, b: any) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                )[0],
                unread_count: chat.messages?.filter((m: any) => !m.is_read && m.sender_role === 'customer').length || 0,
            }));

            return { data: shaped, error: null };
        } catch (error: any) {
            return { data: null, error: error.message };
        }
    }

    // Get user's own chats with unread count
    async getUserChats(userId: string): Promise<{ data: SupportChat[] | null; error: string | null }> {
        try {
            const { data, error } = await supabase
                .from(TABLES.SUPPORT_CHATS)
                .select(`
                    *,
                    messages:${TABLES.SUPPORT_MESSAGES}(is_read, sender_role)
                `)
                .eq('user_id', userId)
                .order('updated_at', { ascending: false });

            if (error) return { data: null, error: error.message };
            
            // Calculate unread_count from admin messages
            const shaped = (data || []).map((chat: any) => ({
                ...chat,
                unread_count: chat.messages?.filter((m: any) => !m.is_read && m.sender_role === 'admin').length || 0,
            }));

            return { data: shaped, error: null };
        } catch (error: any) {
            return { data: null, error: error.message };
        }
    }

    // Get messages for a chat
    async getMessages(chatId: string): Promise<{ data: SupportMessage[] | null; error: string | null }> {
        try {
            const { data, error } = await supabase
                .from(TABLES.SUPPORT_MESSAGES)
                .select('*')
                .eq('chat_id', chatId)
                .order('created_at', { ascending: true });

            if (error) return { data: null, error: error.message };
            return { data, error: null };
        } catch (error: any) {
            return { data: null, error: error.message };
        }
    }

    // Send a message
    async sendMessage(
        chatId: string,
        senderId: string,
        message: string,
        senderRole: 'customer' | 'admin'
    ): Promise<{ data: SupportMessage | null; error: string | null }> {
        try {
            const { data, error } = await supabase
                .from(TABLES.SUPPORT_MESSAGES)
                .insert({
                    chat_id: chatId,
                    sender_id: senderId,
                    message: message.trim(),
                    sender_role: senderRole,
                    is_read: false,
                })
                .select()
                .single();

            if (error) return { data: null, error: error.message };

            // Update chat updated_at so it bubbles to top
            await supabase
                .from(TABLES.SUPPORT_CHATS)
                .update({ updated_at: new Date().toISOString() })
                .eq('id', chatId);

            return { data, error: null };
        } catch (error: any) {
            return { data: null, error: error.message };
        }
    }

    // Mark messages as read in a chat (by the other side)
    async markMessagesRead(chatId: string, readerRole: 'customer' | 'admin'): Promise<void> {
        const senderRole = readerRole === 'customer' ? 'admin' : 'customer';
        await supabase
            .from(TABLES.SUPPORT_MESSAGES)
            .update({ is_read: true })
            .eq('chat_id', chatId)
            .eq('sender_role', senderRole)
            .eq('is_read', false);
    }

    // Subscribe to new messages in a chat
    subscribeToMessages(chatId: string, callback: (message: SupportMessage) => void) {
        return supabase
            .channel(`chat-${chatId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: TABLES.SUPPORT_MESSAGES,
                    filter: `chat_id=eq.${chatId}`,
                },
                (payload) => {
                    callback(payload.new as SupportMessage);
                }
            )
            .subscribe();
    }

    // Subscribe to all chats (for admin dashboard)
    subscribeToAllChats(callback: () => void) {
        return supabase
            .channel('all-chats')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: TABLES.SUPPORT_CHATS },
                callback
            )
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: TABLES.SUPPORT_MESSAGES },
                callback
            )
            .subscribe();
    }

    // Close a chat (admin action)
    async closeChat(chatId: string): Promise<{ error: string | null }> {
        try {
            const { error } = await supabase
                .from(TABLES.SUPPORT_CHATS)
                .update({ status: 'closed', updated_at: new Date().toISOString() })
                .eq('id', chatId);

            if (error) return { error: error.message };
            return { error: null };
        } catch (error: any) {
            return { error: error.message };
        }
    }
}

export const supportService = new SupportService();
export default supportService;
