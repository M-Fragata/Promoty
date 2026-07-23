/**
 * 🧪 SCRIPT DE TESTE - Scraper Riachuelo
 * 
 * Este script é para uso em DESENVOLVIMENTO apenas.
 * O fetch para a API está comentado para evitar envio ao banco de dados.
 * 
 * Para executar:
 *   npx tsx backend/src/scripts/test-riachuelo.ts
 */

import { AccesWeb } from '../Services/AcessWebService.js';

async function testarRiachuelo() {
    console.log("🧪 [TESTE] Iniciando teste do scraper Riachuelo...\n");

    const scraper = new AccesWeb('casa');

    try {
        console.log("🌐 [Riachuelo] Iniciando varredura de teste...");
        const tempoInicio = Date.now();

        await scraper.AcessRiachuelo(async (produtosParciais) => {
            console.log(`\n⚡ [TESTE] Lote de ${produtosParciais.length} produtos recebido!\n`);

            // ============================================
            // 🔴 FETCH COMENTADO - NÃO ENVIA PARA A API
            // ============================================
            // try {
            //     const response = await fetch("http://localhost:3333/ofertas/riachuelo", {
            //         method: "POST",
            //         headers: { "Content-type": "application/json" },
            //         body: JSON.stringify(produtosParciais)
            //     });
            //
            //     if (!response.ok) {
            //         throw new Error(`${response.status} - ${response.statusText}`);
            //     }
            //
            //     console.log(`✅ [TESTE] Lote de ${produtosParciais.length} produtos processado com sucesso!`);
            // } catch (err: any) {
            //     console.error("❌ [TESTE] Erro ao enviar lote para a API:", err.message);
            // }

            // Apenas exibe os produtos no console para análise
            console.log("📋 [TESTE] Produtos encontrados neste lote:");
            console.log("─".repeat(80));
            for (const prod of produtosParciais) {
                console.log(`  ID: ${prod.id}`);
                console.log(`  Título: ${prod.title}`);
                console.log(`  Preço: R$ ${prod.price.toFixed(2)}`);
                console.log(`  Preço Original: R$ ${prod.originalPrice?.toFixed(2) || 'N/A'}`);
                console.log(`  Parcelas: ${prod.installments || 'N/A'}`)
                console.log(`  Desconto: ${prod.badge || 'N/A'}`);
                console.log(`  Cupom: ${prod.coupon || 'N/A'}`);
                console.log(`  Loja: ${prod.store}`);
                console.log(`  Link: ${prod.link}`);
                console.log("─".repeat(80));
            }

            console.log(`\n📊 [TESTE] Total de produtos no lote: ${produtosParciais.length}`);
            console.log("🔴 [TESTE] FETCH COMENTADO - Nenhum dado enviado à API.\n");
        });

        const tempoFim = Date.now();
        const tempoTotal = ((tempoFim - tempoInicio) / 1000).toFixed(2);
        console.log(`\n⏱️ [TESTE] Scraper finalizado em ${tempoTotal} segundos.`);

    } catch (error) {
        console.error("❌ [TESTE] Falha crítica no teste:", error);
    }
}

testarRiachuelo();
