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

export async function getPostById(postId) {
  if (!postId) throw new Error('Post ID obrigatorio');
  const response = await api.get(`/posts/${postId}`);
  return response.data;
}

export async function updatePostWithImage({ postId, title, channel, caption, imageFile, currentImageUrl, clientName, slaHours, actorName }) {
  if (!postId) throw new Error('Post ID obrigatorio');

  let imageUrl = currentImageUrl || '';
  if (imageFile) {
    imageUrl = await uploadImageToCreativeAssets(imageFile);
  }

  const response = await api.patch(`/posts/${postId}`, {
    title,
    channel,
    caption,
    imageUrl,
    clientName: clientName?.trim(),
    slaHours,
    actorName: actorName || 'Agency',
  });

  return response.data;
}
