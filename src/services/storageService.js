import supabase from './supabase'

const CREATIVE_ASSETS_BUCKET = 'creative-assets'

function sanitizeFilename(filename) {
  return filename
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9.-]/g, '-')
    .replace(/-+/g, '-')
}

function generateUniqueFilePath(fileName) {
  const safeName = sanitizeFilename(fileName || 'image')
  const uniqueId = crypto.randomUUID()
  return `${uniqueId}/${Date.now()}-${safeName}`
}

export async function uploadImageToCreativeAssets(file) {
  if (!file) {
    throw new Error('Arquivo de imagem nao informado.')
  }

  const path = generateUniqueFilePath(file.name)

  const { error: uploadError } = await supabase.storage
    .from(CREATIVE_ASSETS_BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false })

  if (uploadError) {
    throw new Error(`Falha no upload da imagem: ${uploadError.message}`)
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(CREATIVE_ASSETS_BUCKET).getPublicUrl(path)

  if (!publicUrl) {
    throw new Error('Nao foi possivel gerar URL publica da imagem.')
  }

  return publicUrl
}
