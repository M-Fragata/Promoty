import { Router } from 'express';
import { PromosController } from '../Controller/PromosController.js';
import { ShopeePromosController } from "../Controller/ShopeePromosController.js"

export const offersRoutes = Router();
const promosController = new PromosController();
const shopeePromoController = new ShopeePromosController()

offersRoutes.post('/mercadolivre', promosController.processProductsML);
offersRoutes.post('/amazon', promosController.processProductsAmazon);
offersRoutes.post('/shopee', promosController.processProductsShopee)


//Chamada na API da shopee
offersRoutes.get('/shopee/products', shopeePromoController.GetProducts)
offersRoutes.get('/shopee/categories', shopeePromoController.GetByCategories)
offersRoutes.get('/shopee/pichau', shopeePromoController.GetPichauShop)
offersRoutes.get('/shopee/terabyte', shopeePromoController.GetTerabyteShop)
