import supabase from './supabase'

const ACTION_STATUS_MAP = {
  approved: 'approved',
  changes_requested: 'changes_requested',
}

export async function listPosts() {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Falha ao listar posts: ${error.message}`)
  }

  return data ?? []
}

export async function listCommentsByPostId(postId) {
  if (!postId) return []

  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Falha ao listar comentarios: ${error.message}`)
  }

  return data ?? []
}

export async function updatePostById(postId, payload) {
  const { data, error } = await supabase
    .from('posts')
    .update(payload)
    .eq('id', postId)
    .select('*')
    .single()

  if (error) {
    throw new Error(`Falha ao atualizar post: ${error.message}`)
  }

  return data
}

export async function deletePostById(postId) {
  const { error } = await supabase.from('posts').delete().eq('id', postId)

  if (error) {
    throw new Error(`Falha ao excluir post: ${error.message}`)
  }
}

export async function getPostByPublicSlug(publicSlug) {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('public_slug', publicSlug)
    .maybeSingle()

  if (error) {
    throw new Error(`Falha ao buscar post: ${error.message}`)
  }

  return data
}

export async function submitPostReviewAction({ postId, authorName, comment, action }) {
  const trimmedComment = comment.trim()
  const normalizedComment =
    trimmedComment ||
    (action === 'approved'
      ? 'Aprovado.'
      : action === 'changes_requested'
        ? 'Solicitado ajuste.'
        : '')

  if (!normalizedComment) {
    throw new Error('Comentario obrigatorio para esta acao.')
  }

  const nextStatus = ACTION_STATUS_MAP[action]
  if (nextStatus) {
    const { error: updateError } = await supabase
      .from('posts')
      .update({ status: nextStatus })
      .eq('id', postId)

    if (updateError) {
      throw new Error(`Falha ao atualizar status: ${updateError.message}`)
    }
  }

  const { error: commentError } = await supabase.from('comments').insert({
    post_id: postId,
    author_name: authorName.trim() || null,
    comment: normalizedComment,
    action,
  })

  if (commentError) {
    throw new Error(`Falha ao salvar comentario: ${commentError.message}`)
  }

  return { status: nextStatus ?? null }
}
