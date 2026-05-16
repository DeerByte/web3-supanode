# Assignment 1 Dev Journal

---

## Assignment 2 Learnings

---

**May 14, 2026**

- When modifying an PostgreSQL table to "AUTOINCREMENT" an id column, one can either migrate the table to a new table with the ID set to BIGSERIAL(int8) or SERIAL(int4), which will autoincrement.
  Alternatively, select the MAX(id) from that table, then use:
  ALTER TABLE table_name ALTER COLUMN col_name ADD ALWAYS GENERATED AS IDENTITY;
  ALTER TABLE table_name ALTER COLUMN column_name RESTART WITH {max + 1}

- If code 23505 appears as a POSTGRESQL error, run

  ` SELECT setval(
pg_get_serial_sequence('table_name', 'id_column'),
(SELECT MAX(id_column) FROM table_name)
);`

Not required if using GUID. UUID?
