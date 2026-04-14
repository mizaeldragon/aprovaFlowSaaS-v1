import api from './api';
import { uploadImageToCreativeAssets } from './storageService';

export async function createPostWithImage({ title, channel, caption, imageFile }) {
  const publicUrl = await uploadImageToCreativeAssets(imageFile);
  const tenantId = localStorage.getItem('aprovaflow-tenant');

  const response = await api.post('/posts', {
    title,
    channel,
    caption,
    imageUrl: publicUrl,
    tenantId, 
    clientName: 'Meu Cliente'
  });

  return response.data;
}

export async function improveCopyWithAI(caption, tone) {
  const response = await api.post('/ai/improve-copy', { caption, tone });
  return response.data;
}
