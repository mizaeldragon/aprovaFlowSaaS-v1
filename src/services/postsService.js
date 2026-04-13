import supabase from './supabase'
import { uploadImageToCreativeAssets } from './storageService'

export function generatePublicSlug() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 16)
}

export async function createPostWithImage({ title, channel, caption, imageFile }) {
  const publicSlug = generatePublicSlug()
  const publicUrl = await uploadImageToCreativeAssets(imageFile)

  const { error: insertError } = await supabase.from('posts').insert({
    title,
    channel,
    caption,
    image_url: publicUrl,
    public_slug: publicSlug,
    status: 'pending',
  })

  if (insertError) {
    throw new Error(`Falha ao salvar post: ${insertError.message}`)
  }
}
