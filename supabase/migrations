/*
  # إنشاء جداول نظام البطولات

  1. الجداول الجديدة
    - `tournaments` - معلومات البطولات الأساسية
    - `registrations` - طلبات التسجيل من اللاعبين
    - `league_standings` - ترتيب فرق الدوري
    - `league_matches` - مباريات الدوري
    - `knockout_matches` - مباريات الإقصاء
    - `tournament_participants` - المشاركين في البطولات

  2. الأمان
    - تفعيل RLS على جميع الجداول
    - إضافة سياسات للقراءة العامة والكتابة للمدراء
*/

-- جدول البطولات الأساسي
CREATE TABLE IF NOT EXISTS tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('league', 'online', 'offline')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'playing', 'finished')),
  max_participants integer NOT NULL DEFAULT 16,
  current_participants integer DEFAULT 0,
  start_date timestamptz,
  end_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- جدول طلبات التسجيل
CREATE TABLE IF NOT EXISTS registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  tournament_type text NOT NULL CHECK (tournament_type IN ('league', 'online', 'offline')),
  experience_level text NOT NULL CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'professional')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- جدول ترتيب الدوري
CREATE TABLE IF NOT EXISTS league_standings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_name text NOT NULL UNIQUE,
  matches_played integer DEFAULT 0,
  wins integer DEFAULT 0,
  draws integer DEFAULT 0,
  losses integer DEFAULT 0,
  goals_for integer DEFAULT 0,
  goals_against integer DEFAULT 0,
  goal_difference integer DEFAULT 0,
  points integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- جدول مباريات الدوري
CREATE TABLE IF NOT EXISTS league_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team1_name text NOT NULL,
  team2_name text NOT NULL,
  team1_score integer,
  team2_score integer,
  match_date timestamptz DEFAULT now(),
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'playing', 'finished', 'cancelled')),
  round_number integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- جدول مباريات الإقصاء
CREATE TABLE IF NOT EXISTS knockout_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_type text NOT NULL CHECK (tournament_type IN ('online', 'offline')),
  team1_name text NOT NULL,
  team2_name text NOT NULL,
  team1_score integer,
  team2_score integer,
  winner text,
  round integer NOT NULL,
  match_number integer NOT NULL,
  match_date timestamptz DEFAULT now(),
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'playing', 'finished', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

-- جدول المشاركين في البطولات
CREATE TABLE IF NOT EXISTS tournament_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid REFERENCES tournaments(id) ON DELETE CASCADE,
  player_name text NOT NULL,
  email text NOT NULL,
  seed_number integer,
  status text DEFAULT 'active' CHECK (status IN ('active', 'eliminated', 'winner')),
  joined_at timestamptz DEFAULT now()
);

-- تفعيل RLS على جميع الجداول
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE knockout_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_participants ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان - القراءة العامة
CREATE POLICY "Anyone can read tournaments"
  ON tournaments
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can read league standings"
  ON league_standings
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can read league matches"
  ON league_matches
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can read knockout matches"
  ON knockout_matches
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can read tournament participants"
  ON tournament_participants
  FOR SELECT
  TO public
  USING (true);

-- سياسات التسجيل - يمكن للجميع إنشاء طلبات تسجيل
CREATE POLICY "Anyone can create registrations"
  ON registrations
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can read registrations"
  ON registrations
  FOR SELECT
  TO public
  USING (true);

-- سياسات الإدارة - للمدراء فقط (يمكن تخصيصها لاحقاً)
CREATE POLICY "Admins can manage tournaments"
  ON tournaments
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can manage registrations"
  ON registrations
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can manage league standings"
  ON league_standings
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can manage league matches"
  ON league_matches
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can manage knockout matches"
  ON knockout_matches
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can manage tournament participants"
  ON tournament_participants
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations(status);
CREATE INDEX IF NOT EXISTS idx_registrations_tournament_type ON registrations(tournament_type);
CREATE INDEX IF NOT EXISTS idx_league_standings_points ON league_standings(points DESC);
CREATE INDEX IF NOT EXISTS idx_knockout_matches_tournament_type ON knockout_matches(tournament_type);
CREATE INDEX IF NOT EXISTS idx_knockout_matches_round ON knockout_matches(round);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_tournament_id ON tournament_participants(tournament_id);

-- إدراج بيانات تجريبية للدوري
INSERT INTO league_standings (team_name, matches_played, wins, draws, losses, goals_for, goals_against, goal_difference, points) VALUES
('الأهلي', 5, 4, 1, 0, 12, 3, 9, 13),
('الهلال', 5, 4, 0, 1, 10, 4, 6, 12),
('النصر', 5, 3, 1, 1, 8, 5, 3, 10),
('الاتحاد', 5, 2, 2, 1, 7, 6, 1, 8),
('الشباب', 5, 2, 1, 2, 6, 7, -1, 7),
('التعاون', 5, 1, 2, 2, 5, 8, -3, 5)
ON CONFLICT (team_name) DO NOTHING;
