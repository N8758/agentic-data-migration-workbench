const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL
).replace(/\/+$/, "");

async function request(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;

  const config = {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body !== undefined
        ? { "Content-Type": "application/json" }
        : {}),
      ...(options.headers || {}),
    },
  };

  if (config.body !== undefined && typeof config.body !== "string") {
    config.body = JSON.stringify(config.body);
  }

  let response;

  try {
    response = await fetch(url, config);
  } catch (error) {
    throw new Error(
      `Unable to connect to backend at ${API_BASE_URL}. Make sure FastAPI is running.`
    );
  }

  const contentType = response.headers.get("content-type") || "";

  let data;

  if (contentType.includes("application/json")) {
    data = await response.json();
  } else {
    const text = await response.text();
    data = text ? { detail: text } : null;
  }

  if (!response.ok) {
    const message =
      data?.detail ||
      data?.message ||
      data?.error ||
      `Request failed with status ${response.status}`;

    throw new Error(
      typeof message === "string"
        ? message
        : JSON.stringify(message)
    );
  }

  return data;
}

export const apiClient = {
  get(path, options = {}) {
    return request(path, {
      ...options,
      method: "GET",
    });
  },

  post(path, body, options = {}) {
    return request(path, {
      ...options,
      method: "POST",
      body,
    });
  },

  put(path, body, options = {}) {
    return request(path, {
      ...options,
      method: "PUT",
      body,
    });
  },

  patch(path, body, options = {}) {
    return request(path, {
      ...options,
      method: "PATCH",
      body,
    });
  },

  delete(path, options = {}) {
    return request(path, {
      ...options,
      method: "DELETE",
    });
  },
};

export default apiClient;