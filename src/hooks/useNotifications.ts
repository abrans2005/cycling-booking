import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { Booking, BookingNotification } from '@/types';

// 调试信息
console.log('[Notifications] Hook loaded');

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<BookingNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasInteracted = useRef(false);

  // 初始化音频（需要用户交互后才能播放）
  useEffect(() => {
    const initAudio = () => {
      if (!audioRef.current) {
        audioRef.current = new Audio('/notification.mp3');
      }
      hasInteracted.current = true;
    };
    document.addEventListener('click', initAudio, { once: true });
    return () => document.removeEventListener('click', initAudio);
  }, []);

  // 播放提示音
  const playNotificationSound = useCallback(() => {
    if (audioRef.current && hasInteracted.current) {
      audioRef.current.play().catch(() => {
        // 忽略自动播放限制错误
      });
    }
  }, []);

  // 从 localStorage 加载已保存的通知
  useEffect(() => {
    const saved = localStorage.getItem('booking-notifications');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setNotifications(parsed);
        setUnreadCount(parsed.filter((n: BookingNotification) => !n.read).length);
      } catch {
        // 忽略解析错误
      }
    }
  }, []);

  // 保存通知到 localStorage
  useEffect(() => {
    localStorage.setItem('booking-notifications', JSON.stringify(notifications));
    setUnreadCount(notifications.filter(n => !n.read).length);
  }, [notifications]);

  // 添加新通知
  const addNotification = useCallback((booking: Booking) => {
    const newNotification: BookingNotification = {
      id: `${booking.id}-${Date.now()}`,
      bookingId: booking.id,
      title: '新的预约',
      content: `${booking.memberName} 预约了 ${booking.stationId}号骑行台`,
      memberName: booking.memberName,
      memberPhone: booking.memberPhone,
      stationId: booking.stationId,
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      read: false,
      createdAt: new Date().toISOString(),
    };

    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // 最多保留50条
    playNotificationSound();
  }, [playNotificationSound]);

  // 标记为已读
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
  }, []);

  // 标记所有为已读
  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  }, []);

  // 删除通知
  const removeNotification = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.filter(n => n.id !== notificationId)
    );
  }, []);

  // 清空所有通知
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // 切换面板开关
  const toggleOpen = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const closePanel = useCallback(() => {
    setIsOpen(false);
  }, []);

  // 监听 Supabase Realtime 新预约
  useEffect(() => {
    if (!supabase) {
      console.log('[Notifications] Supabase not available, skipping realtime subscription');
      return;
    }

    console.log('[Notifications] Setting up realtime subscription...');

    const channel = supabase
      .channel('booking-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bookings',
        },
        (payload) => {
          console.log('[Notifications] Received new booking:', payload);
          const newBooking = payload.new as Booking;
          // 只处理今天的预约
          const today = new Date().toISOString().split('T')[0];
          console.log('[Notifications] Today:', today, 'Booking date:', newBooking.date);
          if (newBooking.date === today && newBooking.status === 'confirmed') {
            console.log('[Notifications] Adding notification for booking:', newBooking.id);
            addNotification(newBooking);
          }
        }
      )
      .subscribe((status) => {
        console.log('[Notifications] Subscription status:', status);
      });

    return () => {
      console.log('[Notifications] Unsubscribing from realtime...');
      channel.unsubscribe();
    };
  }, [addNotification]);

  return {
    notifications,
    unreadCount,
    isOpen,
    toggleOpen,
    closePanel,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    addNotification,
  };
};
