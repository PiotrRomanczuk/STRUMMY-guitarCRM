import { NextResponse } from 'next/server';

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ListMeta {
  total: number;
  page?: number;
  limit?: number;
}

function buildPagination(meta: ListMeta): Pagination {
  const page = meta.page ?? 1;
  const limit = meta.limit ?? meta.total;
  const totalPages = limit > 0 ? Math.ceil(meta.total / limit) : 1;
  return { page, limit, total: meta.total, totalPages };
}

export function createListResponse<K extends string, T>(
  key: K,
  items: T[],
  meta: ListMeta
): { [P in K]: T[] } & { pagination: Pagination } {
  return {
    [key]: items,
    pagination: buildPagination(meta),
  } as { [P in K]: T[] } & { pagination: Pagination };
}

export function listResponse<K extends string, T>(
  key: K,
  items: T[],
  meta: ListMeta,
  status = 200
): NextResponse {
  return NextResponse.json(createListResponse(key, items, meta), { status });
}
