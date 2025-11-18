import { ClientUploadedFileData } from "uploadthing/types";

export interface FileData {
  image: File;
  startUpload: () => Promise<ClientUploadedFileData<null>[] | undefined>;
}

export interface FileResponse {
  success: boolean;
  data: {
    url: string;
  };
}
