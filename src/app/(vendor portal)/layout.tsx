import { type Metadata } from "next";

// Override metadata to remove PWA manifest for vendor portal
export const metadata: Metadata = {
  title: "Vendor Portal - Access Management",
  description: "Vendor Portal for Employee Management",
  manifest: undefined, // Remove manifest to prevent PWA install prompt
  themeColor: undefined,
  appleWebApp: undefined,
};

export default function VendorPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

