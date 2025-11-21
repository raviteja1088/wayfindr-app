-- Fix Security Definer View issue by recreating the view with explicit SECURITY INVOKER
DROP VIEW IF EXISTS public.buses_public;

CREATE VIEW public.buses_public 
WITH (security_invoker = true)
AS
SELECT id, bus_number, route_name, is_active, created_at, updated_at
FROM public.buses
WHERE is_active = true;