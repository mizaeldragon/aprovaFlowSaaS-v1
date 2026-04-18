function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Falha ao converter imagem.'));
    reader.readAsDataURL(file);
  });
}

export async function uploadImageToCreativeAssets(file) {
  if (!file) {
    throw new Error('Arquivo de imagem nao informado.');
  }

  const maxSizeInMb = 5;
  if (file.size > maxSizeInMb * 1024 * 1024) {
    throw new Error(`Imagem muito grande. Maximo: ${maxSizeInMb}MB.`);
  }

  const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'];
  if (!allowedMimeTypes.includes(file.type)) {
    throw new Error('Formato de imagem invalido. Use PNG, JPG, WEBP, GIF ou SVG.');
  }

  const dataUrl = await fileToDataUrl(file);

  if (!dataUrl) {
    throw new Error('Nao foi possivel processar imagem.');
  }

  return dataUrl;
}
