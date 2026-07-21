import { PageShell } from '../components/layout/PageShell';

export function Termos() {
  return (
    <PageShell>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-headline-lg-mobile lg:text-headline-lg font-bold text-text-primary mb-6">
          Termos de Uso
        </h1>

        <div className="space-y-8 text-text-secondary leading-relaxed">
          <p className="text-sm text-text-secondary">
            <strong>Última atualização:</strong> {new Date().toLocaleDateString('pt-BR')}
          </p>

          <section>
            <h2 className="text-headline-md font-bold text-text-primary mb-3">
              1. Aceitação dos Termos
            </h2>
            <p>
              Ao acessar e utilizar o Fragata, você concorda com estes Termos de Uso.
              Se não concordar com algum dos termos aqui apresentados, por favor, não
              utilize o site.
            </p>
          </section>

          <section>
            <h2 className="text-headline-md font-bold text-text-primary mb-3">
              2. Descrição do Serviço
            </h2>
            <p>
              O Fragata é um agregador de ofertas que reúne promoções de diversas lojas
              online. Nosso serviço inclui:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-2">
              <li>Exibição de ofertas de lojas parceiras</li>
              <li>Filtros de busca por categoria, loja e preço</li>
              <li>Sistema de favoritos para salvar produtos</li>
              <li>Links de afiliados para compra direta</li>
            </ul>
          </section>

          <section>
            <h2 className="text-headline-md font-bold text-text-primary mb-3">
              3. Uso do Site
            </h2>
            <p>
              Ao utilizar o Fragata, você se compromete a:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-2">
              <li>Usar o site de forma ética e em conformidade com a lei</li>
              <li>Não tentar acessar áreas restritas sem autorização</li>
              <li>Não utilizar o site para fins ilegais ou não autorizados</li>
              <li>Não interferir no funcionamento do site</li>
              <li>Não copiar ou reproduzir conteúdo sem autorização</li>
            </ul>
          </section>

          <section>
            <h2 className="text-headline-md font-bold text-text-primary mb-3">
              4. Propriedade Intelectual
            </h2>
            <p>
              <strong>Conteúdo de terceiros:</strong> O conteúdo exibido no Fragata,
              incluindo imagens, títulos e preços de produtos, é obtido diretamente de
              lojas parceiras (Mercado Livre, Amazon, Shopee) através de suas APIs e feeds
              de dados. Esse conteúdo pertence às respectivas lojas e marcas.
            </p>
            <p className="mt-3">
              <strong>Nosso conteúdo:</strong> O design, código-fonte, logotipos,
              funcionalidades e textos originais do site Fragata são protegidos por
              direitos autorais.
            </p>
            <p className="mt-3">
              Você pode compartilhar links para nossas páginas, mas não pode reproduzir,
              modificar ou distribuir nosso conteúdo sem autorização prévia por escrito.
            </p>
          </section>

          <section>
            <h2 className="text-headline-md font-bold text-text-primary mb-3">
              5. Links de Afiliados
            </h2>
            <p>
              Nosso site contém links de afiliados para lojas parceiras. Ao clicar nesses
              links e realizar uma compra, você nos ajuda a manter o site funcionando.
            </p>
            <p className="mt-3">
              <strong>Importante:</strong> O preço do produto não é afetado pelo uso de
              nossos links de afiliados. A comissão é paga pela loja parceira.
            </p>
          </section>

          <section>
            <h2 className="text-headline-md font-bold text-text-primary mb-3">
              6. Isenção de Responsabilidade
            </h2>
            <p>
              O Fragata é fornecido "como está" e "conforme disponível", sem garantias
              de qualquer tipo, expressas ou implícitas. Não nos responsabilizamos por:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-2">
              <li>Decisões tomadas com base nas informações do site</li>
              <li>Produtos ou serviços adquiridos através de links de afiliados</li>
              <li>Disponibilidade ou precisão das ofertas exibidas</li>
              <li>Problemas técnicos ou interrupções no serviço</li>
              <li>Perdas ou danos decorrentes do uso do site</li>
            </ul>
          </section>

          <section>
            <h2 className="text-headline-md font-bold text-text-primary mb-3">
              7. Conta de Usuário
            </h2>
            <p>
              Se você criar uma conta no Fragata, é responsável por:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-2">
              <li>Manter a confidencialidade de sua senha</li>
              <li>Todas as atividades que ocorrem em sua conta</li>
              <li>Notificar imediatamente qualquer uso não autorizado</li>
            </ul>
            <p className="mt-3">
              Reservamo-nos o direito de encerrar contas que violem estes termos.
            </p>
          </section>

          <section>
            <h2 className="text-headline-md font-bold text-text-primary mb-3">
              8. Limitação de Responsabilidade
            </h2>
            <p>
              Em nenhuma circunstância o Fragata será responsável por quaisquer danos
              diretos, indiretos, incidentais, especiais, consequenciais ou punitivos,
              incluindo mas não se limitando a:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-2">
              <li>Perda de lucros ou receitas</li>
              <li>Perda de dados</li>
              <li>Custos de aquisição de produtos substitutos</li>
              <li>Interrupção de negócios</li>
            </ul>
          </section>

          <section>
            <h2 className="text-headline-md font-bold text-text-primary mb-3">
              9. Links para Sites de Terceiros
            </h2>
            <p>
              Nosso site pode conter links para sites de terceiros. Esses links são
              fornecidos apenas para conveniência. Não nos responsabilizamos pelo
              conteúdo, práticas de privacidade ou políticas desses sites.
            </p>
          </section>

          <section>
            <h2 className="text-headline-md font-bold text-text-primary mb-3">
              10. Alterações nos Termos
            </h2>
            <p>
              Reservamo-nos o direito de modificar estes Termos de Uso a qualquer momento.
              As alterações entrarão em vigor imediatamente após a publicação no site.
              O uso continuado do site após as alterações constitui aceitação dos novos
              termos.
            </p>
          </section>

          <section>
            <h2 className="text-headline-md font-bold text-text-primary mb-3">
              11. Lei Aplicável
            </h2>
            <p>
              Estes Termos de Uso são regidos pelas leis da República Federativa do Brasil.
              Qualquer disputa relacionada a estes termos será submetida à jurisdição
              dos tribunais brasileiros.
            </p>
          </section>

          <section>
            <h2 className="text-headline-md font-bold text-text-primary mb-3">
              12. Contato
            </h2>
            <p>
              Se você tiver dúvidas sobre estes Termos de Uso, entre em contato conosco
              através do nosso canal de contato.
            </p>
          </section>
        </div>
      </div>
    </PageShell>
  );
}
