-- ============================================
-- FIX RLS POLICIES
-- ============================================

-- Drop existing policies if they exist
DO $$ BEGIN
  DROP POLICY IF EXISTS "Anyone can view supermarkets" ON public.supermarkets;
  DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
  DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;
  DROP POLICY IF EXISTS "Anyone can view prices" ON public.product_prices;
  DROP POLICY IF EXISTS "Anyone can view price history" ON public.price_history;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Public read access for all product data
CREATE POLICY "Anyone can view supermarkets"
  ON public.supermarkets FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view products"
  ON public.products FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view categories"
  ON public.categories FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view prices"
  ON public.product_prices FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view price history"
  ON public.price_history FOR SELECT
  USING (true);

-- ============================================
-- STORAGE CORS CONFIGURATION
-- ============================================

-- Update bucket to be public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'product-images';

-- Create policy for public access to images
CREATE POLICY "Public Access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- Allow authenticated users to upload (for admin)
CREATE POLICY "Authenticated users can upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- Allow service role to upload (for scraper)
CREATE POLICY "Service role can upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images');

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to search products with prices
CREATE OR REPLACE FUNCTION search_products(search_query text)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  image_url text,
  brand text,
  category_name text,
  min_price decimal,
  max_price decimal,
  best_supermarket text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.slug,
    p.image_url,
    p.brand,
    c.name as category_name,
    MIN(pp.price) as min_price,
    MAX(pp.price) as max_price,
    (SELECT s.name FROM public.product_prices pp2 
     JOIN public.supermarkets s ON s.id = pp2.supermarket_id 
     WHERE pp2.product_id = p.id AND pp2.is_available = true 
     ORDER BY pp2.price ASC LIMIT 1) as best_supermarket
  FROM public.products p
  LEFT JOIN public.categories c ON c.id = p.category_id
  LEFT JOIN public.product_prices pp ON pp.product_id = p.id
  WHERE p.is_active = true
    AND (p.name ILIKE '%' || search_query || '%' 
         OR p.brand ILIKE '%' || search_query || '%'
         OR c.name ILIKE '%' || search_query || '%')
  GROUP BY p.id, p.name, p.slug, p.image_url, p.brand, c.name
  ORDER BY MIN(pp.price) ASC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- Function to get product with all prices
CREATE OR REPLACE FUNCTION get_product_details(product_slug text)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  image_url text,
  brand text,
  supermarket_name text,
  supermarket_slug text,
  price decimal,
  original_price decimal,
  is_on_sale boolean,
  last_checked timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.description,
    p.image_url,
    p.brand,
    s.name as supermarket_name,
    s.slug as supermarket_slug,
    pp.price,
    pp.original_price,
    pp.is_on_sale,
    pp.last_checked_at
  FROM public.products p
  LEFT JOIN public.product_prices pp ON pp.product_id = p.id
  LEFT JOIN public.supermarkets s ON s.id = pp.supermarket_id
  WHERE p.slug = product_slug
    AND p.is_active = true
  ORDER BY pp.price ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to get price history
CREATE OR REPLACE FUNCTION get_price_history(product_id_param uuid, days integer DEFAULT 30)
RETURNS TABLE (
  price decimal,
  recorded_at timestamptz,
  supermarket_name text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ph.price,
    ph.recorded_at,
    s.name as supermarket_name
  FROM public.price_history ph
  JOIN public.supermarkets s ON s.id = ph.supermarket_id
  WHERE ph.product_id = product_id_param
    AND ph.recorded_at >= NOW() - (days || ' days')::interval
  ORDER BY ph.recorded_at ASC;
END;
$$ LANGUAGE plpgsql;
