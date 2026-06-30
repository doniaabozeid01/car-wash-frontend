const DEFAULT_COUNTRY_CODE = '20';

export function formatPhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, '');

  if (digits.startsWith(DEFAULT_COUNTRY_CODE)) {
    return digits;
  }

  if (digits.startsWith('0')) {
    return `${DEFAULT_COUNTRY_CODE}${digits.slice(1)}`;
  }

  return `${DEFAULT_COUNTRY_CODE}${digits}`;
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
