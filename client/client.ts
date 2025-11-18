import axios from "axios";

export const client = axios.create();

let lastErrorMessage = "";
let lastErrorTimestamp = 0;
const ERROR_DISPLAY_INTERVAL = 3000; // 3 seconds

client.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    let errorMessage: string;

    if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
    } else if (error.message) {
      errorMessage = error.message;
    } else {
      errorMessage = "An unexpected error occurred";
    }

    const currentTime = Date.now();
    if (
      errorMessage !== lastErrorMessage ||
      currentTime - lastErrorTimestamp > ERROR_DISPLAY_INTERVAL
    ) {
      // toast.error(errorMessage);
      lastErrorMessage = errorMessage;
      lastErrorTimestamp = currentTime;
    }

    return Promise.reject(error);
  }
);

const loadingToastId: ReturnType<typeof setTimeout> | undefined = undefined;

client.interceptors.request.use((config) => {
  // toast.loading("Request in progress...", { id: "loadingToast" });

  return config;
});

client.interceptors.response.use(
  (response) => {
    clearTimeout(loadingToastId);
    // toast.dismiss("loadingToast");
    return response;
  },
  (error) => {
    clearTimeout(loadingToastId);
    // toast.dismiss("loadingToast");

    let errorMessage: string;
    if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
    } else if (error.message) {
      errorMessage = error.message;
    } else {
      errorMessage = "An unexpected error occurred";
    }

    const currentTime = Date.now();
    if (
      errorMessage !== lastErrorMessage ||
      currentTime - lastErrorTimestamp > ERROR_DISPLAY_INTERVAL
    ) {
      // toast.error(errorMessage);
      lastErrorMessage = errorMessage;
      lastErrorTimestamp = currentTime;
    }

    return Promise.reject(error);
  }
);
