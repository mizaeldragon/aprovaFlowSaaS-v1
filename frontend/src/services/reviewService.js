import api from './api';

const mapPostToUI = (post) => ({
  ...post,
  id: post.id,
  created_at: post.createdAt,
  updated_at: post.updatedAt,
  image_url: post.imageUrl,
  public_slug: post.id,
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
    const res = await api.patch(`/posts/${postId}/status`, { status: dbStatus });
    return mapPostToUI(res.data);
  }
}

export async function deletePostById(postId) {
  await api.delete(`/posts/${postId}`);
}

export async function createPost(payload) {
  const tenantId = localStorage.getItem('aprovaflow-tenant');
  const res = await api.post('/posts', { ...payload, tenantId });
  return mapPostToUI(res.data);
}

export async function getPostByPublicSlug(publicSlug) {
  const res = await api.get(`/posts/${publicSlug}`);
  return mapPostToUI(res.data);
}

export async function submitPostReviewAction({ postId, authorName, comment, action }) {
  const text = comment.trim() || action;
  const author = authorName.trim() || 'Cliente';

  await api.post(`/posts/${postId}/comments`, { author, text });
  
  let dbStatus = 'PENDING';
  if (action === 'approved') dbStatus = 'APPROVED';
  if (action === 'changes_requested') dbStatus = 'ADJUSTMENT';

  await api.patch(`/posts/${postId}/status`, { status: dbStatus });
  return { status: action };
}
