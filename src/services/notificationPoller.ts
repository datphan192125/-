import { AppNotification } from '../types';
import { storageService } from './storage';

export type NotificationListener = (notifications: AppNotification[], newAlert?: AppNotification) => void;

class NotificationPoller {
  private intervalId: number | null = null;
  private pollIntervalMs: number = 30000; // 30 seconds as specified in spec
  private listeners: Set<NotificationListener> = new Set();
  private lastKnownCount: number = 0;
  private isTabVisible: boolean = true;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initVisibilityListener();
    }
  }

  private initVisibilityListener() {
    document.addEventListener('visibilitychange', () => {
      this.isTabVisible = !document.hidden;
      if (this.isTabVisible) {
        // Tab became visible again, trigger immediate poll
        this.poll();
        this.start();
      } else {
        // Tab is hidden, stop polling to save CPU & battery
        this.stop();
      }
    });
  }

  public start() {
    if (this.intervalId !== null) return;
    // Initial check
    this.poll();

    this.intervalId = window.setInterval(() => {
      if (this.isTabVisible) {
        this.poll();
      }
    }, this.pollIntervalMs);
  }

  public stop() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public poll() {
    const notifications = storageService.getNotifications();
    const currentUserId = storageService.getCurrentUserId();

    // Filter relevant notifications for current user or 'all'
    const relevant = notifications.filter(
      (n) => n.user_id === 'all' || n.user_id === currentUserId
    );

    let latestNewAlert: AppNotification | undefined = undefined;
    if (this.lastKnownCount > 0 && relevant.length > this.lastKnownCount) {
      // New notification arrived
      latestNewAlert = relevant[0];
    }
    this.lastKnownCount = relevant.length;

    this.listeners.forEach((listener) => {
      listener(relevant, latestNewAlert);
    });
  }

  public subscribe(listener: NotificationListener): () => void {
    this.listeners.add(listener);
    // Send immediate current state
    const currentUserId = storageService.getCurrentUserId();
    const relevant = storageService
      .getNotifications()
      .filter((n) => n.user_id === 'all' || n.user_id === currentUserId);
    listener(relevant);

    return () => {
      this.listeners.delete(listener);
    };
  }

  public notifyNewItem(item: Omit<AppNotification, 'id' | 'created_at' | 'is_read'>) {
    const list = storageService.getNotifications();
    const newNotif: AppNotification = {
      ...item,
      id: `notif-${Date.now()}`,
      created_at: new Date().toISOString(),
      is_read: false,
    };
    list.unshift(newNotif);
    storageService.saveNotifications(list);
    this.poll();
  }
}

export const notificationPoller = new NotificationPoller();
