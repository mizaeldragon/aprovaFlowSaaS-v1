import api from './api';
import { uploadImageToCreativeAssets } from './storageService';

export async function createPostWithImage({ title, channel, caption, imageFile, clientName, slaHours }) {
  const publicUrl = await uploadImageToCreativeAssets(imageFile);
  const tenantId = localStorage.getItem('aprovaflow-tenant');

  const response = await api.post('/posts', {
    title,
    channel,
    caption,
    slaHours,
    imageUrl: publicUrl,
    tenantId,
    clientName: clientName?.trim(),
  });

  return response.data;
}

export async function improveCopyWithAI(caption, tone) {
  const response = await api.post('/ai/improve-copy', { caption, tone });
  return response.data;
}
