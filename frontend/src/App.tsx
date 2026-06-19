import { Header } from './components/layout/Header';

function App() {
  return (
    <div className="min-h-screen bg-app-bg text-text-primary transition-colors duration-300">
      <Header />

      <main className="pt-20 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-text-primary">Ofertas do Dia</h2>
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <span>Ordenar por:</span>
                <select className="px-2 py-1 bg-card-bg border border-app-border rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-color">
                  <option value="discount">Maior desconto</option>
                  <option value="price-asc">Menor preço</option>
                  <option value="price-desc">Maior preço</option>
                  <option value="newest">Mais recentes</option>
                </select>
              </div>
            </div>
            <div id="product-grid-placeholder" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {/* ProductGrid será inserido aqui */}
              <div className="col-span-full text-center py-12 text-text-secondary">
                Carregando ofertas...
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

export default App