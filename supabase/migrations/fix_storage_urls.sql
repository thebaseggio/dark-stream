-- Corrige URLs do projeto Supabase antigo para o novo
-- Só funciona se os arquivos existirem nos mesmos caminhos nos buckets novos

UPDATE public.videos
SET
  thumbnail = REPLACE(thumbnail, 'baqvszumalgtgaepxwqq.supabase.co', 'vrokbdihzeucbtatcbfw.supabase.co'),
  "videoUrl" = REPLACE("videoUrl", 'baqvszumalgtgaepxwqq.supabase.co', 'vrokbdihzeucbtatcbfw.supabase.co'),
  "creatorAvatar" = REPLACE("creatorAvatar", 'baqvszumalgtgaepxwqq.supabase.co', 'vrokbdihzeucbtatcbfw.supabase.co')
WHERE thumbnail LIKE '%baqvszumalgtgaepxwqq%'
   OR "videoUrl" LIKE '%baqvszumalgtgaepxwqq%'
   OR "creatorAvatar" LIKE '%baqvszumalgtgaepxwqq%';

UPDATE public.profiles
SET
  "creatorAvatar" = REPLACE("creatorAvatar", 'baqvszumalgtgaepxwqq.supabase.co', 'vrokbdihzeucbtatcbfw.supabase.co')
WHERE "creatorAvatar" LIKE '%baqvszumalgtgaepxwqq%';
