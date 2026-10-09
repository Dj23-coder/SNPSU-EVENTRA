import { ExtractedEventData, EventItem } from '../types';

/**
 * Notice Reader: Parse unstructured WhatsApp text into structured event fields
 */
export async function parseNoticeWithGemini(noticeText: string): Promise<ExtractedEventData> {
  const response = await fetch('/api/ai/parse-notice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ noticeText }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to parse notice');
  }

  if (data.error) {
    throw new Error(data.error);
  }

  return data as ExtractedEventData;
}

/**
 * Poster Reader: Read poster image and extract structured event fields
 */
export async function parsePosterWithGemini(
  imageBase64: string,
  mimeType = 'image/jpeg'
): Promise<ExtractedEventData> {
  const response = await fetch('/api/ai/parse-poster', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64, mimeType }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to read poster image');
  }

  if (data.error) {
    throw new Error(data.error);
  }

  return data as ExtractedEventData;
}

/**
 * Ask AI: Answer student queries strictly based on current non-hidden events
 */
export async function askCampusAi(
  question: string,
  events: EventItem[]
): Promise<{ answer: string; matchingEventIds: string[] }> {
  // Pass only relevant, non-hidden event fields to save tokens and preserve privacy
  const sanitizedEvents = events
    .filter(e => !e.hidden && e.status !== 'Cancelled')
    .map(e => ({
      id: e.id,
      title: e.title,
      clubName: e.clubName,
      type: e.eventType,
      date: e.date,
      time: `${e.startTime} - ${e.endTime}`,
      venue: e.venue,
      fee: e.entryFee || 'Free',
      certificate: e.certificateProvided ? 'Yes' : 'No',
      prize: e.prize || 'None',
      status: e.status,
      description: e.shortDescription,
      deadline: e.registrationDeadline || 'Not specified',
    }));

  const response = await fetch('/api/ai/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, events: sanitizedEvents }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to get answer from AI');
  }

  return data;
}

/**
 * Share Text: Generate short, friendly WhatsApp announcement for a club event
 */
export async function generateShareText(event: EventItem): Promise<string> {
  const response = await fetch('/api/ai/share-text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to generate announcement');
  }

  return data.announcement || '';
}

/**
 * Helper to compress image in browser to JPEG/WebP under 200KB
 */
export function compressImageInBrowser(
  file: File,
  maxWidth = 1000,
  maxHeight = 1000,
  quality = 0.8
): Promise<{ dataUrl: string; sizeKb: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        // Estimate size in KB
        const head = 'data:image/jpeg;base64,';
        const sizeKb = Math.round(((dataUrl.length - head.length) * 3) / 4 / 1024);
        resolve({ dataUrl, sizeKb });
      };
      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
