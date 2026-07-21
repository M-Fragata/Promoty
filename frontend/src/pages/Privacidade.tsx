import { PageShell } from '../components/layout/PageShell';

export function Privacidade() {
  return (
    <PageShell>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-headline-lg-mobile lg:text-headline-lg font-bold text-text-primary mb-6">
          Política de Privacidade
        </h1>

        <div className="space-y-8 text-text-secondary leading-relaxed">
          <p className="text-sm text-text-secondary">
            <strong>Última atualização:</strong> {new Date().toLocaleDateString('pt-BR')}
          </p>

          <section>
            <h2 className="text-headline-md font-bold text-text-primary mb-3">
              1. Coleta de Dados
            </h2>
            <p>
              Coletamos apenas os dados estritamente necessários para o funcionamento
              do site. Os dados coletados incluem:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-2">
              <li>
                <strong>Dados de cadastro:</strong> Endereço de e-mail e nome (quando você
                cria uma conta)
              </li>
              <li>
                <strong>Dados de senha:</strong> Armazenada de forma segura com hash
                criptográfico (bcrypt)
              </li>
              <li>
                <strong>Dados de favoritos:</strong> Produtos que você salva para
                consultar depois
              </li>
              <li>
                <strong>Preferência de tema:</strong> Sua escolha entre modo claro ou
                escuro
              </li>
            </ul>
            <p className="mt-3">
              <strong>NÃO coletamos:</strong> Dados de navegação, páginas visitadas,
              tempo de permanência, informações do dispositivo, endereço IP, localização
              ou qualquer dado de rastreamento.
            </p>
          </section>

          <section>
            <h2 className="text-headline-md font-bold text-text-primary mb-3">
              2. Uso de Cookies e Armazenamento Local
            </h2>
            <p>
              O Fragata <strong>NÃO utiliza cookies</strong> para rastreamento,
              estatísticas ou analytics.
            </p>
            <p className="mt-3">
              Utilizamos apenas <strong>armazenamento local (localStorage)</strong> do
              navegador para:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-2">
              <li>
                <strong>Token de autenticação:</strong> Mantém você logado durante a
                navegação (removido ao fazer logout)
              </li>
              <li>
                <strong>Preferência de tema:</strong> Salva sua escolha entre modo
                claro ou escuro
              </li>
            </ul>
            <p className="mt-3">
              <strong>NÃO utilizamos:</strong> Google Analytics, Facebook Pixel, Hotjar,
              Microsoft Clanalytics ou qualquer serviço de rastreamento. Seus dados de
              navegação <strong>NÃO são coletados ou analisados</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-headline-md font-bold text-text-primary mb-3">
              3. Links de Afiliados
            </h2>
            <p>
              Nosso site contém links de afiliados para lojas parceiras, incluindo a
              Amazon. Quando você clica em um link de afiliado e realiza uma compra,
              podemos receber uma comissão por essa venda.
            </p>
            <p className="mt-3">
              <strong>Importante:</strong> Essa comissão não afeta o preço que você paga
              pelo produto. O preço é o mesmo independentemente de você usar ou não nosso
              link de afiliado.
            </p>
          </section>

          <section>
            <h2 className="text-headline-md font-bold text-text-primary mb-3">
              4. Compartilhamento de Dados
            </h2>
            <p>
              Não vendemos nem compartilhamos seus dados pessoais com terceiros para
              fins de marketing. Podemos compartilhar dados apenas nas seguintes
              situações:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-2">
              <li>Quando exigido por lei ou ordem judicial</li>
              <li>Para proteger nossos direitos legais</li>
              <li>Com prestadores de serviço que nos ajudam a operar o site</li>
            </ul>
          </section>

          <section>
            <h2 className="text-headline-md font-bold text-text-primary mb-3">
              5. Segurança dos Dados
            </h2>
            <p>
              Adotamos medidas de segurança para proteger seus dados pessoais contra
              acesso não autorizado, alteração, divulgação ou destruição. Isso inclui:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-2">
              <li>Conexão criptografada (HTTPS)</li>
              <li>Senhas armazenadas de forma segura</li>
              <li>Acesso restrito aos dados</li>
              <li>Monitoramento de segurança</li>
            </ul>
          </section>

          <section>
            <h2 className="text-headline-md font-bold text-text-primary mb-3">
              6. Seus Direitos
            </h2>
            <p>
              De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem direito a:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-2">
              <li>
                <strong>Acesso:</strong> Solicitar uma cópia dos seus dados pessoais
              </li>
              <li>
                <strong>Correção:</strong> Solicitar a correção de dados incorretos
              </li>
              <li>
                <strong>Exclusão:</strong> Solicitar a exclusão dos seus dados pessoais
              </li>
              <li>
                <strong>Portabilidade:</strong> Receber seus dados em formato compatível
              </li>
              <li>
                <strong>Oposição:</strong> Opor-se ao tratamento dos seus dados
              </li>
            </ul>
            <p className="mt-3">
              Para exercer esses direitos, entre em contato conosco pelo email: <strong>suportefragata.me@gmail.com</strong>
            </p>
          </section>

          <section>
            <h2 className="text-headline-md font-bold text-text-primary mb-3">
              7. Retenção de Dados
            </h2>
            <p>
              Mantemos seus dados pessoais apenas pelo tempo necessário para cumprir
              os objetivos para os quais foram coletados, ou conforme exigido por lei.
            </p>
          </section>

          <section>
            <h2 className="text-headline-md font-bold text-text-primary mb-3">
              8. Alterações nesta Política
            </h2>
            <p>
              Podemos atualizar esta Política de Privacidade periodicamente. Quaisquer
              alterações serão publicadas nesta página com a data da última atualização.
            </p>
          </section>

          <section>
            <h2 className="text-headline-md font-bold text-text-primary mb-3">
              9. Contato
            </h2>
            <p>
              Se você tiver dúvidas sobre esta Política de Privacidade ou sobre o
              tratamento dos seus dados pessoais, entre em contato conosco pelo email: <strong>suportefragata.me@gmail.com</strong>
            </p>
          </section>
        </div>
      </div>
    </PageShell>
  );
}
