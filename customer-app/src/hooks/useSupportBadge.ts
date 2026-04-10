import { useState, useEffect } from 'react';
import { supabase, supportService } from '../services';
import { useAuthStore } from '../store';

export const useSupportBadge = () => {
    const { user } = useAuthStore();
    const [unreadCount, setUnreadCount] = useState(0);

    const loadUnreadCounts = async () => {
        if (!user?.id) return;
        try {
            const { data: chats } = await supportService.getUserChats(user.id);
            if (chats && chats.length > 0) {
                const totalUnread = chats.reduce((sum: number, chat: any) => sum + (chat.unread_count || 0), 0);
                setUnreadCount(totalUnread);
            } else {
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('Error fetching unread support counts', error);
        }
    };

    useEffect(() => {
        loadUnreadCounts();

        if (!user?.id) return;

        const msgSub = supabase.channel('support-badges')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'support_messages' },
                () => {
                    loadUnreadCounts();
                }
            )
            .subscribe();

        return () => { msgSub.unsubscribe(); };
    }, [user?.id]);

    return { unreadSupportCount: unreadCount, loadUnreadCounts };
};
