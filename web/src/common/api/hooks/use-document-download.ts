import { useCallback, useState } from 'react';
import { apiBaseUrl, apiFetch } from '../client';

export const useDocumentDownload = () => {
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const downloadDocument = useCallback(async (id: string, fileName: string) => {
    setDownloadError(null);
    setDownloadingId(id);
    try {
      const response = await apiFetch(`${apiBaseUrl}/documents/${id}`);
      if (!response.ok) { setDownloadError('No se pudo descargar el archivo'); return; }
      const url = URL.createObjectURL(await response.blob());
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch { setDownloadError('No se pudo descargar el archivo'); }
    finally { setDownloadingId(null); }
  }, []);
  return { downloadDocument, downloadError, downloadingId };
};
