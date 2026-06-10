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
offersRoutes.post('/shopee/info', shopeePromoController.GetInfo)
offersRoutes.get('/shopee/shop', shopeePromoController.GetPichauShop)
