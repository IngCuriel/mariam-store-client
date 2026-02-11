import api from '../config/api';

/**
 * Obtiene la signature de Cloudinary para upload seguro
 */
export const getCloudinarySignature = async (folder) => {
  const response = await api.post('/cloudinary/signature', folder ? { folder } : {});
  return response.data;
};

/**
 * Sube una imagen directamente a Cloudinary
 */
export const uploadImageToCloudinary = async (file, folder) => {
  try {
    // 1. Obtener signature del backend
    const signatureData = await getCloudinarySignature(folder);

    // 2. Preparar FormData para Cloudinary
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', signatureData.api_key);
    formData.append('folder', signatureData.folder);
    if (signatureData.resource_type && signatureData.resource_type !== 'image') {
      formData.append('resource_type', signatureData.resource_type);
    }
    formData.append('signature', signatureData.signature);
    formData.append('timestamp', signatureData.timestamp.toString());

    // 3. Subir a Cloudinary
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${signatureData.cloud_name}/image/upload`;

    const response = await fetch(cloudinaryUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: { message: errorText || `Error ${response.status}` } };
      }
      throw new Error(errorData.error?.message || `Error subiendo imagen: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return result.secure_url;
  } catch (error) {
    console.error('Error subiendo imagen:', error);
    throw error;
  }
};

