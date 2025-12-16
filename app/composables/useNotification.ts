import { ref, h, render } from 'vue';
import type { VNode } from 'vue';
import Notification from '~/components/ui/Notification.vue';
import type { NotificationProps } from '~/components/ui/Notification.vue';

interface NotificationInstance {
  id: number;
  vnode: VNode;
  container: HTMLDivElement;
}

const notifications = ref<NotificationInstance[]>([]);
let notificationId = 0;

export const useNotification = () => {
  const show = (options: NotificationProps) => {
    const id = notificationId++;
    const container = document.createElement('div');
    document.body.appendChild(container);

    const onClose = () => {
      // Удаляем уведомление из списка
      const index = notifications.value.findIndex((n) => n.id === id);
      if (index > -1) {
        const notification = notifications.value[index];
        if (notification) {
          render(null, notification.container);
          document.body.removeChild(notification.container);
          notifications.value.splice(index, 1);
        }
      }
    };

    const vnode = h(Notification, {
      ...options,
      onClose,
    });

    render(vnode, container);

    notifications.value.push({
      id,
      vnode,
      container,
    });

    return {
      close: onClose,
    };
  };

  const success = (message: string, title?: string, duration?: number) => {
    return show({
      type: 'success',
      message,
      title,
      duration,
    });
  };

  const error = (message: string, title?: string, duration?: number) => {
    return show({
      type: 'error',
      message,
      title,
      duration,
    });
  };

  const warning = (message: string, title?: string, duration?: number) => {
    return show({
      type: 'warning',
      message,
      title,
      duration,
    });
  };

  const info = (message: string, title?: string, duration?: number) => {
    return show({
      type: 'info',
      message,
      title,
      duration,
    });
  };

  const closeAll = () => {
    notifications.value.forEach((notification) => {
      render(null, notification.container);
      document.body.removeChild(notification.container);
    });
    notifications.value = [];
  };

  return {
    show,
    success,
    error,
    warning,
    info,
    closeAll,
  };
};
