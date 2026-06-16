-- Migration: Create triggers for automatic updates
-- Step 13: Triggers for updated_at and profile creation
-- Trigger on auth.users for automatic profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER
INSERT
  ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- Triggers for updated_at on all tables
  DROP TRIGGER IF EXISTS set_updated_at ON public.profiles;
CREATE TRIGGER set_updated_at BEFORE
UPDATE
  ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS set_updated_at ON public.songs;
CREATE TRIGGER set_updated_at BEFORE
UPDATE
  ON public.songs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS set_updated_at ON public.lessons;
CREATE TRIGGER set_updated_at BEFORE
UPDATE
  ON public.lessons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS set_updated_at ON public.lesson_songs;
CREATE TRIGGER set_updated_at BEFORE
UPDATE
  ON public.lesson_songs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS set_updated_at ON public.task_management;
CREATE TRIGGER set_updated_at BEFORE
UPDATE
  ON public.task_management FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- ✅ Triggers created