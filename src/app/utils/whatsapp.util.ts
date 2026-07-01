export function formatPhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, '');

  if (!digits) {
    return '';
  }

  // International format already includes country code (e.g. 966..., 201..., 971...)
  if (!digits.startsWith('0') && digits.length >= 11) {
    return digits;
  }

  // Egyptian mobile: 01xxxxxxxxx
  if (/^01\d{9}$/.test(digits)) {
    return `20${digits.slice(1)}`;
  }

  // Saudi mobile: 05xxxxxxxx
  if (/^05\d{8}$/.test(digits)) {
    return `966${digits.slice(1)}`;
  }

  // Egyptian without leading 0: 1xxxxxxxxx
  if (/^1\d{9}$/.test(digits)) {
    return `20${digits}`;
  }

  // Other local numbers with trunk prefix 0
  if (digits.startsWith('0')) {
    return digits.slice(1);
  }

  return digits;
}

export function buildPointsAddedWhatsAppMessage(pointsAdded: number): string {
  return `✨ شكرًا لاختيارك مغسلة *Full Cars*.

تمت إضافة *${pointsAdded} نقطة* إلى رصيد نقاطك بنجاح بعد غسيل سيارتك.

نقدّر ثقتك بنا، ونتطلع لخدمتك مرة أخرى. استمر في جمع النقاط واستمتع بمزايا ومكافآت حصرية.

*Full Cars*... لأن سيارتك تستحق الأفضل. 🚗✨`;
}

export function openWhatsAppChat(phone: string, message: string): void {
  const normalizedPhone = formatPhoneForWhatsApp(phone);
  const url = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}
