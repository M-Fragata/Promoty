/**
 * Domínios conhecidos de encurtadores de URL.
 * Esses domínios precisam ser expandidos antes de detectar a loja.
 */
const SHORTENER_DOMAINS = [
  // Amazon shorteners
  'amzn.to',
  'a.co',
  'amzn.com',
  // Shopee share link
  's.shopee',
  //mercadolivre share link
  'meli.la'
];

/**
 * Verifica se uma URL é de um encurtador conhecido
 */
export function isShortenedUrl(url: string): boolean {
  const lowerUrl = url.toLowerCase();
  return SHORTENER_DOMAINS.some((domain) => lowerUrl.includes(domain));
}

/**
 * Expande uma URL encurtada seguindo os redirecionamentos HTTP.
 * Retorna a URL final após todos os redirects.
 * Em caso de erro, retorna a URL original.
 */
export async function expandUrl(
  shortUrl: string,
  maxRedirects = 10,
  timeoutMs = 10000
): Promise<string> {
  let currentUrl = shortUrl;
  const visited = new Set<string>();

  for (let i = 0; i < maxRedirects; i++) {
    // Prevenir loops infinitos
    if (visited.has(currentUrl)) break;
    visited.add(currentUrl);

    try {
      const response = await fetch(currentUrl, {
        redirect: 'manual', // Não seguir redirects automaticamente
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        signal: AbortSignal.timeout(timeoutMs),
      });

      // Se não houver Location header, chegamos à URL final
      const location = response.headers.get('location');
      if (!location) break;

      // Resolver URLs relativas
      currentUrl = new URL(location, currentUrl).toString();
    } catch {
      // Em caso de erro (timeout, rede, etc.), parar e retornar URL atual
      break;
    }
  }

  return currentUrl;
}
