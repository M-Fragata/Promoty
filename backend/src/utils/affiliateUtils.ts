import { Env } from './Envirolment.js';
import { encurtarLink } from './encurtador.js';

export type StoreType = 'mercadolivre' | 'amazon' | 'shopee' | 'cea' | 'riachuelo' | 'dafiti' | 'kabum' | 'other';

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
  if (lowerUrl.includes('riachuelo')) {
    return 'riachuelo';
  }
  if (lowerUrl.includes('ceadns.com') || lowerUrl.includes('cea.com')) {
    return 'cea';
  }
  if (lowerUrl.includes('dafiti')) {
    return 'dafiti';
  }
  if (lowerUrl.includes('kabum')) {
    return 'kabum';
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

      case 'shopee': {
        const shopeeId = Env.SHOPEE_ID;
        if (shopeeId) {
          urlObj.searchParams.set('mmp_pid', `an_${shopeeId}`);
          urlObj.searchParams.set('utm_source', `an_${shopeeId}`);
          urlObj.searchParams.set('utm_medium', 'affiliates');
        }
        break;
      }

      case 'cea':
      case 'riachuelo':
      case 'dafiti':
      case 'kabum': {
        const merchantIds: Record<string, string> = {
          cea: Env.AWIN_CEA_MERCHANT_ID,
          riachuelo: Env.AWIN_RIACHUELO_MERCHANT_ID,
          dafiti: Env.AWIN_DAFITI_MERCHANT_ID,
          kabum: Env.AWIN_KABUM_MERCHANT_ID,
        };
        return `https://www.awin1.com/cread.php?awinmid=${merchantIds[store]}&awinaffid=${Env.AWIN_PUBLISHER_ID}&ued=${encodeURIComponent(url)}`;
      }

      case 'other':
        break;
    }

    return urlObj.toString();
  } catch {
    return url;
  }
}

/**
 * Constrói URL final com afiliado + encurtamento (quando aplicável)
 * - ML: parâmetros de afiliado + encurta via Kutt
 * - Amazon: tag de afiliado
 * - Shopee: mmp_pid + utm_source + utm_medium
 * - C&A, Riachuelo, Dafiti, KaBuM: Awin cread.php
 */
export async function buildAffiliateUrl(url: string): Promise<string> {
  const store = detectStore(url);
  const urlWithAffiliate = appendAffiliateParams(url, store);

  if (store === 'mercadolivre') {
    return await encurtarLink(urlWithAffiliate);
  }

  return urlWithAffiliate;
}
