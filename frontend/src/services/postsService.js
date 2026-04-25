import api from './api';
import { uploadCreativeAsset } from './storageService';

export async function createPostWithImage({ title, channel, caption, imageFile, clientName, slaHours }) {
  const media = await uploadCreativeAsset(imageFile);

  const response = await api.post('/posts', {
    title,
    channel,
    caption,
    slaHours,
    imageUrl: media.mediaUrl,
    mediaType: media.mediaType,
    mediaName: media.mediaName,
    mediaSize: media.mediaSize,
    mediaMimeType: media.mediaMimeType,
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
  let media = {};
  if (imageFile) {
    media = await uploadCreativeAsset(imageFile);
    imageUrl = media.mediaUrl;
  }

  const response = await api.patch(`/posts/${postId}`, {
    title,
    channel,
    caption,
    imageUrl,
    mediaType: media.mediaType,
    mediaName: media.mediaName,
    mediaSize: media.mediaSize,
    mediaMimeType: media.mediaMimeType,
    clientName: clientName?.trim(),
    slaHours,
    actorName: actorName || 'Agency',
  });

  return response.data;
}
