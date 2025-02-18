import mysql from "mysql2/promise";
export default function db() {
  async function createConnection() {
    const connection = await mysql.createConnection({
      host: "35.240.228.71",
      user: "atip.n",
      password: "atip@10xPlus2024",
      database: "stagingERP",
    });
    return connection;
  }
  async function getRawData() {
    const connection = await createConnection();
    const [rawData] = await connection.execute("select * from raw_data_ai");
    connection.end();
    return rawData;
  }
  async function getPurchaseData() {
    const connection = await createConnection();
    const [rawData] = await connection.execute(
      "select * from purchase_product"
    );
    connection.end();
    return rawData;
  }
  async function getProductData() {
    const connection = await createConnection();
    const [rawData] = await connection.execute("select * from product");
    connection.end();
    return rawData;
  }
  return {
    getRawData,
    getProductData,
    getPurchaseData,
  };
}
