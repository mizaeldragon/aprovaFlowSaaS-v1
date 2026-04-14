const STORAGE_KEY = 'aprovaflow.posts'

const defaultPosts = [
  {
    id: 'seed-1',
    title: 'Plano de Lancamento Q2',
    content: 'Documento inicial para revisao colaborativa do lancamento do segundo trimestre.',
    slug: 'plano-de-lancamento-q2',
    reviewer: 'Equipe de Produto',
    createdAt: '2026-03-20T14:00:00.000Z',
  },
]

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function readPosts() {
  const rawPosts = localStorage.getItem(STORAGE_KEY)

  if (!rawPosts) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultPosts))
    return defaultPosts
  }

  try {
    return JSON.parse(rawPosts)
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultPosts))
    return defaultPosts
  }
}

function savePosts(posts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts))
}

export function createPost(input) {
  const posts = readPosts()
  const baseSlug = slugify(input.title)
  const slugTaken = posts.some((post) => post.slug === baseSlug)
  const slug = slugTaken ? `${baseSlug}-${Date.now()}` : baseSlug

  const post = {
    id: crypto.randomUUID(),
    title: input.title,
    content: input.content,
    reviewer: input.reviewer,
    slug,
    createdAt: new Date().toISOString(),
  }

  const nextPosts = [post, ...posts]
  savePosts(nextPosts)

  return post
}

export function getPosts() {
  return readPosts()
}

export function getPostBySlug(slug) {
  return readPosts().find((post) => post.slug === slug)
}
