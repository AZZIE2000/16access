import { hasBasePath } from "next/dist/client/has-base-path";
import { removeBasePath } from "next/dist/client/remove-base-path";
import { workUnitAsyncStorage } from "next/dist/server/app-render/work-unit-async-storage.external";

export function getPathname() {
  const store = workUnitAsyncStorage.getStore();
  if (!store || store.type !== "request") {
    return null;
  }

  const url = new URL(store.url.pathname + store.url.search, "http://n");

  // Convert URLSearchParams to object
  const searchParams: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    searchParams[key] = value;
  });

  const pathname = hasBasePath(url.pathname)
    ? removeBasePath(url.pathname)
    : url.pathname;

  return {
    pathname,
    searchParams,
  };
}
