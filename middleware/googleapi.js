//---------------------------------------------
// google
const { google } = require("googleapis");

const key = {
  type: "service_account",
  project_id: "api-VIBA251807162744041-529319",
  private_key_id: "VIBAadadeca1bb6d8cdf76c0f4815281e6c2c369",
  private_key:
    "-----BEGIN PRIVATE KEY-----\nAAIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQC7COH5mlEu2ccm\n76itKRrOBDGvzMT9e13oXZ8Ui5Mhs2EpgJ7x9CX+/88y79cZExmurv5a9Zs7AW6Y\nckaEDjH7Iq8S+4v16DowRMpxHEZ0S9WjVhxtalmsLQFid0JpvK0uz+8v+3HvYZLU\n2jKY0Ii3sjWovJl4egVjQty4esZnYNdAhiWElf4KaPx5mLmrBsRdtg08KhMK8mVa\nH/Peqeo6csw5jJPNxboE/gtL1LN+7ZqVdquW6osqotBGh5HsGYC5yHPJzIPV42cA\nxgCIkDVnc+YGnSA4mO5I3X+gmCyc/9KnEztPMjnN1XdBhnWM5d/KfrdfpnZH1TLR\nyI17duXhAgMBAAECggEAB1CCneNWF3H24uPugc8guDvbwZdNgOhJNOQsa35F48SD\nIT9hd+7naYCRltlgXR+tGnLHicEfMACPVbDqZxGzDLI/jIt/3r8VP3wBOskzTCsH\nENs2Q2UsWppr+nDVjRMO5szE+uhnfUggmOhroCRPpHd4t7+gdOC4wzgDL8fFaJeE\n1Y2WIIzmn0o3n7+IBggbjyLCMgODrkv71/0NM+eLukl3B8RxpJqDik7/ZVHF25Gr\nSXVIjUfDOmz6H0hQJ9wipQYNRrF5XjKUGcP5SpvciGAs1qBIrMpx5msL6E5pckqu\ntG/a23TfVHCraP3H8bBdc3rGmfzvYZekQYJw0CktvQKBgQDeJ9ebEQeIas+PGBgR\ncUlpQZkSqL3yaEn9NWhIIxVnEsZDtk35ifY01L4CFkuVRBCMx5tl/PpDKdn1et6o\nzaGyafUzw0fY/fO+GQcrJg9VFjUsAza1l2jZp3sA9B17B4nZhBbGpJ8BCLhS1pwX\noaAInejIyvRdbH62D8QrtN1jQwKBgQDXh09iYnlEXLGbh74CEGABlyMjc2ORbA4s\naovNmPIjrv8BP3n98X3NOMlN/y600bvoPEUllRzgzh+ZJYLPu0FRve0wka4c173j\nZv0noVCEzQd4T2YWOJkwNjc2heR+ksBJVKwFRAW1fhjcvE0Ow8nFnDtuDhmJ+LN+\nV0XF5fa2CwKBgHLzXL3RHvu4gPPC/NkxrFG5brJX/AlNa1OI6g/Bj5aJAWwSDeDc\nQThvCG5eCPgQgxvFQSSRtRFBu5Uo4cOou01tREJnfmrKZO/tVWc/R1m4pwTCGPH3\niXpuDdideA+sA+k4Tuy0S84mK/I5OAWGTR+ITeZwFeetdxdPqysOaCuvAoGAGyhf\npmQGJ8kOUCzAkn4BuvGSaesmRrK47nvWdeepyzlHxJ58/rSpR2y6YOugtQQgi1jc\n1al+ZA1VCfUiEI7l4ijudEpHCDdfJAJcL9wxyyoSoORQVsh29Q4/0sz4R8KyHAth\nSaCSn5XuCBJqG0wsZowTKQD50trVszvH/PHHLpUCgYADKTxTVrdONK5ppXcZLJAD\nnX7AOLtIrdzJLzaXCEf1nPjZpLn1+m3HKozDlLxCBm3sa5MiIRcA6l9kza1ZXcPw\nJgUVG3TzkHdSQpJDe1rpqBWaeR1fx7rzfyCrm0wRyM48NN6348cZcK7MXuZQWshY\nqv/1ZeoiOnL82p2TB+mzAw==\n-----END PRIVATE KEY-----\n",
  client_email:
    "viba@api-6210251807162744041-529319.iam.gserviceaccount.com",
  client_id: "225388023780181515285",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url:
    "https://www.googleapis.com/robot/v1/metadata/x509/VIBA%40api-6210251807162744041-529319.iam.gserviceaccount.com",
};

// const packageName = "com.ultra.privacy";
const packageName = "com.viba";

let client = new google.auth.JWT(key.client_email, undefined, key.private_key, [
  "https://www.googleapis.com/auth/androidpublisher",
]);

const androidApi = google.androidpublisher({
  version: "v3",
  auth: client,
});

const listInappproducts = async (param) => {
  // {
  //     packageName: packageName,
  // }

  var paramTemp = {
    packageName,
    ...param,
  };

  let authorize = await client.authorize();

  console.log("main -> res", authorize);

  console.log("main -> res", paramTemp);

  var inappList = await androidApi.inappproducts.list(paramTemp);
  console.log(`inappList ${JSON.stringify(inappList)}`);

  return inappList;
};

const checkProducts = async (param) => {
  // {
  //     packageName: packageName,
  //     productId: productId,
  //     token: token
  // }

  var paramTemp = {
    packageName,
    ...param,
  };

  let authorize = await client.authorize();

  console.log("main -> res", authorize);

  console.log("main -> res", paramTemp);

  var products = await androidApi.purchases.products.get(paramTemp);

  console.log(`products ${JSON.stringify(products)}`);

  return products;
};

const checkSubscriptions = async (param) => {
  // {
  //     packageName: packageName,
  //     subscriptionId: subscriptionId,
  //     token: token
  // }

  var paramTemp = {
    packageName,
    ...param,
  };

  let authorize = await client.authorize();

  console.log("main -> res", authorize);
  console.log("main -> res", paramTemp);

  var subscriptions = await androidApi.purchases.subscriptions.get(paramTemp);

  console.log(`subscriptions ${JSON.stringify(subscriptions)}`);

  return subscriptions;
};

var googleapi = async function (req, res, next) {
  req.listInappproducts = listInappproducts;
  req.checkProducts = checkProducts;
  req.checkSubscriptions = checkSubscriptions;
  // req.androidApi = androidApi;
  next();
};

module.exports = googleapi;
