BEGIN;

ALTER TABLE "User"
  ADD COLUMN "avatarKey" VARCHAR(40),
  ADD COLUMN "defaultView" VARCHAR(5) NOT NULL DEFAULT 'list';

ALTER TABLE "User" ADD CONSTRAINT "User_defaultView_check"
  CHECK ("defaultView" IN ('list', 'cards'));

COMMIT;
