import axios from "axios";
export const baseURL = process.env.REACT_APP_API_URL;

const headers = {
  Accept: "application/json",
  "Content-Type": "application/json",
  // Origin: baseURL,
};

const ApiCaller = axios.create({
  baseURL: baseURL,
  timeout: 10000,
  headers: headers,
});
ApiCaller.interceptors.request.use(async function(config: any) {
  let token = await localStorage.getItem("token");
  config.headers.Authorization = token ? `bearer ${token}` : "";
  return config;
});

const apiDefault = {};

const userApiList = {
  signin: (payload: any) => {
    console.log(payload);
    return ApiCaller({
      url: `/users/signin`,
      method: "post",
      data: payload,
    });
  },

  signup: (payload: any) => {
    return ApiCaller({
      url: `/users/signup`,
      method: "post",
      data: payload,
    });
  },

  usernameCheck: (payload: any) => {
    return ApiCaller({
      url: `/users/usernameCheck`,
      method: "post",
      data: payload,
    });
  },

  getUserDetails: (params?: { isProfile: boolean }) => {
    console.log(params);
    return ApiCaller({
      url: `/users/userDetails`,
      method: "get",
      params,
    });
  },
  getRecipesByCategory: (params: any) => {
    return ApiCaller({
      url: `/users/category`,
      method: "get",
      params,
    });
  },
  postToCategory: (payload: any) => {
    return ApiCaller({
      url: `/users/category`,
      method: "post",
      data: payload,
    });
  },

  deleteFromCategory: (payload: any) => {
    return ApiCaller({
      url: `/users/category`,
      method: "delete",
      data: payload,
    });
  },

  postVerifyUser: (payload: any) => {
    return ApiCaller({
      url: `/users/verifyUser`,
      method: "post",
      // data: payload,
    });
  },
};
// eslint-disable-next-line import/no-anonymous-default-export
export default {
  ApiCaller,
  ...apiDefault,
  ...userApiList,
};
