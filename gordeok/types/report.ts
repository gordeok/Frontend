export type ReportImage = {
    uri: string;
    name?: string;
    type?: string;
  };
  
  export type CreateReportData = {
    targetUserId: number;
    postId?: number;
    reason: string;
    content?: string;
    images?: ReportImage[];
  };
  
  export type CreateReportResponse = {
    reportId: number;
    status: string;
    createdAt: string;
    message: string;
  };