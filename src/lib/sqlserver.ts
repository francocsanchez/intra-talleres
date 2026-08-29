import sql from "mssql";

import type { UnidadDTO } from "@/lib/types";

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
    global.sqlPoolPromise = sql.connect(sqlConfig);
  }

  return global.sqlPoolPromise;
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
