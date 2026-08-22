-- =============================================================================
-- Dark Stream — seed de parceiros e vídeos de teste
-- Gerado automaticamente por scripts/generate-seed-sql.mjs
-- =============================================================================
-- 5 parceiros + 1 investigador QA + 29 vídeos
--
-- Senha padrão: DarkStream@2026!
--   marcos.campos@seed.darkstream.test
--   ju.cassini@seed.darkstream.test
--   caixa.pandora@seed.darkstream.test
--   cafezinho@seed.darkstream.test
--   contato@freaktv.com
--   investigador@seed.darkstream.test  (trilho "Recomendados para Você")
--
-- Senhas específicas:
--   contato@freaktv.com: DarkStream@Freak2026
--
-- EXECUÇÃO (SQL Editor ou CLI):
--   npx supabase db execute --file supabase/seed_test_data.sql --linked
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO public.categories (name) VALUES
  ('Nacionais'),
  ('Internacionais'),
  ('Mistérios'),
  ('Não solucionados'),
  ('Solucionados'),
  ('Serial Killers'),
  ('Documentários'),
  ('Sobrenaturais')
ON CONFLICT (name) DO NOTHING;

-- ATENÇÃO: apaga TODOS os vídeos e registros dependentes (feedback, views, etc.)
TRUNCATE TABLE public.videos CASCADE;

-- Remove contas seed anteriores
DELETE FROM auth.identities
WHERE user_id IN (
  '11111111-1111-4111-8111-111111111101'::uuid,
  '11111111-1111-4111-8111-111111111102'::uuid,
  '11111111-1111-4111-8111-111111111105'::uuid,
  '11111111-1111-4111-8111-111111111103'::uuid,
  '11111111-1111-4111-8111-111111111106'::uuid,
  '11111111-1111-4111-8111-111111111104'::uuid
);

DELETE FROM auth.users
WHERE id IN (
  '11111111-1111-4111-8111-111111111101'::uuid,
  '11111111-1111-4111-8111-111111111102'::uuid,
  '11111111-1111-4111-8111-111111111105'::uuid,
  '11111111-1111-4111-8111-111111111103'::uuid,
  '11111111-1111-4111-8111-111111111106'::uuid,
  '11111111-1111-4111-8111-111111111104'::uuid
);

INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, recovery_sent_at, last_sign_in_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES
  (
    '11111111-1111-4111-8111-111111111101',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'marcos.campos@seed.darkstream.test',
    crypt('DarkStream@2026!', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"username":"Marcos Campos"}'::jsonb,
    now() - interval '400 days',
    now(),
    '', '', '', ''
  ),
  (
    '11111111-1111-4111-8111-111111111102',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'ju.cassini@seed.darkstream.test',
    crypt('DarkStream@2026!', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"username":"Ju Cassini"}'::jsonb,
    now() - interval '320 days',
    now(),
    '', '', '', ''
  ),
  (
    '11111111-1111-4111-8111-111111111105',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'caixa.pandora@seed.darkstream.test',
    crypt('DarkStream@2026!', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"username":"Caixa de Pandora"}'::jsonb,
    now() - interval '290 days',
    now(),
    '', '', '', ''
  ),
  (
    '11111111-1111-4111-8111-111111111103',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'cafezinho@seed.darkstream.test',
    crypt('DarkStream@2026!', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"username":"Cafezinho Investigativo"}'::jsonb,
    now() - interval '260 days',
    now(),
    '', '', '', ''
  ),
  (
    '11111111-1111-4111-8111-111111111106',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'contato@freaktv.com',
    crypt('DarkStream@Freak2026', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"username":"Freak TV"}'::jsonb,
    now() - interval '45 days',
    now(),
    '', '', '', ''
  ),
  (
    '11111111-1111-4111-8111-111111111104',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'investigador@seed.darkstream.test',
    crypt('DarkStream@2026!', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"username":"Investigador QA"}'::jsonb,
    now() - interval '120 days',
    now(),
    '', '', '', ''
  );

INSERT INTO auth.identities (
  id, provider_id, user_id, identity_data, provider,
  last_sign_in_at, created_at, updated_at
) VALUES
  (
    '11111111-1111-4111-8111-111111111101',
    '11111111-1111-4111-8111-111111111101',
    '11111111-1111-4111-8111-111111111101',
    jsonb_build_object('sub', '11111111-1111-4111-8111-111111111101', 'email', 'marcos.campos@seed.darkstream.test'),
    'email',
    now(), now(), now()
  ),
  (
    '11111111-1111-4111-8111-111111111102',
    '11111111-1111-4111-8111-111111111102',
    '11111111-1111-4111-8111-111111111102',
    jsonb_build_object('sub', '11111111-1111-4111-8111-111111111102', 'email', 'ju.cassini@seed.darkstream.test'),
    'email',
    now(), now(), now()
  ),
  (
    '11111111-1111-4111-8111-111111111105',
    '11111111-1111-4111-8111-111111111105',
    '11111111-1111-4111-8111-111111111105',
    jsonb_build_object('sub', '11111111-1111-4111-8111-111111111105', 'email', 'caixa.pandora@seed.darkstream.test'),
    'email',
    now(), now(), now()
  ),
  (
    '11111111-1111-4111-8111-111111111103',
    '11111111-1111-4111-8111-111111111103',
    '11111111-1111-4111-8111-111111111103',
    jsonb_build_object('sub', '11111111-1111-4111-8111-111111111103', 'email', 'cafezinho@seed.darkstream.test'),
    'email',
    now(), now(), now()
  ),
  (
    '11111111-1111-4111-8111-111111111106',
    '11111111-1111-4111-8111-111111111106',
    '11111111-1111-4111-8111-111111111106',
    jsonb_build_object('sub', '11111111-1111-4111-8111-111111111106', 'email', 'contato@freaktv.com'),
    'email',
    now(), now(), now()
  ),
  (
    '11111111-1111-4111-8111-111111111104',
    '11111111-1111-4111-8111-111111111104',
    '11111111-1111-4111-8111-111111111104',
    jsonb_build_object('sub', '11111111-1111-4111-8111-111111111104', 'email', 'investigador@seed.darkstream.test'),
    'email',
    now(), now(), now()
  );

INSERT INTO public.profiles (
  id, username, role, bio, is_partner,
  avatar_url, banner_url, "creatorAvatar",
  youtube_url, instagram_url, x_url
) VALUES
  (
    '11111111-1111-4111-8111-111111111101',
    'Marcos Campos',
    'partner',
    'Jornalista investigativo focado em casos criminais no Sul do Brasil. Arquivo aberto, evidências frias.',
    true,
    'https://ui-avatars.com/api/?name=Marcos+Campos&background=111111&color=f1c40f&bold=true&size=256',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop',
    'https://ui-avatars.com/api/?name=Marcos+Campos&background=111111&color=f1c40f&bold=true&size=256',
    'https://youtube.com/@marcoscampos',
    'https://instagram.com/marcoscampos',
    'https://x.com/marcoscampos'
  ),
  (
    '11111111-1111-4111-8111-111111111102',
    'Ju Cassini',
    'partner',
    'Criadora de conteúdo e diretora. Produções independentes de terror, curtas-metragens e análises de suspense.',
    true,
    'https://ui-avatars.com/api/?name=Ju+Cassini&background=1a0a14&color=eab308&bold=true&size=256',
    'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?q=80&w=800&auto=format&fit=crop',
    'https://ui-avatars.com/api/?name=Ju+Cassini&background=1a0a14&color=eab308&bold=true&size=256',
    'https://youtube.com/@jucassini',
    'https://instagram.com/jucassini',
    NULL
  ),
  (
    '11111111-1111-4111-8111-111111111105',
    'Caixa de Pandora',
    'partner',
    'Investigações aprofundadas sobre mistérios, casos criminais e teorias de conspiração do canal Caixa de Pandora.',
    true,
    'https://ui-avatars.com/api/?name=Caixa+de+Pandora&background=0a0a0a&color=eab308&bold=true&size=256',
    'https://images.unsplash.com/photo-1578662996442-48f601eca288?q=80&w=800&auto=format&fit=crop',
    'https://ui-avatars.com/api/?name=Caixa+de+Pandora&background=0a0a0a&color=eab308&bold=true&size=256',
    'https://youtube.com/@caixadepandora',
    'https://instagram.com/caixadepandora',
    'https://x.com/caixadepandora'
  ),
  (
    '11111111-1111-4111-8111-111111111103',
    'Cafezinho Investigativo',
    'partner',
    'Canal colaborativo de true crime internacional — um café, um caso, uma teoria por episódio.',
    true,
    'https://ui-avatars.com/api/?name=Cafezinho&background=0f0406&color=f1c40f&bold=true&size=256',
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=800&auto=format&fit=crop',
    'https://ui-avatars.com/api/?name=Cafezinho&background=0f0406&color=f1c40f&bold=true&size=256',
    'https://youtube.com/@cafezinhoinvestigativo',
    'https://instagram.com/cafezinhoinvestigativo',
    'https://x.com/cafezinho_cases'
  ),
  (
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
  ),
  (
    '11111111-1111-4111-8111-111111111104',
    'Investigador QA',
    'visitor',
    'Conta de teste para validar recomendações e carrosséis antes do envio de e-mails.',
    false,
    NULL, NULL, NULL, NULL, NULL, NULL
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
    '22222222-2222-4222-8222-222222222201',
    'A Estrada 66 do Paraná: Os Desaparecimentos de 1998',
    E'Quatro motoristas sumiram na BR-277 entre março e agosto de 1998.

Testemunhas descrevem faróis apagados e uma camionete preta sem placa.

Reconstruímos rotas, depoimentos e um mapa de calor nunca divulgado.',
    ARRAY['Nacionais', 'Não solucionados']::text[],
    ARRAY['paraná', 'desaparecimento', 'estrada', 'cold case']::text[],
    '11111111-1111-4111-8111-111111111101',
    'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=800&auto=format&fit=crop',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    18420,
    2340,
    false,
    276,
    736,
    55,
    false,
    now() - interval '45 days'
  ),
  (
    '22222222-2222-4222-8222-222222222202',
    'Operação Cold Case: O Assassinato em Curitiba',
    E'Um empresário foi encontrado amarrado em um galpão abandonado no Boqueirão.

Marcas de arrasto e sangue secundário contradiziam a tese inicial de suicídio.

A prisão do responsável só veio quatorze anos depois.',
    ARRAY['Nacionais', 'Solucionados']::text[],
    ARRAY['curitiba', 'homicídio', 'inquérito', 'solucionado']::text[],
    '11111111-1111-4111-8111-111111111101',
    'https://images.unsplash.com/photo-1509245858120-9a2ee496571b?q=80&w=800&auto=format&fit=crop',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    9210,
    1980,
    false,
    138,
    368,
    27,
    false,
    now() - interval '30 days'
  ),
  (
    '22222222-2222-4222-8222-222222222203',
    'O Manuscrito do Sítio Amarelo',
    E'Um diário encadernado em couro surgiu enterrado sob uma mangueira em Goiás.

Páginas descrevem encontros noturnos e coordenadas de três propriedades rurais.

O original desapareceu da custódia policial.',
    ARRAY['Nacionais', 'Documentários']::text[],
    ARRAY['goiás', 'manuscrito', 'mistério', 'arquivo']::text[],
    '11111111-1111-4111-8111-111111111101',
    'https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=800&auto=format&fit=crop',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    5670,
    2715,
    false,
    85,
    226,
    17,
    false,
    now() - interval '18 days'
  ),
  (
    '22222222-2222-4222-8222-222222222204',
    'Matador da BR-116: A Série de 2001',
    E'Seis corpos foram encontrados em um intervalo de dez semanas na BR-116.

Padrões de amarração idênticos apontavam para um único autor.

Reabrimos o inquérito com DNA parcial recuperado.',
    ARRAY['Nacionais', 'Não solucionados', 'Serial Killers']::text[],
    ARRAY['br-116', 'serial killer', 'sul', 'cold case']::text[],
    '11111111-1111-4111-8111-111111111101',
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=800&auto=format&fit=crop',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    14300,
    2520,
    false,
    214,
    572,
    42,
    false,
    now() - interval '52 days'
  ),
  (
    '22222222-2222-4222-8222-222222222205',
    'O Porão de Porto Alegre',
    E'Moradores reportaram gritos vindos de um imóvel vazio no bairro Cidade Baixa.

A polícia encontrou câmaras de isolamento acústico e diários codificados.

Ninguém foi indiciado — até hoje.',
    ARRAY['Nacionais', 'Não solucionados']::text[],
    ARRAY['porto alegre', 'porão', 'mistério', 'inquérito']::text[],
    '11111111-1111-4111-8111-111111111101',
    'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=800&auto=format&fit=crop',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    11240,
    2190,
    false,
    168,
    449,
    33,
    false,
    now() - interval '22 days'
  ),
  (
    '22222222-2222-4222-8222-222222222206',
    'Desaparecida em Ouro Preto',
    E'Uma estudante de arqueologia sumiu após visitar uma igreja fechada.

Câmeras captaram uma figura encapuzada na colina adjacent.

Analisamos registros acadêmicos e um pen drive esquecido.',
    ARRAY['Nacionais', 'Não solucionados']::text[],
    ARRAY['minas gerais', 'desaparecimento', 'ouro preto', 'cold case']::text[],
    '11111111-1111-4111-8111-111111111101',
    'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=800&auto=format&fit=crop',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    9870,
    2040,
    false,
    148,
    394,
    29,
    false,
    now() - interval '14 days'
  ),
  (
    '22222222-2222-4222-8222-222222222207',
    'A Testemunha de Recife',
    E'Uma ex-funcionária do fórum gravou conversas sobre um processo selado.

Quarenta e oito horas depois, ela desapareceu.

Reconstituímos a timeline com gravações recuperadas.',
    ARRAY['Nacionais', 'Documentários']::text[],
    ARRAY['recife', 'testemunha', 'arquivo', 'mistério']::text[],
    '11111111-1111-4111-8111-111111111101',
    'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=800&auto=format&fit=crop',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    7650,
    1860,
    false,
    114,
    306,
    22,
    false,
    now() - interval '9 days'
  ),
  (
    '22222222-2222-4222-8222-222222222208',
    'Arquivo SP-1988: O Caso da Galeria',
    E'Cinco obras desapareceram de uma galeria no centro de São Paulo.

No lugar delas, cartões com coordenadas e datas futuras.

Investigamos conexões com desaparecimentos contemporâneos.',
    ARRAY['Nacionais', 'Não solucionados']::text[],
    ARRAY['são paulo', '1988', 'galeria', 'cold case']::text[],
    '11111111-1111-4111-8111-111111111101',
    'https://images.unsplash.com/photo-1526778548025-fa2f5cd551c8?q=80&w=800&auto=format&fit=crop',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
    6540,
    1755,
    false,
    98,
    261,
    19,
    false,
    now() - interval '6 days'
  ),
  (
    '22222222-2222-4222-8222-222222222226',
    'Arquivo 17: O Apartamento que Respirava',
    E'Moradores de um prédio em São Paulo relataram paredes úmidas, ruídos de respiração e luzes piscando sempre às 3h17.

Freak TV cruza laudos elétricos, boletins de ocorrência e gravações de madrugada para reconstruir a origem do fenômeno.

O último inquilino deixou o imóvel sem retirar nenhum pertence.',
    ARRAY['Nacionais', 'Mistérios', 'Não solucionados']::text[],
    ARRAY['freak tv', 'são paulo', 'apartamento', 'mistério', 'arquivo confidencial']::text[],
    '11111111-1111-4111-8111-111111111106',
    'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=800&auto=format&fit=crop',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
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
    E'Uma central telefônica desativada em Minas Gerais voltou a registrar chamadas sem origem durante quatro noites consecutivas.

As mensagens repetiam nomes de desaparecidos e coordenadas de uma estrada rural.

A investigação Freak TV testa as fitas originais e visita o ponto indicado.',
    ARRAY['Nacionais', 'Mistérios']::text[],
    ARRAY['freak tv', 'minas gerais', 'telefone', 'desaparecidos', 'mistério']::text[],
    '11111111-1111-4111-8111-111111111106',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
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
    E'Fotografias tiradas entre 1994 e 2024 mostram a mesma casa no interior paulista sem projetar sombra ao meio-dia.

Especialistas descartam montagem em parte do acervo, mas não explicam os negativos analógicos.

Freak TV abre o dossiê e entrevista a família que guardou as imagens.',
    ARRAY['Nacionais', 'Mistérios', 'Documentários']::text[],
    ARRAY['freak tv', 'serra negra', 'fotografia', 'dossiê', 'mistério']::text[],
    '11111111-1111-4111-8111-111111111106',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop',
    'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8',
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
    E'Relatórios ferroviários de 1987 descrevem um trem cargueiro visto por três estações, mas ausente de todos os registros oficiais.

A composição teria transportado caixas lacradas com símbolos militares e desaparecido antes do pátio final.

Freak TV reúne mapas, depoimentos e documentos obtidos por arquivo público.',
    ARRAY['Nacionais', 'Mistérios', 'Não solucionados']::text[],
    ARRAY['freak tv', 'ferrovia', 'arquivo público', 'protocolo', 'mistério']::text[],
    '11111111-1111-4111-8111-111111111106',
    'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?q=80&w=800&auto=format&fit=crop',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    12110,
    2110,
    false,
    181,
    484,
    36,
    false,
    now() - interval '4 days'
  ),
  (
    '22222222-2222-4222-8222-222222222209',
    'Colombia 289: O Voo que Nunca Pousou',
    E'O voo 289 perdeu contato por 41 minutos sobre os Andes.

Quando reapareceu, todos os passageiros estavam inconscientes.

Nenhuma explicação oficial foi publicada.',
    ARRAY['Internacionais', 'Não solucionados']::text[],
    ARRAY['colômbia', 'aviação', 'desaparecimento', 'andean']::text[],
    '11111111-1111-4111-8111-111111111103',
    'https://images.unsplash.com/photo-1550684848-fc0739664c97?q=80&w=800&auto=format&fit=crop',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    31200,
    3250,
    false,
    468,
    1248,
    93,
    false,
    now() - interval '70 days'
  ),
  (
    '22222222-2222-4222-8222-222222222210',
    'London Ripper 2.0: Cópia ou Continuação?',
    E'Cinco crimes no East End reproduziram padrões do Jack, the Ripper.

Scotland Yard classificou como imitador solitário.

Forense independente aponta assinatura incompatível.',
    ARRAY['Internacionais', 'Serial Killers']::text[],
    ARRAY['londres', 'serial killer', 'jack the ripper', 'cold case']::text[],
    '11111111-1111-4111-8111-111111111103',
    'https://images.unsplash.com/photo-1589829085413-51b5876a6623?q=80&w=800&auto=format&fit=crop',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    19880,
    2460,
    false,
    298,
    795,
    59,
    false,
    now() - interval '40 days'
  ),
  (
    '22222222-2222-4222-8222-222222222211',
    'Tóquio Subterrâneo: Os Túneis Proibidos',
    E'Funcionários relatam corredores não mapeados no metrô de Tóquio.

Uma equipe de urban exploration sumiu após 17 minutos de live.

Recuperamos frames e a última coordenada GPS.',
    ARRAY['Internacionais', 'Não solucionados']::text[],
    ARRAY['tóquio', 'urban exploration', 'metrô', 'desaparecimento']::text[],
    '11111111-1111-4111-8111-111111111103',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=800&auto=format&fit=crop',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    14220,
    2100,
    false,
    213,
    568,
    42,
    false,
    now() - interval '15 days'
  ),
  (
    '22222222-2222-4222-8222-222222222212',
    'Berlin Shadow Protocol',
    E'Documentos vazados descrevem operações noturnas em túneis da Guerra Fria.

Três jornalistas que investigavam o tema sofreram acidentes no mesmo mês.

Comparamos arquivos FOIA e registros hospitalares.',
    ARRAY['Internacionais', 'Documentários']::text[],
    ARRAY['berlim', 'arquivo', 'guerra fria', 'mistério']::text[],
    '11111111-1111-4111-8111-111111111103',
    'https://images.unsplash.com/photo-1489599849927-2fa91ead8788?q=80&w=800&auto=format&fit=crop',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    12950,
    2380,
    false,
    194,
    518,
    38,
    false,
    now() - interval '33 days'
  ),
  (
    '22222222-2222-4222-8222-222222222213',
    'Chicago Labyrinth: O Porão da Union Station',
    E'Trabalhadores encontraram compartimentos ocultos durante reforma.

Graffiti datado de 1974 menciona nomes de pessoas desaparecidas.

Mapeamos níveis não catalogados.',
    ARRAY['Internacionais', 'Não solucionados']::text[],
    ARRAY['chicago', 'desaparecimento', 'porão', 'cold case']::text[],
    '11111111-1111-4111-8111-111111111103',
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=800&auto=format&fit=crop',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    11800,
    2220,
    false,
    177,
    472,
    35,
    false,
    now() - interval '27 days'
  ),
  (
    '22222222-2222-4222-8222-222222222214',
    'Sahara Signal 404',
    E'Expedição desapareceu após transmitir coordenadas impossíveis.

Satélites registraram flash térmico no deserto.

Analisamos logs de rádio e restos de acampamento.',
    ARRAY['Internacionais', 'Não solucionados']::text[],
    ARRAY['saara', 'expedição', 'desaparecimento', 'mistério']::text[],
    '11111111-1111-4111-8111-111111111103',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    9340,
    1950,
    false,
    140,
    373,
    28,
    false,
    now() - interval '19 days'
  ),
  (
    '22222222-2222-4222-8222-222222222215',
    'Oslo Midnight Caller',
    E'Ligações anônimas alertavam sobre crimes 48 horas antes de ocorrerem.

A polícia registrou 11 acertos consecutivos.

Quem tinha acesso às ocorrências em tempo real?',
    ARRAY['Internacionais', 'Solucionados']::text[],
    ARRAY['oslo', 'telefone', 'predição', 'inquérito']::text[],
    '11111111-1111-4111-8111-111111111103',
    'https://images.unsplash.com/photo-1534447675818-99d6d054b2c2?q=80&w=800&auto=format&fit=crop',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    8120,
    1680,
    false,
    121,
    324,
    24,
    false,
    now() - interval '11 days'
  ),
  (
    '22222222-2222-4222-8222-222222222216',
    'Buenos Aires Vault: Arquivo Classificado',
    E'Um cofre lacrado foi aberto após enchente em subsolo governamental.

Fichas descrevem interrogatórios sem data e sem nome.

Traduzimos registros e entrevistamos ex-agentes.',
    ARRAY['Internacionais', 'Documentários']::text[],
    ARRAY['buenos aires', 'arquivo', 'ditadura', 'mistério']::text[],
    '11111111-1111-4111-8111-111111111103',
    'https://images.unsplash.com/photo-1560174037-3b98236c7eca?q=80&w=800&auto=format&fit=crop',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
    7450,
    1845,
    false,
    111,
    298,
    22,
    false,
    now() - interval '8 days'
  ),
  (
    '22222222-2222-4222-8222-222222222225',
    'PARANOIA',
    E'Curta-metragem de suspense psicológico.

Uma editora noturna começa a receber takes de câmeras de segurança da própria casa — filmadas enquanto ela dorme.

Produção independente escrita e dirigida por Ju Cassini.',
    ARRAY['Nacionais', 'Documentários']::text[],
    ARRAY['curta', 'terror', 'suspense', 'paranoia']::text[],
    '11111111-1111-4111-8111-111111111102',
    'https://images.unsplash.com/photo-1578662996442-48f601eca288?q=80&w=800&auto=format&fit=crop',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    28400,
    840,
    false,
    426,
    1136,
    85,
    false,
    now() - interval '3 days'
  ),
  (
    '22222222-2222-4222-8222-222222222218',
    'A Casa da Colina: 14 Anos de Atividade Paranormal',
    E'Residência em Petrópolis foi desocupada sete vezes entre 2008 e 2022.

Passos no sótão, vozes em latim e uma porta que só abre por dentro.

Documentário de terror independente — direção Ju Cassini.',
    ARRAY['Sobrenaturais', 'Documentários']::text[],
    ARRAY['petrópolis', 'terror', 'documentário', 'casa assombrada']::text[],
    '11111111-1111-4111-8111-111111111102',
    'https://images.unsplash.com/photo-1590856020156-8665f259f3a6?q=80&w=800&auto=format&fit=crop',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    11340,
    2890,
    false,
    170,
    453,
    34,
    false,
    now() - interval '25 days'
  ),
  (
    '22222222-2222-4222-8222-222222222219',
    'Hostess do Inferno: A Aeromoça Fantasma',
    E'Passageiros reportaram comissária uniformizada fora da escala.

Ela serviu bebidas, sussurrou um nome e sumiu antes do pouso.

Curta de suspense sobrenatural — produção Ju Cassini.',
    ARRAY['Sobrenaturais', 'Nacionais']::text[],
    ARRAY['aviação', 'terror', 'curta', 'suspense']::text[],
    '11111111-1111-4111-8111-111111111102',
    'https://images.unsplash.com/photo-1605649487212-47bdab064df7?q=80&w=800&auto=format&fit=crop',
    'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8',
    8750,
    1860,
    false,
    131,
    350,
    26,
    false,
    now() - interval '12 days'
  ),
  (
    '22222222-2222-4222-8222-222222222221',
    'Hospital Infantil Fantasma',
    E'Prédio desativado em Salvador ainda recebe chamadas internas.

Enfermeiros noturnos relatam carrinhos se movendo sozinhos.

Análise cinematográfica de registros found footage — Ju Cassini.',
    ARRAY['Sobrenaturais', 'Nacionais']::text[],
    ARRAY['salvador', 'terror', 'found footage', 'suspense']::text[],
    '11111111-1111-4111-8111-111111111102',
    'https://images.unsplash.com/photo-1611194339398-2d876353da2a?q=80&w=800&auto=format&fit=crop',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    9680,
    2145,
    false,
    145,
    387,
    29,
    false,
    now() - interval '21 days'
  ),
  (
    '22222222-2222-4222-8222-222222222223',
    'Sombras de Nazaré: O Milagre Negativo',
    E'Durante procissão, fiéis filmaram silhueta caminhando sobre as ondas.

Vídeos sumiram das redes em minutos.

Montagem autoral sobre medo coletivo e crença — direção Ju Cassini.',
    ARRAY['Sobrenaturais', 'Documentários']::text[],
    ARRAY['nazaré', 'suspense', 'vídeo', 'curta']::text[],
    '11111111-1111-4111-8111-111111111102',
    'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=800&auto=format&fit=crop',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    7120,
    1770,
    false,
    106,
    284,
    21,
    false,
    now() - interval '10 days'
  ),
  (
    '22222222-2222-4222-8222-222222222217',
    'Project Blue Book Brasil: Varginha Revisitado',
    E'Arquivos desclassificados e relatos militares de janeiro de 1996.

Cruzamos depoimentos, registros hospitalares e um dossiê da deep web.

Investigação Caixa de Pandora — três oficiais mudaram de versão na mesma semana.',
    ARRAY['Sobrenaturais', 'Nacionais']::text[],
    ARRAY['varginha', 'ovni', 'desclassificado', 'conspiração']::text[],
    '11111111-1111-4111-8111-111111111105',
    'https://images.unsplash.com/photo-1509245858120-9a2ee496571b?q=80&w=800&auto=format&fit=crop',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    24100,
    3120,
    false,
    361,
    964,
    72,
    false,
    now() - interval '60 days'
  ),
  (
    '22222222-2222-4222-8222-222222222220',
    'Rádio 666 AM: Transmissões Impossíveis',
    E'Em noites de neblina, uma frequência captou vozes pedindo socorro.

Torres oficiais negam emissão na faixa.

Caixa de Pandora isola gravações e triangula a origem.',
    ARRAY['Sobrenaturais', 'Não solucionados']::text[],
    ARRAY['rádio', 'mistério', 'neblina', 'investigação']::text[],
    '11111111-1111-4111-8111-111111111105',
    'https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=800&auto=format&fit=crop',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    10220,
    2010,
    false,
    153,
    408,
    30,
    false,
    now() - interval '36 days'
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    'Estrada dos Compulsores',
    E'Motoristas juram ser seguidos por faróis duplos na BR-262.

Relatos datam de 1979 e continuam em 2024.

Cruzamos acidentes, mapas e depoimentos idênticos — arquivo Caixa de Pandora.',
    ARRAY['Sobrenaturais', 'Não solucionados']::text[],
    ARRAY['estrada', 'faróis', 'cold case', 'conspiração']::text[],
    '11111111-1111-4111-8111-111111111105',
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=800&auto=format&fit=crop',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    8340,
    1920,
    false,
    125,
    333,
    25,
    false,
    now() - interval '16 days'
  ),
  (
    '22222222-2222-4222-8222-222222222224',
    'Protocolo Orpheus: Gravações Subaquáticas',
    E'Expedição científica captou batidas rítmicas a 900 metros de profundidade.

Sonar descartou embarcações próximas.

Investigação Caixa de Pandora revisita logs e entrevista o único sobrevivente.',
    ARRAY['Sobrenaturais', 'Internacionais', 'Não solucionados']::text[],
    ARRAY['oceano', 'sonar', 'desaparecimento', 'expedição']::text[],
    '11111111-1111-4111-8111-111111111105',
    'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=800&auto=format&fit=crop',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    6890,
    2055,
    false,
    103,
    275,
    20,
    false,
    now() - interval '5 days'
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

INSERT INTO public.user_feedback (user_id, video_id, rating)
VALUES
  ('11111111-1111-4111-8111-111111111104'::uuid, '22222222-2222-4222-8222-222222222201'::uuid, 'like'),
  ('11111111-1111-4111-8111-111111111104'::uuid, '22222222-2222-4222-8222-222222222202'::uuid, 'like'),
  ('11111111-1111-4111-8111-111111111104'::uuid, '22222222-2222-4222-8222-222222222209'::uuid, 'like')
ON CONFLICT (user_id, video_id) DO UPDATE SET rating = EXCLUDED.rating;

COMMIT;

-- Verificação por trilho
SELECT cat.name AS trilho, count(v.id) AS videos
FROM public.categories cat
LEFT JOIN public.videos v
  ON v.category @> ARRAY[cat.name]::text[]
  AND v.is_short = false
  AND v.parent_video_id IS NULL
WHERE cat.name IN ('Nacionais', 'Internacionais', 'Mistérios', 'Não solucionados', 'Sobrenaturais')
GROUP BY cat.name
ORDER BY cat.name;
