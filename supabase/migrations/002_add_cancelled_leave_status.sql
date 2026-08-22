-- Add the cancelled status used by the frontend leave cancellation flow.
-- Run this first, by itself, and let it finish before running 003.

alter type public.request_status add value if not exists 'cancelled';
