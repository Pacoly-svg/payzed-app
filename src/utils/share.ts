import { Capacitor } from '@capacitor/core';

/** Partage de texte : feuille de partage Android dans l'APK, Web Share ou presse-papiers sinon. */
export async function shareText(title: string, text: string): Promise<'shared' | 'copied' | 'cancelled'> {
  try {
    if (Capacitor.isNativePlatform()) {
      const { Share } = await import('@capacitor/share');
      await Share.share({ title, text, dialogTitle: title });
      return 'shared';
    }
    if (navigator.share) {
      await navigator.share({ title, text });
      return 'shared';
    }
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch {
    return 'cancelled';
  }
}

/** Partage d'une image PNG (data URL) : WhatsApp, galerie, e-mail… */
export async function shareImage(dataUrl: string, fileName: string, title: string): Promise<'shared' | 'downloaded' | 'cancelled'> {
  try {
    if (Capacitor.isNativePlatform()) {
      const [{ Filesystem, Directory }, { Share }] = await Promise.all([import('@capacitor/filesystem'), import('@capacitor/share')]);
      const saved = await Filesystem.writeFile({
        path: fileName,
        data: dataUrl.split(',')[1],
        directory: Directory.Cache,
      });
      await Share.share({ title, files: [saved.uri], dialogTitle: title });
      return 'shared';
    }
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], fileName, { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ title, files: [file] });
      return 'shared';
    }
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = fileName;
    a.click();
    return 'downloaded';
  } catch {
    return 'cancelled';
  }
}
