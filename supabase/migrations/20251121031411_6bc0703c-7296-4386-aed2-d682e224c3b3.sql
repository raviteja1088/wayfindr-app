-- Fix signup flow and driver privacy issues

-- 1. Add RLS policy to allow users to insert their own student role on signup
CREATE POLICY "Users can insert their own student role on signup"
  ON public.user_roles FOR INSERT
  WITH CHECK (auth.uid() = user_id AND role = 'student');

-- 2. Create public view for buses that excludes driver_id
CREATE VIEW public.buses_public AS
SELECT id, bus_number, route_name, is_active, created_at, updated_at
FROM public.buses
WHERE is_active = true;

-- 3. Restrict full buses table access to authenticated users only
DROP POLICY IF EXISTS "Everyone can view active buses" ON public.buses;

CREATE POLICY "Authenticated users can view buses"
  ON public.buses FOR SELECT
  TO authenticated
  USING (true);

-- 4. Allow public to read from the buses_public view
GRANT SELECT ON public.buses_public TO anon, authenticated;