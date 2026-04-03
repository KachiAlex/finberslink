-- List duplicate courses grouped by instructorId and normalized title
WITH ordered AS (
  SELECT "id", "instructorId", title, slug, "createdAt",
    ROW_NUMBER() OVER (
      PARTITION BY "instructorId", lower(trim(title))
      ORDER BY "createdAt" ASC
    ) as rn
  FROM "Course"
  WHERE "archivedAt" IS NULL
)
SELECT rn, "id", "instructorId", title, slug, to_char("createdAt", 'YYYY-MM-DD HH24:MI:SS') AS created_at
FROM ordered
WHERE rn > 1;

-- To archive duplicates (keeps earliest created row and archives others), run the following UPDATE.
-- Be careful: this will modify data. Run the SELECT above first to review duplicates.
--
-- WITH ordered AS (
--   SELECT "id", "instructorId", title, slug, "createdAt",
--     ROW_NUMBER() OVER (
--       PARTITION BY "instructorId", lower(trim(title))
--       ORDER BY "createdAt" ASC
--     ) as rn
--   FROM "Course"
--   WHERE "archivedAt" IS NULL
-- )
-- UPDATE "Course" c
-- SET "archivedAt" = now(), slug = concat(c.slug, '-duplicate-', substring(c.id from 1 for 8))
-- FROM ordered o
-- WHERE c.id = o.id AND o.rn > 1;
