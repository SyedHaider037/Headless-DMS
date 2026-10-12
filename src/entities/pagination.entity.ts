export interface PaginationOptions {
    page: number;
    limit: number;
}

export interface PaginatedCollection<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export const toPaginatedCollection = <T>(items: T[], total: number, { page, limit }: PaginationOptions): PaginatedCollection<T> => ({
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
});
