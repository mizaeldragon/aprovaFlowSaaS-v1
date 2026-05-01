import api from './api';

const mapPostToUI = (post) => ({
  ...post,
  id: post.id,
  created_at: post.createdAt,
  updated_at: post.updatedAt,
  image_url: post.imageUrl,
  media_url: post.imageUrl,
  media_type: post.mediaType || 'IMAGE',
  media_name: post.mediaName || '',
  media_size: post.mediaSize || 0,
  media_mime_type: post.mediaMimeType || '',
  // FIX [CRÍTICO]: usar publicToken como identificador público — não o UUID do post
  public_slug: post.publicToken || post.id,
  tasks: post.tasks || [],
  approval_events: post.approvalEvents || [],
  due_at: post.dueAt || null,
  sla_hours: post.slaHours || 48,
  published_at: post.publishedAt || null,
  status: post.status === 'PENDING' ? 'pending' : post.status === 'APPROVED' ? 'approved' : 'changes_requested'
});

const mapCommentToUI = (comment) => ({
  ...comment,
  created_at: comment.createdAt,
  author_name: comment.author,
  comment: comment.text,
  action: 'comment'
});

export async function listPosts() {
  const res = await api.get('/posts');
  return res.data.map(mapPostToUI);
}

export async function listCommentsByPostId(postId) {
  if (!postId) return [];
  const res = await api.get(`/posts/${postId}`);
  return (res.data.comments || []).map(mapCommentToUI);
}

export async function updatePostById(postId, payload) {
  const editableFields = ['title', 'channel', 'caption', 'clientName', 'image_url', 'media_type', 'media_name', 'media_size', 'media_mime_type'];
  const hasEditableFields = editableFields.some((field) => Object.prototype.hasOwnProperty.call(payload, field));

  if (payload.status && !hasEditableFields) {
    const dbStatus = payload.status === 'approved' ? 'APPROVED' : payload.status === 'changes_requested' ? 'ADJUSTMENT' : 'PENDING';
    const res = await api.patch(`/posts/${postId}/status`, { status: dbStatus, actorName: payload.actorName || 'Agency' });
    return mapPostToUI(res.data);
  }

  const res = await api.patch(`/posts/${postId}`, {
    title: payload.title,
    channel: payload.channel,
    caption: payload.caption,
    clientName: payload.clientName,
    imageUrl: payload.image_url || payload.media_url,
    mediaType: payload.media_type,
    mediaName: payload.media_name,
    mediaSize: payload.media_size,
    mediaMimeType: payload.media_mime_type,
    slaHours: payload.sla_hours,
    actorName: payload.actorName || 'Agency',
  });
  return mapPostToUI(res.data);
}

export async function deletePostById(postId) {
  await api.delete(`/posts/${postId}`);
}

export async function createPost(payload) {
  if (!payload?.clientName || !String(payload.clientName).trim()) {
    throw new Error('Nome do cliente obrigatorio');
  }
  const res = await api.post('/posts', {
    ...payload,
    clientName: String(payload.clientName).trim(),
    imageUrl: payload.image_url || payload.media_url,
    mediaType: payload.media_type,
    mediaName: payload.media_name,
    mediaSize: payload.media_size,
    mediaMimeType: payload.media_mime_type,
  });
  return mapPostToUI(res.data);
}

// FIX [CRÍTICO]: Usa endpoint público /api/public/:publicToken — sem autenticação, sem expor UUID interno
export async function getPostByPublicSlug(publicSlug) {
  const res = await api.get(`/public/${publicSlug}`);
  return mapPostToUI(res.data);
}

// FIX [CRÍTICO]: Todas as ações públicas (approve/comment) usam /api/public/:publicToken/*
export async function submitPostReviewAction({ postId, authorName, comment, action }) {
  // postId aqui é o publicToken (post.public_slug)
  const normalizedAuthor = authorName?.trim();
  if (!normalizedAuthor) {
    throw new Error('Informe seu nome para continuar.');
  }

  const text = String(comment || '').trim();
  const author = normalizedAuthor;

  if (action === 'comment') {
    if (!text) throw new Error('Informe um comentario para enviar.');
    await api.post(`/public/${postId}/comments`, { author, text });
    return { status: null };
  }

  if (text) {
    await api.post(`/public/${postId}/comments`, { author, text });
  }

  const dbStatus = action === 'approved' ? 'APPROVED' : 'ADJUSTMENT';
  await api.patch(`/public/${postId}/status`, { status: dbStatus, actorName: normalizedAuthor });
  return { status: action };
}

// FIX [CRÍTICO]: Undo de revisão pública usa endpoint /api/public/:publicToken/status
export async function undoPublicReview(publicToken, authorName) {
  await api.patch(`/public/${publicToken}/status`, {
    status: 'PENDING',
    actorName: String(authorName || 'Cliente').trim(),
  });
  return { status: 'pending' };
}

export async function publishPostById(postId) {
  const res = await api.post(`/posts/${postId}/publish`);
  return mapPostToUI(res.data);
}

export async function listSlaAlerts() {
  const res = await api.get('/sla/alerts');
  return res.data;
}

export async function updateTaskById(taskId, done) {
  const res = await api.patch(`/tasks/${taskId}`, { done });
  return res.data;
}
