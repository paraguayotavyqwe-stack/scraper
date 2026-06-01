-- ============================================
-- PRODUCT MAPPINGS TABLE
-- Links equivalent products across supermarkets
-- ============================================

CREATE TABLE IF NOT EXISTS public.product_mappings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  canonical_product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  mapped_product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(canonical_product_id, mapped_product_id),
  CHECK (canonical_product_id != mapped_product_id)
);

CREATE INDEX idx_product_mappings_canonical ON public.product_mappings(canonical_product_id);
CREATE INDEX idx_product_mappings_mapped ON public.product_mappings(mapped_product_id);

-- RLS for product_mappings
ALTER TABLE public.product_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view product mappings"
  ON public.product_mappings FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage mappings"
  ON public.product_mappings FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated users can manage mappings"
  ON public.product_mappings FOR ALL
  USING (auth.role() = 'authenticated');

-- ============================================
-- FIX RLS: Allow service role to write prices
-- ============================================

-- Drop existing restrictive policies on product_prices
DO $$ BEGIN
  DROP POLICY IF EXISTS "Anyone can view prices" ON public.product_prices;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Recreate with service role write access
CREATE POLICY "Anyone can view prices"
  ON public.product_prices FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage prices"
  ON public.product_prices FOR ALL
  USING (auth.role() = 'service_role');

-- Same for price_history
DO $$ BEGIN
  DROP POLICY IF EXISTS "Anyone can view price history" ON public.price_history;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Anyone can view price history"
  ON public.price_history FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage price history"
  ON public.price_history FOR ALL
  USING (auth.role() = 'service_role');

-- Same for products (service role needs to insert new products)
DO $$ BEGIN
  DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Anyone can view products"
  ON public.products FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage products"
  ON public.products FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- VIEW: Products with all supermarket prices
-- ============================================

CREATE OR REPLACE VIEW public.products_with_prices AS
SELECT
  p.id,
  p.name,
  p.slug,
  p.image_url,
  p.brand,
  p.category_id,
  c.name AS category_name,
  pp.price,
  pp.original_price,
  pp.is_on_sale,
  pp.is_available,
  s.name AS supermarket_name,
  s.slug AS supermarket_slug,
  s.id AS supermarket_id,
  pp.last_checked_at
FROM public.products p
LEFT JOIN public.product_prices pp ON pp.product_id = p.id AND pp.is_available = true
LEFT JOIN public.supermarkets s ON s.id = pp.supermarket_id
LEFT JOIN public.categories c ON c.id = p.category_id
WHERE p.is_active = true;

-- ============================================
-- FUNCTION: Get all prices for a product and its mappings
-- ============================================

CREATE OR REPLACE FUNCTION get_all_prices_for_product(product_id_param uuid)
RETURNS TABLE (
  product_name text,
  product_image text,
  price decimal,
  original_price decimal,
  is_on_sale boolean,
  supermarket_name text,
  supermarket_slug text,
  is_canonical boolean
) AS $$
BEGIN
  RETURN QUERY
  -- Direct prices
  SELECT
    p.name::text,
    p.image_url::text,
    pp.price,
    pp.original_price,
    pp.is_on_sale,
    s.name::text,
    s.slug::text,
    TRUE as is_canonical
  FROM public.product_prices pp
  JOIN public.products p ON p.id = pp.product_id
  JOIN public.supermarkets s ON s.id = pp.supermarket_id
  WHERE pp.product_id = product_id_param AND pp.is_available = true

  UNION ALL

  -- Mapped product prices
  SELECT
    p.name::text,
    p.image_url::text,
    pp.price,
    pp.original_price,
    pp.is_on_sale,
    s.name::text,
    s.slug::text,
    FALSE as is_canonical
  FROM public.product_mappings pm
  JOIN public.product_prices pp ON pp.product_id = pm.mapped_product_id
  JOIN public.products p ON p.id = pp.product_id
  JOIN public.supermarkets s ON s.id = pp.supermarket_id
  WHERE pm.canonical_product_id = product_id_param AND pp.is_available = true

  UNION ALL

  -- Reverse mapped (if this product is the mapped one)
  SELECT
    p.name::text,
    p.image_url::text,
    pp.price,
    pp.original_price,
    pp.is_on_sale,
    s.name::text,
    s.slug::text,
    FALSE as is_canonical
  FROM public.product_mappings pm
  JOIN public.product_prices pp ON pp.product_id = pm.canonical_product_id
  JOIN public.products p ON p.id = pp.product_id
  JOIN public.supermarkets s ON s.id = pp.supermarket_id
  WHERE pm.mapped_product_id = product_id_param AND pp.is_available = true

  ORDER BY price ASC;
END;
$$ LANGUAGE plpgsql;
