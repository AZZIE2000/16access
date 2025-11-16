"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { toast } from "sonner";

interface Employee {
  id: string;
  identifier: string;
  name: string;
  job: string;
  gate: { name: string } | null;
  zone: { name: string } | null;
  vendor: { name: string } | null;
  employeeAttachments?: Array<{
    type: string;
    attachment: {
      url: string;
    };
  }>;
}

interface BulkAccessCardsProps {
  employees: Employee[];
}

export function BulkAccessCards({ employees }: BulkAccessCardsProps) {
  const cardsRef = useRef<HTMLDivElement>(null);
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Generate QR codes for all employees
  useEffect(() => {
    const generateQRCodes = async () => {
      setIsLoading(true);
      const codes: Record<string, string> = {};

      for (const employee of employees) {
        try {
          const qrDataUrl = await QRCode.toDataURL(employee.identifier, {
            width: 256,
            margin: 1,
            color: {
              dark: "#000000",
              light: "#FFFFFF",
            },
          });
          codes[employee.id] = qrDataUrl;
        } catch (error) {
          console.error(
            `Error generating QR code for ${employee.name}:`,
            error,
          );
        }
      }

      setQrCodes(codes);
      setIsLoading(false);
    };

    void generateQRCodes();
  }, [employees]);

  const handlePrint = () => {
    if (!cardsRef.current || isLoading) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups to print");
      return;
    }

    const cardsHtml = cardsRef.current.innerHTML;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Access Cards - Bulk Print</title>
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

            .cards-container {
              display: flex;
              flex-direction: column;
            }

            .page-wrapper {
              width: 21cm;
              height: 29.7cm;
              display: flex;
              flex-wrap: wrap;
              gap: 1cm;
              padding: 1cm;
              page-break-after: always;
              break-after: page;
              box-sizing: border-box;
            }

            .page-wrapper:last-child {
              page-break-after: auto;
              break-after: auto;
            }

            .card-wrapper {
              page-break-inside: avoid;
              break-inside: avoid;
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

              .page-wrapper {
                page-break-after: always;
                break-after: page;
              }

              .page-wrapper:last-child {
                page-break-after: auto;
                break-after: auto;
              }

              .card-wrapper {
                page-break-inside: avoid;
                break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="cards-container">
            ${cardsHtml}
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();

    // Wait for fonts and images to load before printing
    setTimeout(() => {
      toast.success("Please use 'Save as PDF' in the print dialog");
      printWindow.print();
    }, 2000);
  };

  if (employees.length === 0) {
    return (
      <div className="text-muted-foreground text-center">
        No employees selected
      </div>
    );
  }

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
      `}</style>

      <div className="space-y-4">
        {/* Action Button */}
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            {employees.length} employee{employees.length !== 1 ? "s" : ""}{" "}
            selected
          </p>
          <Button
            onClick={handlePrint}
            disabled={isLoading}
            className="flex-1 md:flex-initial"
          >
            <Printer className="mr-2 h-4 w-4" />
            {isLoading ? "Loading..." : "Print All Cards"}
          </Button>
        </div>

        {/* Cards Preview (hidden, used for printing) */}
        <div ref={cardsRef} className="hidden">
          {Array.from({ length: Math.ceil(employees.length / 4) }).map(
            (_, pageIndex) => {
              const pageEmployees = employees.slice(
                pageIndex * 4,
                (pageIndex + 1) * 4,
              );

              return (
                <div key={pageIndex} className="page-wrapper">
                  {pageEmployees.map((employee) => {
                    const profilePhoto = employee.employeeAttachments?.find(
                      (att) => att.type === "PROFILE_PHOTO",
                    );
                    const qrCodeUrl = qrCodes[employee.id];

                    return (
                      <div
                        key={employee.id}
                        className="card-wrapper"
                        style={{
                          width: "9cm",
                          height: "12.7cm",
                          position: "relative",
                          pageBreakInside: "avoid",
                          breakInside: "avoid",
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
                                src={profilePhoto.attachment.url}
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
                                <span
                                  style={{
                                    fontSize: "0.75rem",
                                    color: "#9ca3af",
                                  }}
                                >
                                  Loading...
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            },
          )}
        </div>

        {/* Visible Preview Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {employees.slice(0, 6).map((employee) => {
            const profilePhoto = employee.employeeAttachments?.find(
              (att) => att.type === "PROFILE_PHOTO",
            );

            return (
              <div
                key={employee.id}
                className="border-muted flex items-center gap-3 rounded-lg border p-3"
              >
                {profilePhoto ? (
                  <img
                    src={profilePhoto.attachment.url}
                    alt={employee.name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
                    <span className="text-muted-foreground text-sm font-bold">
                      {employee.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-medium">{employee.name}</p>
                  <p className="text-muted-foreground text-sm">
                    {employee.job}
                  </p>
                </div>
              </div>
            );
          })}
          {employees.length > 6 && (
            <div className="border-muted text-muted-foreground flex items-center justify-center rounded-lg border p-3">
              <p className="text-sm">+{employees.length - 6} more</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
