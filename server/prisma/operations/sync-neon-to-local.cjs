const fs = require("node:fs");
const path = require("node:path");
const { PrismaClient } = require("@prisma/client");

const envPath = path.resolve(__dirname, "../../.env");
const envText = fs.readFileSync(envPath, "utf8");

const localMatch = envText.match(/^DATABASE_URL=(["']?)(.+?)\1\s*$/m);
const neonMatch = envText.match(/^#\s*DATABASE_URL=(["']?)(.+?)\1\s*$/m);

if (!localMatch) {
  console.error("No local DATABASE_URL found in .env");
  process.exit(1);
}

if (!neonMatch) {
  console.error("No commented Neon DATABASE_URL found in .env");
  process.exit(1);
}

const localUrl = localMatch[2];
const neonUrl = neonMatch[2];

const source = new PrismaClient({
  datasources: { db: { url: neonUrl } },
});

const target = new PrismaClient({
  datasources: { db: { url: localUrl } },
});

const quote = (name) => `"${String(name).replaceAll('"', '""')}"`;

const getTables = async (db) => {
  return db.$queryRaw`
    select table_name
    from information_schema.tables
    where table_schema = 'public'
      and table_type = 'BASE TABLE'
      and table_name not like '_prisma_%'
    order by table_name
  `;
};

const getColumns = async (db, tableName) => {
  return db.$queryRaw`
    select
      a.attname as column_name,
      pg_catalog.format_type(a.atttypid, a.atttypmod) as type_sql
    from pg_attribute a
    join pg_class c on c.oid = a.attrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = ${tableName}
      and a.attnum > 0
      and not a.attisdropped
    order by a.attnum
  `;
};

const getDependencies = async (db) => {
  return db.$queryRaw`
    select
      child.relname as child,
      parent.relname as parent
    from pg_constraint c
    join pg_class child on child.oid = c.conrelid
    join pg_class parent on parent.oid = c.confrelid
    join pg_namespace n on n.oid = child.relnamespace
    where c.contype = 'f'
      and n.nspname = 'public'
      and child.relname <> parent.relname
  `;
};

const topoSort = (tables, dependencies) => {
  const names = new Set(tables);
  const depsByTable = new Map(tables.map((table) => [table, new Set()]));
  const childrenByParent = new Map(tables.map((table) => [table, new Set()]));

  for (const dependency of dependencies) {
    if (!names.has(dependency.child) || !names.has(dependency.parent)) continue;
    depsByTable.get(dependency.child).add(dependency.parent);
    childrenByParent.get(dependency.parent).add(dependency.child);
  }

  const ready = tables.filter((table) => depsByTable.get(table).size === 0);
  const ordered = [];

  while (ready.length > 0) {
    const table = ready.shift();
    ordered.push(table);

    for (const child of childrenByParent.get(table)) {
      depsByTable.get(child).delete(table);
      if (depsByTable.get(child).size === 0) ready.push(child);
    }
  }

  if (ordered.length === tables.length) return ordered;
  return tables;
};

const normalizeValue = (value, column) => {
  if (typeof value === "bigint") return value;
  if (!value || typeof value !== "object") return value;
  if (/^(numeric|decimal|real|double precision)/.test(column.type_sql)) {
    return value.toString();
  }
  if (column.type_sql === "json" || column.type_sql === "jsonb") {
    return JSON.stringify(value);
  }
  if (value instanceof Date) return value;
  if (Buffer.isBuffer(value)) return value;
  if (typeof value.toString === "function" && value.constructor?.name === "Decimal") {
    return value.toString();
  }
  return JSON.stringify(value);
};

const insertRows = async (tableName, columns, rows) => {
  if (rows.length === 0) return;

  const columnSql = columns.map((column) => quote(column.column_name)).join(", ");
  const quotedTable = quote(tableName);

  for (const row of rows) {
    const values = columns.map((column) => normalizeValue(row[column.column_name], column));
    const placeholders = columns
      .map((column, index) => `$${index + 1}::${column.type_sql}`)
      .join(", ");
    await target.$executeRawUnsafe(
      `insert into ${quotedTable} (${columnSql}) values (${placeholders})`,
      ...values,
    );
  }
};

const resetSequences = async (tableNames) => {
  for (const tableName of tableNames) {
    const sequences = await target.$queryRawUnsafe(
      `
        select column_name, pg_get_serial_sequence($1, column_name) as sequence_name
        from information_schema.columns
        where table_schema = 'public'
          and table_name = $2
      `,
      `public.${tableName}`,
      tableName,
    );

    for (const sequence of sequences) {
      if (!sequence.sequence_name) continue;
      await target.$executeRawUnsafe(
        `
          select setval(
            $1::regclass,
            coalesce((select max(${quote(sequence.column_name)}) from ${quote(tableName)}), 1),
            (select count(*) > 0 from ${quote(tableName)})
          )
        `,
        sequence.sequence_name,
      );
    }
  }
};

const main = async () => {
  const sourceTables = (await getTables(source)).map((row) => row.table_name);
  const targetTables = (await getTables(target)).map((row) => row.table_name);
  const commonTables = targetTables.filter((table) => sourceTables.includes(table));
  const dependencies = await getDependencies(target);
  const orderedTables = topoSort(commonTables, dependencies);

  if (orderedTables.length === 0) {
    console.error("No common tables found between Neon and local database");
    process.exit(1);
  }

  await target.$executeRawUnsafe(
    `truncate table ${commonTables.map(quote).join(", ")} restart identity cascade`,
  );

  for (const tableName of orderedTables) {
    const sourceColumns = (await getColumns(source, tableName)).map((row) => row.column_name);
    const targetColumns = await getColumns(target, tableName);
    const columns = targetColumns.filter((column) => sourceColumns.includes(column.column_name));
    const rows = await source.$queryRawUnsafe(
      `select ${columns.map((column) => quote(column.column_name)).join(", ")} from ${quote(tableName)}`,
    );

    await insertRows(tableName, columns, rows);
    console.log(`${tableName}: ${rows.length}`);
  }

  await resetSequences(commonTables);
};

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await source.$disconnect();
    await target.$disconnect();
  });
