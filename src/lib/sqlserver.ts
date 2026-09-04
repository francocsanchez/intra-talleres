import sql from "mssql";

import type {
  UnidadDTO,
  UnidadMarcaOptionDTO,
  UnidadModeloOptionDTO,
} from "@/lib/types";

declare global {
  var sqlPoolPromise: Promise<sql.ConnectionPool> | undefined;
}

const sqlConfig: sql.config = {
  user: process.env.DBUSER_NIC || "Consulta",
  password: process.env.DBPASS_NIC || "ConSQL034NI",
  server: process.env.DBHOST_NIC || "192.168.100.15",
  port: Number(process.env.DBPORT_NIC || 1433),
  database: process.env.DATABASE_NIC || "Siac",
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
  pool: {
    max: 4,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

async function getSqlPool() {
  if (!global.sqlPoolPromise) {
    global.sqlPoolPromise = sql.connect(sqlConfig).then((pool) => {
      pool.on("error", () => {
        global.sqlPoolPromise = undefined;
      });

      return pool;
    }).catch((error) => {
      global.sqlPoolPromise = undefined;
      throw error;
    });
  }

  try {
    const pool = await global.sqlPoolPromise;

    if (!pool.connected) {
      global.sqlPoolPromise = undefined;
      return getSqlPool();
    }

    return pool;
  } catch (error) {
    global.sqlPoolPromise = undefined;
    throw error;
  }
}

export async function fetchUnidadByInterno(interno: string) {
  const pool = await getSqlPool();
  const result = await pool
    .request()
    .input("interno", sql.VarChar(32), interno)
    .query<{
      interno: string;
      dominio: string | null;
      marca: string | null;
      modelo: string | null;
      km: number | null;
      chasis: string | null;
    }>(`
      SELECT TOP 1
        CAST(sa.sa_codigo AS VARCHAR(32)) AS interno,
        LTRIM(RTRIM(anx.aus_dominio)) AS dominio,
        LTRIM(RTRIM(m.mar_nombre)) AS marca,
        LTRIM(RTRIM(a.au_nombre)) AS modelo,
        anx.aus_km AS km,
        LTRIM(RTRIM(anx.aus_chasis)) AS chasis
      FROM siac.dbo.stoauto sa
      LEFT JOIN siac.dbo.auto a
        ON a.au_marca = sa.sa_marca
       AND a.au_codigo = sa.sa_auto
      LEFT JOIN siac.dbo.marca m
        ON m.mar_codigo = sa.sa_marca
      LEFT JOIN siac.dbo.anexusa anx
        ON anx.aus_tipo = sa.sa_tipo
       AND anx.aus_codigo = sa.sa_codigo
      WHERE sa.sa_tipo = 10
        AND CAST(sa.sa_codigo AS VARCHAR(32)) = @interno
    `);

  if (!result.recordset[0]) {
    return null;
  }

  const row = result.recordset[0];

  return {
    interno: row.interno,
    dominio: row.dominio?.trim() || "",
    marca: row.marca?.trim() || "",
    modelo: row.modelo?.trim() || "",
    km: Number(row.km || 0),
    chasis: row.chasis?.trim() || "",
  } satisfies UnidadDTO;
}

export async function fetchUnidadMarcas() {
  const pool = await getSqlPool();
  const result = await pool.query<{
    codigo: string;
    nombre: string | null;
  }>(`
    SELECT DISTINCT
      CAST(m.mar_codigo AS VARCHAR(32)) AS codigo,
      LTRIM(RTRIM(m.mar_nombre)) AS nombre
    FROM siac.dbo.auto a
    INNER JOIN siac.dbo.marca m
      ON m.mar_codigo = a.au_marca
    WHERE LTRIM(RTRIM(ISNULL(m.mar_nombre, ''))) <> ''
    ORDER BY nombre
  `);

  return result.recordset.map((row) => ({
    codigo: row.codigo,
    nombre: row.nombre?.trim() || "Sin marca",
  })) satisfies UnidadMarcaOptionDTO[];
}

export async function fetchUnidadModelosByMarca(marcaCodigo: string, query: string) {
  const pool = await getSqlPool();
  const result = await pool
    .request()
    .input("marcaCodigo", sql.VarChar(32), marcaCodigo)
    .input("query", sql.VarChar(80), query)
    .query<{
      codigo: string;
      nombre: string | null;
      marcaCodigo: string;
    }>(`
      SELECT TOP (50)
        modelos.codigo,
        modelos.nombre,
        modelos.marcaCodigo
      FROM (
        SELECT DISTINCT
          CAST(a.au_codigo AS VARCHAR(32)) AS codigo,
          LTRIM(RTRIM(CAST(a.au_nombre AS VARCHAR(255)))) AS nombre,
          CAST(a.au_marca AS VARCHAR(32)) AS marcaCodigo
        FROM siac.dbo.auto a
        INNER JOIN siac.dbo.marca m
          ON m.mar_codigo = a.au_marca
        WHERE CAST(m.mar_codigo AS VARCHAR(32)) = @marcaCodigo
          AND LTRIM(RTRIM(ISNULL(CAST(a.au_nombre AS VARCHAR(255)), ''))) <> ''
          AND LTRIM(RTRIM(CAST(a.au_nombre AS VARCHAR(255)))) LIKE '%' + @query + '%'
      ) modelos
      ORDER BY modelos.nombre
    `);

  return result.recordset.map((row) => ({
    codigo: row.codigo,
    nombre: row.nombre?.trim() || "Sin modelo",
    marcaCodigo: row.marcaCodigo,
  })) satisfies UnidadModeloOptionDTO[];
}

export async function fetchUnidadModeloByMarcaAndCodigo(
  marcaCodigo: string,
  modeloCodigo: string,
) {
  const pool = await getSqlPool();
  const result = await pool
    .request()
    .input("marcaCodigo", sql.VarChar(32), marcaCodigo)
    .input("modeloCodigo", sql.VarChar(32), modeloCodigo)
    .query<{
      marca: string | null;
      modelo: string | null;
    }>(`
      SELECT TOP 1
        LTRIM(RTRIM(m.mar_nombre)) AS marca,
        LTRIM(RTRIM(a.au_nombre)) AS modelo
      FROM siac.dbo.auto a
      INNER JOIN siac.dbo.marca m
        ON m.mar_codigo = a.au_marca
      WHERE CAST(a.au_marca AS VARCHAR(32)) = @marcaCodigo
        AND CAST(a.au_codigo AS VARCHAR(32)) = @modeloCodigo
    `);

  if (!result.recordset[0]) {
    return null;
  }

  const row = result.recordset[0];

  return {
    marca: row.marca?.trim() || "",
    modelo: row.modelo?.trim() || "",
  };
}
