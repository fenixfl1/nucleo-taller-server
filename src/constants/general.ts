import { Metadata } from "../types/api.types";

export const SUCCESS_CONSOLE_FONT_COLOR = "\x1b[34m";
export const FAIL_CONSOLE_FONT_COLOR = "\x1b[31m";
export const WARNING_CONSOLE_FONT_COLOR = "\x1b[33m";

export const DEFAULT_PAGINATION_PAGE_SIZE = 20;
export const DEFAULT_PAGINATION_PAGE_NUMBER = 1;

export const defaultMetadata: Metadata = {
  pagination: {
    currentPage: 1,
    totalPages: 0,
    totalRows: 0,
    pageSize: 0,
    count: 0,
    links: undefined,
  },
};
