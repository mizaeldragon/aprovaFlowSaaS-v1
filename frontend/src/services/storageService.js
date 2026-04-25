import { createClient } from '@supabase/supabase-js';
import api from './api';

const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'];
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const IMAGE_MAX_BYTES = 10 * 1024 * 1024;
const VIDEO_MAX_BYTES = 150 * 1024 * 1024;

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Falha ao converter imagem.'));
    reader.readAsDataURL(file);
  });
}

export function getCreativeAssetType(file) {
  if (!file) return 'IMAGE';
  if (VIDEO_TYPES.includes(file.type)) return 'VIDEO';
  return 'IMAGE';
}

export function isVideoAsset(mediaType) {
  return String(mediaType || '').toUpperCase() === 'VIDEO';
}

export async function uploadCreativeAsset(file) {
  if (!file) {
    throw new Error('Arquivo de mídia não informado.');
  }

  const mediaType = getCreativeAssetType(file);
  const allowedTypes = mediaType === 'VIDEO' ? VIDEO_TYPES : IMAGE_TYPES;
  const maxBytes = mediaType === 'VIDEO' ? VIDEO_MAX_BYTES : IMAGE_MAX_BYTES;
  const maxMb = Math.floor(maxBytes / 1024 / 1024);

  if (!allowedTypes.includes(file.type)) {
    throw new Error(mediaType === 'VIDEO'
      ? 'Formato de vídeo inválido. Use MP4, WEBM ou MOV.'
      : 'Formato de imagem inválido. Use PNG, JPG, WEBP, GIF ou SVG.');
  }

  if (file.size > maxBytes) {
    throw new Error(`${mediaType === 'VIDEO' ? 'Vídeo' : 'Imagem'} muito grande. Máximo: ${maxMb}MB.`);
  }

  if (!supabase) {
    if (mediaType === 'VIDEO') {
      throw new Error('Upload de vídeo exige Supabase Storage configurado.');
    }

    const dataUrl = await fileToDataUrl(file);
    return {
      mediaUrl: dataUrl,
      mediaType: 'IMAGE',
      mediaName: file.name,
      mediaSize: file.size,
      mediaMimeType: file.type,
    };
  }

  const signed = await api.post('/uploads/signed-url', {
    fileName: file.name,
    contentType: file.type,
    size: file.size,
    mediaType,
  });

  const uploadData = signed.data;
  const { error } = await supabase.storage
    .from(uploadData.bucket)
    .uploadToSignedUrl(uploadData.path, uploadData.token, file, {
      contentType: file.type,
    });

  if (error) {
    throw new Error(error.message || 'Falha ao enviar mídia para o storage.');
  }

  return {
    mediaUrl: uploadData.publicUrl,
    mediaType: uploadData.mediaType,
    mediaName: uploadData.mediaName || file.name,
    mediaSize: uploadData.mediaSize || file.size,
    mediaMimeType: uploadData.mediaMimeType || file.type,
  };
}

export async function uploadImageToCreativeAssets(file) {
  const uploaded = await uploadCreativeAsset(file);
  return uploaded.mediaUrl;
}
