import Axios from "axios";


import { ElMessage } from "element-plus";

import NProgress from "nprogress";
import "nprogress/nprogress.css";

NProgress.configure({
  // 动画方式
  easing: "ease",
  // 递增进度条的速度
  speed: 500,
  // 是否显示加载ico
  showSpinner: false,
  // 自动递增间隔
  trickleSpeed: 200,
  // 初始化时的最小百分比
  minimum: 0.3
});

const { VITE_REQUEST_BASE_SAAS_API } = import.meta.env;



// 相关配置请参考：www.axios-js.com/zh-cn/docs/#axios-request-config-1
const defaultConfig = {
  // 请求超时时间
  timeout: 30000,
  headers: {
    Accept: "application/json, text/plain, */*",
    "Content-Type": "application/json"
  },
  baseURL: VITE_REQUEST_BASE_SAAS_API
};

class PureHttp {
  constructor() {
    this.httpInterceptorsRequest();
    this.httpInterceptorsResponse();
  }


  /** 初始化配置对象 */
  static initConfig = {};

  /** 保存当前Axios实例对象 */
  static axiosInstance = Axios.create(defaultConfig);

  /** 请求拦截 */
  httpInterceptorsRequest () {
    PureHttp.axiosInstance.interceptors.request.use(
      async (config) => {
        // 开启进度条动画
        NProgress.start();
        // 优先判断post/get等方法是否传入回掉，否则执行初始化设置等回掉
        if (typeof config.beforeRequestCallback === "function") {
          config.beforeRequestCallback(config);
          return config;
        }
        if (PureHttp.initConfig.beforeRequestCallback) {
          PureHttp.initConfig.beforeRequestCallback(config);
          return config;
        }

        return config
      },
      error => {
        console.log("http error:", error);
        return Promise.reject(error);
      }
    );
  }

  /** 响应拦截 */
  httpInterceptorsResponse () {
    const instance = PureHttp.axiosInstance;
    instance.interceptors.response.use(
      (response) => {
        // console.log('response:',response)
        const $config = response.config;
        // 关闭进度条动画
        NProgress.done();


        // 优先判断post/get等方法是否传入回掉，否则执行初始化设置等回掉
        if (typeof $config.beforeResponseCallback === "function") {
          $config.beforeResponseCallback(response);
          return response.data;
        }
        if (PureHttp.initConfig.beforeResponseCallback) {
          PureHttp.initConfig.beforeResponseCallback(response);
          return response.data;
        }
        if (response.data.code === 0) {
          return response.data.data
        } else {
          let msg = response.data.msg
          ElMessage.error(msg)
          console.log('response.data:', response.data)
          return Promise.reject(response.data)
        }
      },
      (error) => {

        console.log('error:', error)
        ElMessage.error(error.message)
        const $error = error;
        $error.isCancelRequest = Axios.isCancel($error);
        // 关闭进度条动画
        NProgress.done();
        // 所有的响应异常 区分来源为取消请求/非取消请求
        return Promise.reject($error);
      }
    );
  }

  /** 通用请求工具函数 */
  request (
    method,
    url,
    param,
    axiosConfig
  ) {
    const config = {
      method,
      url,
      ...param,
      ...axiosConfig
    };

    // 单独处理自定义请求/响应回掉
    return new Promise((resolve, reject) => {
      PureHttp.axiosInstance
        .request(config)
        .then((response) => {
          resolve(response);
        })
        .catch(error => {
          console.log('request error:', error)
          reject(error);
        });
    });
  }

  /** 单独抽离的post工具函数 */
  post (
    url,
    data,
  ) {
    return this.request("post", url, data, {});
  }

  /** 单独抽离的get工具函数 所有的get请求带上userId*/
  get (
    url,
    data,
    config
  ) {

    return PureHttp.axiosInstance.get(url, { ...data, ...config });
  }

  postForm (
    url,
    params,
    config
  ) {
    // console.log("postForm params:", params);
    const tempConfig = config
      ? Object.assign(config, {
        headers: { "content-type": "application/x-www-form-urlencoded" }
      })
      : {
        headers: { "content-type": "application/x-www-form-urlencoded" }
      };
    return PureHttp.axiosInstance.postForm(url, params, tempConfig);
  }
}

export const http = new PureHttp();
