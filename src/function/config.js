'use strict';
//一些参数
const web_config={
  http_request_domain:OP_CONFIG.web_config.http_request_domain, //请求地址
  http_request_cross:OP_CONFIG.web_config.http_request_cross, //跨域
  http_request_timeout:OP_CONFIG.web_config.http_request_timeout //超时时间 ：60秒
};

export default web_config;
