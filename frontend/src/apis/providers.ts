import { AxiosResponse } from "axios";
import apis from ".";

class ProviderApi {
  get<T>(path: string, params?: any): Promise<AxiosResponse<T>> {
    return apis.axios.get(`/providers${path}`, { params });
  }

  postForm<T>(
    path: string,
    formdata?: any,
    params?: any
  ): Promise<AxiosResponse<T>> {
    return apis.post(`/providers${path}`, formdata, params);
  }

  async providers() {
    return new Promise<Array<SystemProvider>>((resolve, reject) => {
      this.get<DataWrapper<Array<SystemProvider>>>("")
        .then((result) => {
          resolve(result.data.data);
        })
        .catch(reject);
    });
  }

  async reset() {
    return new Promise<void>((resolve, reject) => {
      this.postForm<void>("", { action: "reset" })
        .then(() => resolve())
        .catch(reject);
    });
  }
}

export default new ProviderApi();