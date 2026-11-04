import { Capacitor } from '@capacitor/core';

/**
 * Notifications système Android (barre de notification + son du téléphone),
 * comme un SMS de confirmation. Sans effet dans le navigateur.
 */

const CHANNEL = 'payzed_operations';
let ready: Promise<boolean> | null = null;

async function setup(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  let perm = await LocalNotifications.checkPermissions();
  if (perm.display !== 'granted') perm = await LocalNotifications.requestPermissions();
  if (perm.display !== 'granted') return false;
  // Importance maximale : bandeau en haut de l'écran + son et vibration du téléphone
  await LocalNotifications.createChannel({
    id: CHANNEL,
    name: 'Opérations',
    description: 'Argent reçu, envois, retraits, paiements',
    importance: 5,
    visibility: 1,
    vibration: true,
  });
  return true;
}

/** Demande l'autorisation (Android 13+) et prépare le canal, une seule fois. */
export const ensureNotifications = () => (ready ??= setup().catch(() => false));

/** Identifiant numérique stable dérivé de l'identifiant d'opération. */
const numericId = (key: string) => {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (Math.imul(31, h) + key.charCodeAt(i)) | 0;
  return Math.abs(h) % 2_000_000_000;
};

interface Message {
  title: string;
  body: string;
  /** Texte complet affiché quand la notification est dépliée. */
  details?: string;
}

async function post(key: string, msg: Message, at?: number) {
  if (!(await ensureNotifications())) return;
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  await LocalNotifications.schedule({
    notifications: [
      {
        id: numericId(key),
        channelId: CHANNEL,
        title: msg.title,
        body: msg.body,
        largeBody: msg.details ?? msg.body,
        smallIcon: 'ic_stat_payzed',
        iconColor: '#000000',
        autoCancel: true,
        ...(at ? { schedule: { at: new Date(at), allowWhileIdle: true } } : {}),
      },
    ],
  });
}

/** Notification immédiate. */
export const notifyNow = (key: string, msg: Message) => post(key, msg).catch(() => undefined);

/** Notification programmée (délivrée par Android même si l'app est fermée). */
export const notifyAt = (key: string, msg: Message, at: number) => post(key, msg, at).catch(() => undefined);

export async function cancelNotification(key: string) {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.cancel({ notifications: [{ id: numericId(key) }] });
  } catch {
    // ignore
  }
}

/** Alarmes exactes autorisées ? (sinon Android peut décaler une notification programmée de quelques minutes) */
export async function exactAlarmsAllowed(): Promise<boolean | null> {
  if (!Capacitor.isNativePlatform()) return null;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const r = await LocalNotifications.checkExactNotificationSetting();
    return r.exact_alarm === 'granted';
  } catch {
    return null;
  }
}

export async function openExactAlarmSettings() {
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.changeExactNotificationSetting();
  } catch {
    // ignore
  }
}
