import type { Restaurant } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type RestaurantDomainInfo = Pick<
  Restaurant,
  "slug" | "customDomain" | "customDomainVerified"
>;

function stripProtocol(value: string) {
  return value.replace(/^https?:\/\//i, "");
}

export function normalizeCustomDomain(value?: string | null) {
  if (!value) return undefined;

  const normalized = stripProtocol(value)
    .trim()
    .toLowerCase()
    .replace(/\/+$/, "");

  return normalized || undefined;
}

export function getHostnameFromRequestHost(host?: string | null) {
  if (!host) return undefined;
  return host.split(":")[0]?.trim().toLowerCase() || undefined;
}

export function isLocalHostname(hostname?: string) {
  if (!hostname) return false;
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".local")
  );
}

export async function findRestaurantForCustomHost(host?: string | null) {
  const hostname = getHostnameFromRequestHost(host);

  if (!hostname || isLocalHostname(hostname)) {
    return null;
  }

  return prisma.restaurant.findFirst({
    where: {
      customDomain: hostname,
      customDomainVerified: true
    },
    select: {
      id: true,
      slug: true,
      name: true,
      customDomain: true,
      customDomainVerified: true
    }
  });
}

export function getRestaurantPublicLinks(
  restaurant: RestaurantDomainInfo,
  appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
) {
  const baseAppUrl = appUrl.replace(/\/+$/, "");
  const platformMenuPath = `/menu/${restaurant.slug}`;
  const simulatorPath = `/whatsapp-simulator/${restaurant.slug}`;
  const customDomain = normalizeCustomDomain(restaurant.customDomain);
  const customDomainUrl =
    customDomain && restaurant.customDomainVerified
      ? `https://${customDomain}`
      : customDomain
        ? `https://${customDomain} (pending verification)`
        : null;

  return {
    platformMenuPath,
    platformMenuUrl: `${baseAppUrl}${platformMenuPath}`,
    simulatorPath,
    simulatorUrl: `${baseAppUrl}${simulatorPath}`,
    customDomain,
    customDomainUrl
  };
}
