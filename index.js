require('dotenv').config({ path: require('find-config')('app.env') })

const apikey                      = process.env.API_KEY;
const clientId                    = process.env.CLIENT_ID;
const secret                      = process.env.SECRET;
const tenantId                    = process.env.TENANT_ID;

const msRestAzure                 = require('ms-rest-azure');
const util                        = require('util');
const adlsManagement              = require("azure-arm-datalake-store");
const fetch                       = require("node-fetch");
const { compareDocumentPosition } = require('domutils');

const ticker                      = process.argv[2]; 
const baseURL                     = 'https://financialmodelingprep.com/api/';

let tailString                    = ' ';
let dirString                     = process.argv[3];
let apiName                       = process.argv[3];
let versionString                 = ' ';
let apiString                     = ' ';

if (dirString === 'social-sentiment') {
  versionString = 'v4/';
  dirString     = 'historical/' + dirString;
  tailString    = '?symbol=' + ticker + '&page=0&apikey=';
  apiString     = baseURL + versionString + dirString + '/' + tailString + apikey;
}

if (dirString === 'historical-price-full') {
  versionString = 'v3/';
  tailString    = ticker + '?apikey=';
  apiString     = baseURL + versionString + dirString + '/' + tailString + apikey;
}

if (dirString === 'sec-filings') {
  versionString = 'v3/';
  tailString    = ticker + '?page=0&apikey=';
  apiString     = baseURL + versionString + 'sec_filings' + '/' + tailString + apikey;
}

if (dirString === 'rating') {
  versionString = 'v3/';
  tailString    = ticker + '?apikey=';
  apiString     = baseURL + versionString + dirString + '/' + tailString + apikey;
}

function getFileNameString(){
  const today = new Date();
  const yyyy = today.getFullYear();
  let mm = today.getMonth() + 1;
  let dd = today.getDate();

  if (dd < 10) dd = '0' + dd;
  if (mm < 10) mm = '0' + mm;

  const dateSuffix = mm + '-' + dd + '-' + yyyy;
  return dateSuffix;
}

async function getFinanceData(){
    const response   = await fetch(apiString)
    return await response.json();
}

async function getFileSystemClient(){
    const credentials      = await (await msRestAzure).loginWithServicePrincipalSecret(clientId,secret,tenantId);
    const fileSystemClient = new (await adlsManagement).DataLakeStoreFileSystemClient(credentials);
    return fileSystemClient
}

async function saveFinancialScore(){
    const fileSystemClient = await getFileSystemClient();
    let accountName        = process.env.ACCOUNT_NAME;
    let dateString         = getFileNameString();
    let fileToCreate       = '/' + dirString + '/' + apiName + '-' + dateString + '.json';
    const result           = await getFinanceData();
    let options            = {
        streamContents: new Buffer.from(JSON.stringify({
            data:result
        }))
      }
       
      fileSystemClient.fileSystem.create(accountName, fileToCreate, options, function (err, result, request, response) {
        if (err) {
          console.log(err);
        } else {
          console.log('response is: ' + util.inspect(response, {depth: null}));
        }
      });
}

saveFinancialScore()