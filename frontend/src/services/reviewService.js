import api from './api';

const mapPostToUI = (post) => ({
  ...post,
  id: post.id,
  created_at: post.createdAt,
  updated_at: post.updatedAt,
  image_url: post.imageUrl,
  public_slug: post.id,
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
  const tenantId = localStorage.getItem('aprovaflow-tenant');
  const res = await api.get(`/posts?tenantId=${tenantId}`);
  return res.data.map(mapPostToUI);
}

export async function listCommentsByPostId(postId) {
  if (!postId) return [];
  const res = await api.get(`/posts/${postId}`);
  return (res.data.comments || []).map(mapCommentToUI);
}

export async function updatePostById(postId, payload) {
  if (payload.status) {
    const dbStatus = payload.status === 'approved' ? 'APPROVED' : payload.status === 'changes_requested' ? 'ADJUSTMENT' : 'PENDING';
    const res = await api.patch(`/posts/${postId}/status`, { status: dbStatus, actorName: payload.actorName || 'Agency' });
    return mapPostToUI(res.data);
  }
}

export async function deletePostById(postId) {
  await api.delete(`/posts/${postId}`);
}

export async function createPost(payload) {
  if (!payload?.clientName || !String(payload.clientName).trim()) {
    throw new Error('Nome do cliente obrigatorio');
  }
  const tenantId = localStorage.getItem('aprovaflow-tenant');
  const res = await api.post('/posts', { ...payload, clientName: String(payload.clientName).trim(), tenantId });
  return mapPostToUI(res.data);
}

export async function getPostByPublicSlug(publicSlug) {
  const res = await api.get(`/posts/${publicSlug}`);
  return mapPostToUI(res.data);
}

export async function submitPostReviewAction({ postId, authorName, comment, action }) {
  const normalizedAuthor = authorName?.trim();
  if (!normalizedAuthor) {
    throw new Error('Informe seu nome para continuar.');
  }

  const text = comment.trim() || action;
  const author = normalizedAuthor;

  await api.post(`/posts/${postId}/comments`, { author, text, action });
  
  let dbStatus = 'PENDING';
  if (action === 'approved') dbStatus = 'APPROVED';
  if (action === 'changes_requested') dbStatus = 'ADJUSTMENT';

  await api.patch(`/posts/${postId}/status`, { status: dbStatus, actorName: normalizedAuthor });
  return { status: action };
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

