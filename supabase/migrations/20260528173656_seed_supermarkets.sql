-- ============================================
-- SEED DATA - Supermercados de Asunción
-- ============================================

-- Supermercados
insert into public.supermarkets (name, slug, logo_url, address, city, phone, website, latitude, longitude, opening_hours) values
('Stock', 'stock', 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Logo_Stock.svg/200px-Logo_Stock.svg.png', 'Av. Mariscal López 2345, Asunción', 'Asunción', '+595 21 123 456', 'https://www.stock.com.py', -25.2856, -57.6313, '{"lunes_a_viernes": "07:00-21:00", "sabados": "07:00-20:00", "domingos": "08:00-13:00"}'),
('Superseis', 'superseis', 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Logo_Superseis.svg/200px-Logo_Superseis.svg.png', 'Av. Mcal. Estigarribia 4567, Asunción', 'Asunción', '+595 21 234 567', 'https://www.superseis.com.py', -25.2921, -57.5789, '{"lunes_a_viernes": "08:00-21:00", "sabados": "08:00-20:00", "domingos": "08:00-14:00"}'),
('Biggie', 'biggie', 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Logo_Biggie.svg/200px-Logo_Biggie.svg.png', 'Av. Artigas 890, Asunción', 'Asunción', '+595 21 345 678', 'https://www.biggie.com.py', -25.3012, -57.5845, '{"lunes_a_viernes": "07:30-21:30", "sabados": "07:30-21:00", "domingos": "08:00-14:00"}'),
('Disco', 'disco', 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Logo_Disco.svg/200px-Logo_Disco.svg.png', 'Shopping del Sol, Asunción', 'Asunción', '+595 21 456 789', 'https://www.disco.com.py', -25.2689, -57.5678, '{"lunes_a_viernes": "09:00-22:00", "sabados": "09:00-21:00", "domingos": "09:00-15:00"}'),
('Villa Lima', 'villa-lima', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Logo_Villa_Lima.svg/200px-Logo_Villa_Lima.svg.png', 'Av. Venezuela 1234, Asunción', 'Asunción', '+595 21 567 890', 'https://www.villalima.com.py', -25.2756, -57.5934, '{"lunes_a_viernes": "07:00-20:00", "sabados": "07:00-19:00", "domingos": "08:00-12:00"}'),
('Ykua Pora', 'ykua-pora', NULL, 'Av. Aviadores del Chaco 5678, Asunción', 'Asunción', '+595 21 678 901', NULL, -25.2589, -57.5512, '{"lunes_a_viernes": "07:00-21:00", "sabados": "07:00-20:00", "domingos": "08:00-13:00"}');

-- Categorías
insert into public.categories (name, slug, icon) values
('Lácteos', 'lacteos', '🥛'),
('Carnes', 'carnes', '🥩'),
('Verduras y Frutas', 'verduras-frutas', '🥬'),
('Bebidas', 'bebidas', '🥤'),
('Aceites y Condimentos', 'aceites-condimentos', '🫒'),
('Panadería', 'panaderia', '🍞'),
('Limpieza', 'limpieza', '🧹'),
('Higiene Personal', 'higiene-personal', '🧴'),
('Snacks', 'snacks', '🍿'),
('Electrodomésticos', 'electrodomesticos', '🔌');

-- Productos
insert into public.products (name, slug, description, image_url, brand, unit, category_id, barcode) values
('Leche La Serenísima 1L', 'leche-la-serenisima-1l', 'Leche entera pasteurizada', NULL, 'La Serenísima', 'litro', (select id from public.categories where slug = 'lacteos'), '7891234567890'),
('Leche Pilar 1L', 'leche-pilar-1l', 'Leche entera', NULL, 'Pilar', 'litro', (select id from public.categories where slug = 'lacteos'), '7891234567891'),
('Yogur Batido 200g', 'yogur-batido-200g', 'Yogur batido sabor frutilla', NULL, 'La Irene', 'unidad', (select id from public.categories where slug = 'lacteos'), '7891234567892'),
('Queso Paraguay 500g', 'queso-paraguay-500g', 'Queso fresco paraguayo', NULL, 'Norte', '500g', (select id from public.categories where slug = 'lacteos'), '7891234567893'),
('Manteca 200g', 'manteca-200g', 'Manteca salada', NULL, 'La Serenísima', '200g', (select id from public.categories where slug = 'lacteos'), '7891234567894'),
('Pechuga de Pollo 1kg', 'pechuga-de-pollo-1kg', 'Pechuga de pollo fresca', NULL, 'Frigorífico', 'kilogramo', (select id from public.categories where slug = 'carnes'), '7891234567895'),
('Carne Picada 500g', 'carne-picada-500g', 'Carne vacuna picada', NULL, 'Frigorífico', '500g', (select id from public.categories where slug = 'carnes'), '7891234567896'),
('Chorizo 300g', 'chorizo-300g', 'Chorizo paraguayo artesanal', NULL, 'Don Carlos', '300g', (select id from public.categories where slug = 'carnes'), '7891234567897'),
('Tomate 1kg', 'tomate-1kg', 'Tomate fresco', NULL, 'Local', 'kilogramo', (select id from public.categories where slug = 'verduras-frutas'), '7891234567898'),
('Cebolla 1kg', 'cebolla-1kg', 'Cebolla morada', NULL, 'Local', 'kilogramo', (select id from public.categories where slug = 'verduras-frutas'), '7891234567899'),
('Manzana 1kg', 'manzana-1kg', 'Manzana roja importada', NULL, 'Importada', 'kilogramo', (select id from public.categories where slug = 'verduras-frutas'), '7891234567900'),
('Naranja 1kg', 'naranja-1kg', 'Naranja fresca', NULL, 'Local', 'kilogramo', (select id from public.categories where slug = 'verduras-frutas'), '7891234567901'),
('Coca-Cola 2L', 'coca-cola-2l', 'Gaseosa Coca-Cola', NULL, 'Coca-Cola', '2 litros', (select id from public.categories where slug = 'bebidas'), '7891234567902'),
('Agua mineral 600ml', 'agua-mineral-600ml', 'Agua mineral sin gas', NULL, 'Pindara', '600ml', (select id from public.categories where slug = 'bebidas'), '7891234567903'),
('Jugo del Valle 1L', 'jugo-del-valle-1l', 'Jugo de naranja', NULL, 'Del Valle', '1 litro', (select id from public.categories where slug = 'bebidas'), '7891234567904'),
('Aceite Cocinero 900ml', 'aceite-cocinero-900ml', 'Aceite de soja refinado', NULL, 'Cocinero', '900ml', (select id from public.categories where slug = 'aceites-condimentos'), '7891234567905'),
('Arroz Pir Yvy 1kg', 'arroz-pir-yvy-1kg', 'Arroz largo fino', NULL, 'Pir Yvy', 'kilogramo', (select id from public.categories where slug = 'aceites-condimentos'), '7891234567906'),
('Azúcar Marca Paraná 1kg', 'azucar-marca-parana-1kg', 'Azúcar rubia', NULL, 'Marca Paraná', 'kilogramo', (select id from public.categories where slug = 'aceites-condimentos'), '7891234567907'),
('Sal fina 500g', 'sal-fina-500g', 'Sal comestible', NULL, 'Fina', '500g', (select id from public.categories where slug = 'aceites-condimentos'), '7891234567908'),
('Café La Estación 250g', 'cafe-la-estacion-250g', 'Café molido tostado', NULL, 'La Estación', '250g', (select id from public.categories where slug = 'aceites-condimentos'), '7891234567909'),
('Pan lactal 500g', 'pan-lactal-500g', 'Pan de molde blanco', NULL, 'Bimbo', '500g', (select id from public.categories where slug = 'panaderia'), '7891234567910'),
('Galletitas Oreo 117g', 'galletitas-oreo-117g', 'Galletitas sabor chocolate', NULL, 'Oreo', '117g', (select id from public.categories where slug = 'snacks'), '7891234567911'),
('Detergente Ala 800ml', 'detergente-ala-800ml', 'Detergente líquido', NULL, 'Ala', '800ml', (select id from public.categories where slug = 'limpieza'), '7891234567912'),
('Jabón Rexona 125g', 'jabon-rexona-125g', 'Jabón en barra', NULL, 'Rexona', '125g', (select id from public.categories where slug = 'higiene-personal'), '7891234567913'),
('Shampoo Head Shoulders 400ml', 'shampoo-head-shoulders-400ml', 'Shampoo anticaspa', NULL, 'Head & Shoulders', '400ml', (select id from public.categories where slug = 'higiene-personal'), '7891234567914');

-- Precios (simulados)
-- Stock
insert into public.product_prices (product_id, supermarket_id, price, original_price, is_on_sale) values
((select id from public.products where slug = 'leche-la-serenisima-1l'), (select id from public.supermarkets where slug = 'stock'), 8500, 9200, true),
((select id from public.products where slug = 'leche-pilar-1l'), (select id from public.supermarkets where slug = 'stock'), 7200, NULL, false),
((select id from public.products where slug = 'arroz-pir-yvy-1kg'), (select id from public.supermarkets where slug = 'stock'), 6800, 7500, true),
((select id from public.products where slug = 'aceite-cocinero-900ml'), (select id from public.supermarkets where slug = 'stock'), 15200, 17000, true),
((select id from public.products where slug = 'azucar-marca-parana-1kg'), (select id from public.supermarkets where slug = 'stock'), 7500, NULL, false),
((select id from public.products where slug = 'coca-cola-2l'), (select id from public.supermarkets where slug = 'stock'), 9800, NULL, false),
((select id from public.products where slug = 'cafe-la-estacion-250g'), (select id from public.supermarkets where slug = 'stock'), 18500, NULL, false);

-- Superseis
insert into public.product_prices (product_id, supermarket_id, price, original_price, is_on_sale) values
((select id from public.products where slug = 'leche-la-serenisima-1l'), (select id from public.supermarkets where slug = 'superseis'), 8900, NULL, false),
((select id from public.products where slug = 'leche-pilar-1l'), (select id from public.supermarkets where slug = 'superseis'), 6900, 7200, true),
((select id from public.products where slug = 'arroz-pir-yvy-1kg'), (select id from public.supermarkets where slug = 'superseis'), 7100, NULL, false),
((select id from public.products where slug = 'aceite-cocinero-900ml'), (select id from public.supermarkets where slug = 'superseis'), 16500, NULL, false),
((select id from public.products where slug = 'azucar-marca-parana-1kg'), (select id from public.supermarkets where slug = 'superseis'), 7200, 7800, true),
((select id from public.products where slug = 'coca-cola-2l'), (select id from public.supermarkets where slug = 'superseis'), 9500, 10200, true),
((select id from public.products where slug = 'tomate-1kg'), (select id from public.supermarkets where slug = 'superseis'), 8500, NULL, false);

-- Biggie
insert into public.product_prices (product_id, supermarket_id, price, original_price, is_on_sale) values
((select id from public.products where slug = 'leche-la-serenisima-1l'), (select id from public.supermarkets where slug = 'biggie'), 8200, NULL, false),
((select id from public.products where slug = 'leche-pilar-1l'), (select id from public.supermarkets where slug = 'biggie'), 7000, NULL, false),
((select id from public.products where slug = 'arroz-pir-yvy-1kg'), (select id from public.supermarkets where slug = 'biggie'), 6500, 7000, true),
((select id from public.products where slug = 'aceite-cocinero-900ml'), (select id from public.supermarkets where slug = 'biggie'), 14800, 16000, true),
((select id from public.products where slug = 'azucar-marca-parana-1kg'), (select id from public.supermarkets where slug = 'biggie'), 7300, NULL, false),
((select id from public.products where slug = 'cafe-la-estacion-250g'), (select id from public.supermarkets where slug = 'biggie'), 17800, 19000, true);

-- Disco
insert into public.product_prices (product_id, supermarket_id, price, original_price, is_on_sale) values
((select id from public.products where slug = 'leche-la-serenisima-1l'), (select id from public.supermarkets where slug = 'disco'), 9100, NULL, false),
((select id from public.products where slug = 'arroz-pir-yvy-1kg'), (select id from public.supermarkets where slug = 'disco'), 7300, NULL, false),
((select id from public.products where slug = 'aceite-cocinero-900ml'), (select id from public.supermarkets where slug = 'disco'), 17200, NULL, false),
((select id from public.products where slug = 'coca-cola-2l'), (select id from public.supermarkets where slug = 'disco'), 10100, NULL, false),
((select id from public.products where slug = 'galletitas-oreo-117g'), (select id from public.supermarkets where slug = 'disco'), 6200, NULL, false);

-- Villa Lima
insert into public.product_prices (product_id, supermarket_id, price, original_price, is_on_sale) values
((select id from public.products where slug = 'leche-la-serenisima-1l'), (select id from public.supermarkets where slug = 'villa-lima'), 8000, 8800, true),
((select id from public.products where slug = 'leche-pilar-1l'), (select id from public.supermarkets where slug = 'villa-lima'), 6800, NULL, false),
((select id from public.products where slug = 'arroz-pir-yvy-1kg'), (select id from public.supermarkets where slug = 'villa-lima'), 6200, 7000, true),
((select id from public.products where slug = 'aceite-cocinero-900ml'), (select id from public.supermarkets where slug = 'villa-lima'), 14500, 16500, true),
((select id from public.products where slug = 'azucar-marca-parana-1kg'), (select id from public.supermarkets where slug = 'villa-lima'), 7000, NULL, false),
((select id from public.products where slug = 'detergente-ala-800ml'), (select id from public.supermarkets where slug = 'villa-lima'), 12500, 14000, true);

-- Historial de precios (ejemplo para los últimos 30 días)
insert into public.price_history (product_id, supermarket_id, price, recorded_at)
select 
  (select id from public.products where slug = 'leche-la-serenisima-1l'),
  (select id from public.supermarkets where slug = 'stock'),
  (8000 + random() * 2000)::decimal(10,2),
  now() - (n || ' days')::interval
from generate_series(0, 30) as n;

insert into public.price_history (product_id, supermarket_id, price, recorded_at)
select 
  (select id from public.products where slug = 'arroz-pir-yvy-1kg'),
  (select id from public.supermarkets where slug = 'biggie'),
  (6000 + random() * 1500)::decimal(10,2),
  now() - (n || ' days')::interval
from generate_series(0, 30) as n;
