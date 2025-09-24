CREATE TABLE apartments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  price_per_night NUMERIC(10,2) NOT NULL,
  address TEXT,
  city TEXT NOT NULL,
  bedrooms INT DEFAULT 1,
  bathrooms INT DEFAULT 1,
  surface_m2 INT,
  available_from DATE,
  available_to DATE,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  apartment_id UUID REFERENCES apartments(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  is_main BOOLEAN DEFAULT false,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  apartment_id UUID REFERENCES apartments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'canceled')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE apartments ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public apartments are viewable by everyone"
  ON apartments FOR SELECT
  USING (true);

CREATE POLICY "Admin can manage apartments"
  ON apartments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can view their own reservations"
  ON reservations FOR SELECT
  USING (auth.uid() = user_id OR 
         EXISTS (
           SELECT 1 FROM profiles
           WHERE profiles.id = auth.uid()
           AND profiles.role = 'admin'
         ));

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_apartments_updated_at BEFORE UPDATE
ON apartments FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE OR REPLACE FUNCTION get_monthly_revenue()
RETURNS TABLE(month TEXT, total NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT
    to_char(created_at, 'Mon YYYY') as month,
    SUM(total_price) as total
  FROM reservations
  WHERE status IN ('confirmed', 'pending')
  GROUP BY to_char(created_at, 'YYYY-MM'), to_char(created_at, 'Mon YYYY')
  ORDER BY to_char(created_at, 'YYYY-MM') DESC
  LIMIT 6;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_reservations_by_city()
RETURNS TABLE(city TEXT, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.city,
    COUNT(*) as count
  FROM reservations r
  JOIN apartments a ON r.apartment_id = a.id
  WHERE r.status IN ('confirmed', 'pending')
  GROUP BY a.city
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql;
