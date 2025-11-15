import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Image uploader for employee photos and ID cards
  imageUploader: f({
    image: {
      /**
       * For full list of options and defaults, see the File Route API reference
       * @see https://docs.uploadthing.com/file-routes#route-config
       */
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    // Set permissions and file types for this FileRoute
    .middleware(async () => {
      // Allow uploads from vendor portal (public access)
      // In production, you might want to validate the vendor token here
      return { uploadedAt: new Date().toISOString() };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Upload complete at:", metadata.uploadedAt);
      console.log("file", file);

      // Whatever is returned here is sent to the client `onClientUploadComplete` callback
      return { uploadedAt: metadata.uploadedAt };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
