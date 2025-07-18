import { INotificationService } from '../container';

export class NotificationService implements INotificationService {
  showSuccess(message: string): void {
    // For now, just log to console
    console.log('✅ Success:', message);
  }

  showError(message: string): void {
    console.error('❌ Error:', message);
  }

  showWarning(message: string): void {
    console.warn('⚠️ Warning:', message);
  }

  showInfo(message: string): void {
    console.info('ℹ️ Info:', message);
  }

  async requestPermission(): Promise<boolean> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  sendNotification(title: string, message: string): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body: message });
    }
  }
}