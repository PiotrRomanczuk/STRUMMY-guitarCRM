-- Create user_roles table for role-based access
CREATE TABLE public.user_roles (
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  role public.user_role NOT NULL,
  PRIMARY KEY (user_id, role)
);
-- Index for fast role lookup
CREATE INDEX idx_user_roles_user_id ON public.user_roles (user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles (role);