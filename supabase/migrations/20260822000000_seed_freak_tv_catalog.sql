BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO public.categories (name)
VALUES ('Mistérios')
ON CONFLICT (name) DO NOTHING;

DO $$
BEGIN
  IF to_regclass('public.partners') IS NOT NULL THEN
    EXECUTE $partners$
      INSERT INTO public.partners (
        id,
        name,
        slug,
        bio,
        avatar_url,
        banner_url,
        is_verified,
        created_at
      ) VALUES (
        '11111111-1111-4111-8111-111111111106'::uuid,
        'Freak TV',
        'freak-tv',
        'Casos bizarros, mistérios sem explicação, arquivos confidenciais e investigações sombrias.',
        'https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=500&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80',
        true,
        NOW()
      )
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        bio = EXCLUDED.bio,
        avatar_url = EXCLUDED.avatar_url,
        banner_url = EXCLUDED.banner_url,
        is_verified = EXCLUDED.is_verified
    $partners$;
  END IF;
END $$;

INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, recovery_sent_at, last_sign_in_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES (
  '11111111-1111-4111-8111-111111111106',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'freak.tv@seed.darkstream.test',
  crypt('DarkStream@2026!', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"username":"Freak TV"}'::jsonb,
  now() - interval '45 days',
  now(),
  '', '', '', ''
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  raw_app_meta_data = EXCLUDED.raw_app_meta_data,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data,
  updated_at = now();

INSERT INTO auth.identities (
  id, provider_id, user_id, identity_data, provider,
  last_sign_in_at, created_at, updated_at
) VALUES (
  '11111111-1111-4111-8111-111111111106',
  '11111111-1111-4111-8111-111111111106',
  '11111111-1111-4111-8111-111111111106',
  jsonb_build_object('sub', '11111111-1111-4111-8111-111111111106', 'email', 'freak.tv@seed.darkstream.test'),
  'email',
  now(), now(), now()
)
ON CONFLICT (id) DO UPDATE SET
  provider_id = EXCLUDED.provider_id,
  user_id = EXCLUDED.user_id,
  identity_data = EXCLUDED.identity_data,
  provider = EXCLUDED.provider,
  updated_at = now();

INSERT INTO public.profiles (
  id, username, role, bio, is_partner,
  avatar_url, banner_url, "creatorAvatar",
  youtube_url, instagram_url, x_url
) VALUES (
  '11111111-1111-4111-8111-111111111106',
  'Freak TV',
  'partner',
  'Casos bizarros, mistérios sem explicação, arquivos confidenciais e investigações sombrias.',
  true,
  'https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=500&auto=format&fit=crop&q=80',
  'https://youtube.com/@freaktv',
  'https://instagram.com/freaktv',
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  role = EXCLUDED.role,
  bio = EXCLUDED.bio,
  is_partner = EXCLUDED.is_partner,
  avatar_url = EXCLUDED.avatar_url,
  banner_url = EXCLUDED.banner_url,
  "creatorAvatar" = EXCLUDED."creatorAvatar",
  youtube_url = EXCLUDED.youtube_url,
  instagram_url = EXCLUDED.instagram_url,
  x_url = EXCLUDED.x_url;

INSERT INTO public.videos (
  id, title, description, category, tags, creator_id,
  thumbnail, "videoUrl", views, duration, is_short,
  gostei_muito, gostei, nao_gostei, is_community_suggestion, created_at
) VALUES
  (
    '22222222-2222-4222-8222-222222222226',
    'Arquivo 17: O Apartamento que Respirava',
    E'Moradores de um prédio em São Paulo relataram paredes úmidas, ruídos de respiração e luzes piscando sempre às 3h17.\n\nFreak TV cruza laudos elétricos, boletins de ocorrência e gravações de madrugada para reconstruir a origem do fenômeno.\n\nO último inquilino deixou o imóvel sem retirar nenhum pertence.',
    ARRAY['Nacionais', 'Mistérios', 'Não solucionados']::text[],
    ARRAY['freak tv', 'são paulo', 'apartamento', 'mistério', 'arquivo confidencial']::text[],
    '11111111-1111-4111-8111-111111111106',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=800&auto=format&fit=crop',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    17640,
    2260,
    false,
    264,
    705,
    52,
    false,
    now() - interval '17 days'
  ),
  (
    '22222222-2222-4222-8222-222222222227',
    'A Ligação da Linha Morta',
    E'Uma central telefônica desativada em Minas Gerais voltou a registrar chamadas sem origem durante quatro noites consecutivas.\n\nAs mensagens repetiam nomes de desaparecidos e coordenadas de uma estrada rural.\n\nA investigação Freak TV testa as fitas originais e visita o ponto indicado.',
    ARRAY['Nacionais', 'Mistérios']::text[],
    ARRAY['freak tv', 'minas gerais', 'telefone', 'desaparecidos', 'mistério']::text[],
    '11111111-1111-4111-8111-111111111106',
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    13980,
    1985,
    false,
    209,
    559,
    41,
    false,
    now() - interval '11 days'
  ),
  (
    '22222222-2222-4222-8222-222222222228',
    'Dossiê Serra Negra: A Casa sem Sombra',
    E'Fotografias tiradas entre 1994 e 2024 mostram a mesma casa no interior paulista sem projetar sombra ao meio-dia.\n\nEspecialistas descartam montagem em parte do acervo, mas não explicam os negativos analógicos.\n\nFreak TV abre o dossiê e entrevista a família que guardou as imagens.',
    ARRAY['Nacionais', 'Mistérios', 'Documentários']::text[],
    ARRAY['freak tv', 'serra negra', 'fotografia', 'dossiê', 'mistério']::text[],
    '11111111-1111-4111-8111-111111111106',
    'https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=800&auto=format&fit=crop',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    15820,
    2420,
    false,
    237,
    632,
    47,
    false,
    now() - interval '8 days'
  ),
  (
    '22222222-2222-4222-8222-222222222229',
    'Protocolo Anhangá: O Trem que Não Chegou',
    E'Relatórios ferroviários de 1987 descrevem um trem cargueiro visto por três estações, mas ausente de todos os registros oficiais.\n\nA composição teria transportado caixas lacradas com símbolos militares e desaparecido antes do pátio final.\n\nFreak TV reúne mapas, depoimentos e documentos obtidos por arquivo público.',
    ARRAY['Nacionais', 'Mistérios', 'Não solucionados']::text[],
    ARRAY['freak tv', 'ferrovia', 'arquivo público', 'protocolo', 'mistério']::text[],
    '11111111-1111-4111-8111-111111111106',
    'https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=800&auto=format&fit=crop',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    12110,
    2110,
    false,
    181,
    484,
    36,
    false,
    now() - interval '4 days'
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  tags = EXCLUDED.tags,
  creator_id = EXCLUDED.creator_id,
  thumbnail = EXCLUDED.thumbnail,
  "videoUrl" = EXCLUDED."videoUrl",
  views = EXCLUDED.views,
  duration = EXCLUDED.duration,
  is_short = EXCLUDED.is_short,
  gostei_muito = EXCLUDED.gostei_muito,
  gostei = EXCLUDED.gostei,
  nao_gostei = EXCLUDED.nao_gostei,
  is_community_suggestion = EXCLUDED.is_community_suggestion,
  created_at = EXCLUDED.created_at;

COMMIT;
