const { T99_PRIVATE_KEY, vcall_token } = require("../../config/setting");
const ThrowReturn = require("./ThrowReturn");
const { secret_key } = require("../../config/keys");
let fetch = require("node-fetch");

function generateSignatureT99(object_data) {
  try {
    const crypto = require("crypto");
    const key_list = Object.keys(object_data).sort();
    const value_list = [];
    for (const key of key_list) {
      value_list.push(object_data[key]);
    }
    const key_signature = value_list.join("|");

    const sign = crypto.createSign("RSA-SHA256").update(key_signature);
    const signature = sign.sign(T99_PRIVATE_KEY);
    console.log("key_signature", key_signature)
    console.log("sign", sign)
    console.log("signature", signature)
    console.log("private key", T99_PRIVATE_KEY)
    return signature.toString("base64");
  } catch (error) {
    console.log(error);
    return null;
  }
}

async function generateSignatureOtherService(obj) {
  let md5 = require("md5");
  let md5_data = ``;
  let data_sort = Object.keys(obj)
    .sort()
    .reduce(function (result, key) {
      result[key] = obj[key];
      return result;
    }, {});
  for (let u of Object.keys(data_sort)) {
    md5_data += `${data_sort[u]}`;
  }
  let key_select = md5(`${secret_key}${md5_data}`);
  console.log("key_hash", key_select);
  return key_select;
}

async function callT99Service(api, body = {}, query = {}) {
  const signature = generateSignatureT99(body);

  let params = "";
  params += Object.keys(query)
    .map((key) => {
      return `${key}=${query[key]}`;
    })
    .join("&");

  const response = await fetch(`${api}?${params}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...body, signature }),
  });
  const { data, error_code, error_msg } = await response.json();
  if (error_code !== 0) throw new ThrowReturn(error_msg);

  return data;
}

async function callT99ServiceGet(api, query = {}) {
  let params = "";
  params += Object.keys(query)
    .map((key) => {
      return `${key}=${query[key]}`;
    })
    .join("&");

  const response = await fetch(`${api}?${params}`, {
    method: "GET",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(),
  });
  const { data, error_code, error_msg } = await response.json();
  if (error_code !== 0) throw new ThrowReturn(error_msg);

  return data;
}

async function callOtherService(api, body = {}, query = {}) {
  const signdata = await generateSignatureOtherService(body);

  let params = "";
  params += Object.keys(query)
    .map((key) => {
      return `${key}=${query[key]}`;
    })
    .join("&");

  const response = await fetch(`${api}?${params}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...body, signdata }),
  });
  const { data, error_code, error_msg } = await response.json();
  if (error_code !== 0) throw new ThrowReturn(error_msg);

  return data;
}


async function callTravelService(api, body = {}, query = {}) {
  let params = "";
  params += Object.keys(query)
    .map((key) => {
      return `${key}=${query[key]}`;
    })
    .join("&");

  const response = await fetch(`${api}?uid=1&${params}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const { data, error_code, error_msg } = await response.json();
  if (error_code !== 0) throw new ThrowReturn(error_msg);

  return data;
}
async function callApiLogin(api, body = {}) {

  const response = await  fetch(`${api}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const { data, error_code, error_msg } =await  response.json();
  if (error_code !== 0) throw new ThrowReturn(error_msg);

  return data;
}

async function callVCallService(api, body = {}, query = {}, method = "POST") {
  const q = {...query, token: vcall_token}
  let params = ""
  params = params += Object.keys(q).map((key) => `${key}=${q[key]}`).join("&");
  const response = await fetch(`${api}?${params}`, {
    method: method,
    headers: { "content-type": "application/json" },
    ...(method === "POST" ? { body: JSON.stringify(body) } : {}),
  });
  const { result, error_code, error_msg, error, msg, ...data } = await response.json();
  if (error !== 0 && error_code !== 0) throw new ThrowReturn(error_msg || msg);
  return result || {...data};
}

module.exports = {
  generateSignatureT99,
  generateSignatureOtherService,
  callT99Service,
  callT99ServiceGet,
  callOtherService,
  callTravelService,
  callApiLogin,
  callVCallService
};
