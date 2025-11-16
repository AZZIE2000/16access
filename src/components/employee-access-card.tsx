"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";
import { toast } from "sonner";

interface EmployeeAccessCardProps {
  employee: {
    id: string;
    identifier: string;
    name: string;
    job: string;
    gate?: { name: string } | null;
    zone?: { name: string } | null;
    vendor?: { name: string } | null;
    employeeAttachments?: Array<{
      type: string;
      attachment: {
        url: string;
      };
    }>;
  };
}

export function EmployeeAccessCard({ employee }: EmployeeAccessCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");

  // Get profile photo
  const profilePhoto = employee.employeeAttachments?.find(
    (att) => att.type === "PROFILE_PHOTO",
  )?.attachment.url;

  // Generate QR code
  useEffect(() => {
    const generateQR = async () => {
      try {
        const url = await QRCode.toDataURL(employee.identifier, {
          width: 300,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        });
        setQrCodeUrl(url);
      } catch (err) {
        console.error("Error generating QR code:", err);
      }
    };

    void generateQR();
  }, [employee.identifier]);

  const handleDownload = () => {
    if (!cardRef.current) return;

    // Use print to PDF instead - it handles fonts and styling perfectly
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups to download PDF");
      return;
    }

    const cardHtml = cardRef.current.outerHTML;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Access Card - ${employee.name}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&family=Noto+Kufi+Arabic:wght@100..900&family=Tajawal:wght@700&display=swap" rel="stylesheet">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }

            @page {
              size: A4;
              margin: 0;
            }

            body {
              margin: 0;
              padding: 0;
              background: white;
            }

            .tajawal-bold {
              font-family: "Tajawal", sans-serif;
              font-weight: 700;
              font-style: normal;
            }

            .montserrat {
              font-family: "Montserrat", sans-serif;
            }

            @media print {
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }

              body {
                padding: 0;
                margin: 0;
              }
            }
          </style>
        </head>
        <body>
          ${cardHtml}
        </body>
      </html>
    `);

    printWindow.document.close();

    // Wait for fonts and images to load, then trigger print dialog
    setTimeout(() => {
      toast.success("Please use 'Save as PDF' in the print dialog");
      printWindow.print();
    }, 1500);
  };

  const handlePrint = () => {
    if (!cardRef.current) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups to print");
      return;
    }

    const cardHtml = cardRef.current.outerHTML;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Access Card - ${employee.name}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&family=Noto+Kufi+Arabic:wght@100..900&family=Tajawal:wght@700&display=swap" rel="stylesheet">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }

            @page {
              size: A4;
              margin: 0;
            }

            body {
              margin: 0;
              padding: 0;
              background: white;
            }

            .tajawal-bold {
              font-family: "Tajawal", sans-serif;
              font-weight: 700;
              font-style: normal;
            }

            .montserrat {
              font-family: "Montserrat", sans-serif;
            }

            @media print {
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }

              body {
                padding: 0;
                margin: 0;
              }
            }
          </style>
        </head>
        <body>
          ${cardHtml}
        </body>
      </html>
    `);

    printWindow.document.close();

    // Wait for images and fonts to load before printing
    setTimeout(() => {
      printWindow.print();
    }, 1500);
  };

  return (
    <>
      {/* Load Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&family=Noto+Kufi+Arabic:wght@100..900&family=Tajawal:wght@700&display=swap"
        rel="stylesheet"
      />

      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&family=Noto+Kufi+Arabic:wght@100..900&family=Tajawal:wght@700&display=swap");

        .tajawal-bold {
          font-family: "Tajawal", sans-serif;
          font-weight: 700;
          font-style: normal;
        }
        .montserrat {
          font-family: "Montserrat", sans-serif;
        }
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          @page {
            size: A4;
            margin: 0;
          }
        }
      `}</style>

      <div className="space-y-4">
        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handlePrint}
            variant="success"
            disabled={!qrCodeUrl}
            className="flex-1"
          >
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>

        {/* Access Card Preview */}
        <div className="flex justify-center">
          <div
            ref={cardRef}
            style={{
              width: "9cm",
              height: "12.7cm",
              position: "relative",
            }}
          >
            {/* Background Image */}
            <img
              src="/background.png"
              alt=""
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                zIndex: 0,
              }}
              crossOrigin="anonymous"
            />

            {/* Header Logos */}
            <div
              style={{
                position: "absolute",
                top: "0.5rem",
                left: 0,
                right: 0,
                zIndex: 10,
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <img
                src="/amman-christmas-market.png"
                alt="Christmas Market"
                style={{ height: "6rem" }}
                crossOrigin="anonymous"
              />
              <img
                src="/16thofmay.png"
                alt="16th of May"
                style={{ height: "6rem" }}
                crossOrigin="anonymous"
              />
            </div>

            {/* Main Card Content */}
            <div
              style={{
                position: "absolute",
                top: "6rem",
                left: "1rem",
                zIndex: 10,
                backgroundColor: "#ffffff",
                width: "8cm",
                height: "9.5cm",
              }}
            >
              {/* Employee Info Section */}
              <div
                dir="rtl"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1.5rem",
                  padding: "0.5rem",
                }}
              >
                {/* Profile Photo */}
                {profilePhoto ? (
                  <img
                    src={profilePhoto}
                    alt={employee.name}
                    style={{
                      height: "8rem",
                      objectFit: "cover",
                    }}
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div
                    style={{
                      display: "flex",
                      height: "8rem",
                      width: "8rem",
                      flexShrink: 0,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#e5e7eb",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "1.875rem",
                        fontWeight: "bold",
                        color: "#9ca3af",
                      }}
                    >
                      {employee.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </span>
                  </div>
                )}

                {/* Employee Details */}
                <div className="tajawal-bold">
                  <h2
                    style={{
                      fontSize: "1.25rem",
                      fontWeight: "bold",
                      fontFamily: "Tajawal, sans-serif",
                    }}
                  >
                    {employee.name}
                  </h2>
                  <p
                    style={{
                      fontSize: "1.125rem",
                      fontWeight: "500",
                      color: "#4b5563",
                      fontFamily: "Tajawal, sans-serif",
                    }}
                  >
                    {employee.vendor?.name}
                  </p>
                  <p
                    style={{
                      fontSize: "1.125rem",
                      fontWeight: "500",
                      color: "#4b5563",
                      fontFamily: "Tajawal, sans-serif",
                    }}
                  >
                    {employee.job}
                  </p>
                </div>
              </div>

              {/* Gate and Zone Section */}
              <div style={{ padding: "0.5rem" }}>
                <div
                  style={{
                    width: "100%",
                    backgroundColor: "#445940",
                    paddingTop: "0.5rem",
                    paddingBottom: "0.5rem",
                  }}
                >
                  <p
                    className="montserrat"
                    style={{
                      textAlign: "center",
                      fontSize: "1.5rem",
                      color: "#ffffff",
                      fontFamily: "Montserrat, sans-serif",
                    }}
                  >
                    {employee.gate?.name ?? "Main Gate Access"}
                  </p>
                  <p
                    className="montserrat"
                    style={{
                      textAlign: "center",
                      fontSize: "1.125rem",
                      color: "#c2a067",
                      fontFamily: "Montserrat, sans-serif",
                    }}
                  >
                    {employee.zone?.name ?? "Parking Only (ZONE)"}
                  </p>
                </div>
              </div>

              {/* QR Code Section */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                {qrCodeUrl ? (
                  <img
                    src={qrCodeUrl}
                    alt="QR Code"
                    style={{ height: "7rem", width: "7rem" }}
                  />
                ) : (
                  <div
                    style={{
                      display: "flex",
                      height: "7rem",
                      width: "7rem",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#f3f4f6",
                    }}
                  >
                    <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                      Loading...
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
