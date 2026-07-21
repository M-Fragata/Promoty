import { PageShell } from '../components/layout/PageShell';

export function Sobre() {
  return (
    <PageShell>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-headline-lg-mobile lg:text-headline-lg font-bold text-text-primary mb-6">
          Sobre o Fragata
        </h1>

        <div className="space-y-8 text-text-secondary leading-relaxed">
          <section>
            <h2 className="text-headline-md font-bold text-text-primary mb-3">
              O que é o Fragata?
            </h2>
            <p>
              O Fragata é um agregador de ofertas independente que reúne as melhores promoções
              de diversas lojas online, incluindo Mercado Livre, Amazon e Shopee. Nosso
              objetivo é facilitar sua busca por economia, trazendo todas as ofertas em um
              só lugar.
            </p>
          </section>

          <section>
            <h2 className="text-headline-md font-bold text-text-primary mb-3">
              Nossa Missão
            </h2>
            <p>
              Ajudar você a encontrar as melhores ofertas e economizar nas suas compras
              online, reunindo tudo em um só lugar com informações claras e atualizadas.
              Acredit que todos merecem acesso fácil às melhores promoções disponíveis no
              mercado.
            </p>
          </section>

          <section>
            <h2 className="text-headline-md font-bold text-text-primary mb-3">
              Como Funciona
            </h2>
            <p>
              Nosso sistema monitora preços em tempo real e identifica as melhores promoções
              disponíveis. Quando você encontra uma oferta interessante e clica no link,
              pode receber uma comissão por compra qualificada realizada através do nosso
              site, sem nenhum custo adicional para você.
            </p>
            <ul className="list-disc list-inside mt-3 space-y-2">
              <li>Monitoramento de preços em tempo real</li>
              <li>Filtros por categoria e loja</li>
              <li>Alertas de ofertas relâmpago</li>
              <li>Histórico de preços para você saber se a oferta é boa</li>
            </ul>
          </section>

          <section>
            <h2 className="text-headline-md font-bold text-text-primary mb-3">
              Transparência
            </h2>
            <p>
              Participamos do Programa de Associados da Amazon e de outros programas de
              afiliados. Isso significa que podemos receber comissões por compras
              qualificadas realizadas através dos links indicados em nosso site.
            </p>
            <p className="mt-3">
              Essa comissão não afeta o preço que você paga - é a loja quem paga nossa
              comissão. Ao clicar em nossos links, você nos ajuda a manter o site funcionando
              e a continuar oferecendo as melhores ofertas para você.
            </p>
          </section>

          <section>
            <h2 className="text-headline-md font-bold text-text-primary mb-3">
              Nossos Valores
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 mt-4">
              <div className="p-4 bg-surface-container-low rounded-lg border border-card-border">
                <h3 className="font-bold text-text-primary mb-2">Honestidade</h3>
                <p className="text-sm">
                  Mostramos ofertas reais e verificadas. Não prometemos descontos
                  que não existem.
                </p>
              </div>
              <div className="p-4 bg-surface-container-low rounded-lg border border-card-border">
                <h3 className="font-bold text-text-primary mb-2">Qualidade</h3>
                <p className="text-sm">
                  Selecionamos apenas ofertas de lojas confiáveis e com boa reputação.
                </p>
              </div>
              <div className="p-4 bg-surface-container-low rounded-lg border border-card-border">
                <h3 className="font-bold text-text-primary mb-2">Transparência</h3>
                <p className="text-sm">
                  Somos claros sobre como ganhamos dinheiro e como funciona nosso site.
                </p>
              </div>
              <div className="p-4 bg-surface-container-low rounded-lg border border-card-border">
                <h3 className="font-bold text-text-primary mb-2">Economia</h3>
                <p className="text-sm">
                  Nosso foco é ajudar você a economizar nas suas compras online.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-headline-md font-bold text-text-primary mb-3">
              Entre em Contato
            </h2>
            <p>
              Se você tem dúvidas, sugestões ou quer saber mais sobre o Fragata, entre em
              contato conosco pelo email: <strong>suportefragata.me@gmail.com</strong>
            </p>
            <p className="mt-3">
              Estamos aqui para ajudar!
            </p>
          </section>
        </div>
      </div>
    </PageShell>
  );
}
