-- Add optional end time to bookings for duration tracking
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_end_time timestamptz;
