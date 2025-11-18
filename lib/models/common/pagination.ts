export class Pagination<T> {
  success: boolean = true;
  data: T[] = [];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } = {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  };

  constructor(data: T[], total: number, page: number, limit: number) {
    this.data = data;
    this.pagination.total = total;
    this.pagination.page = page;
    this.pagination.limit = limit;
    this.pagination.totalPages = Math.ceil(total / limit);
  }
}
