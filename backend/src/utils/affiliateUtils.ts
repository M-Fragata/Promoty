import { Env } from './Envirolment.js';

export type StoreType = 'mercadolivre' | 'amazon' | 'shopee' | 'other';

/**
 * Detecta a loja a partir da URL
 */
export function detectStore(url: string): StoreType {
  const lowerUrl = url.toLowerCase();

  if (lowerUrl.includes('mercadolivre') || lowerUrl.includes('mercadopago')) {
    return 'mercadolivre';
  }
  if (lowerUrl.includes('amazon')) {
    return 'amazon';
  }
  if (lowerUrl.includes('shopee')) {
    return 'shopee';
  }

  return 'other';
}

/**
 * Extrai o ASIN de URLs da Amazon
 */
export function extractAmazonAsin(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const asinMatch = urlObj.pathname.match(/(?:dp|gp\/product)\/([A-Z0-9]{10})/i);

    if (asinMatch && asinMatch[1]) {
      return asinMatch[1].toUpperCase();
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Appenda parâmetros de afiliado na URL com base na loja detectada
 */
export function appendAffiliateParams(url: string, store: StoreType): string {
  try {
    const urlObj = new URL(url);

    switch (store) {
      case 'mercadolivre':
        urlObj.searchParams.set('matt_tool', Env.MATT_TOOL);
        urlObj.searchParams.set('matt_word', Env.MELI_ID);
        urlObj.searchParams.set('forceInApp', 'true');
        break;

      case 'amazon': {
        const asin = extractAmazonAsin(url);

        if (asin) {
          urlObj.pathname = `/dp/${asin}`;
          urlObj.search = '';
        } else {
          // Limpar parâmetros de rastreamento desnecessários
          urlObj.searchParams.delete('qid');
          urlObj.searchParams.delete('sr');
          urlObj.searchParams.delete('pf_rd_r');
          urlObj.searchParams.delete('pf_rd_p');
          urlObj.searchParams.delete('ref_');
          urlObj.searchParams.delete('sbo');
          urlObj.searchParams.delete('linkCode');
          urlObj.searchParams.delete('linkId');
        }

        urlObj.searchParams.set('tag', Env.AMAZON_TAG);
        break;
      }

      case 'shopee':
        // Links da Shopee já vêm com afiliado da API
        break;

      case 'other':
        // Sem parâmetros de afiliado para outras lojas
        break;
    }

    return urlObj.toString();
  } catch {
    // Se a URL for inválida, retorna a original
    return url;
  }
}
