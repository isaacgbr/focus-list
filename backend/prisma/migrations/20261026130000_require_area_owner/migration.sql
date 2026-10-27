-- Banco sem dados legados. Falha explicitamente caso existam Áreas sem dono;
-- não inventa proprietários nem remove dados.
ALTER TABLE "Area" ALTER COLUMN "userId" SET NOT NULL;
