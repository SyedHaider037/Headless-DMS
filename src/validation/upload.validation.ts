import path from "path";

// extension -> mimetypes accepted for it; both must match
const ALLOWED_UPLOADS: Record<string, readonly string[]> = {
    ".pdf": ["application/pdf"],
    ".txt": ["text/plain"],
    ".docx": ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    ".png": ["image/png"],
    ".jpg": ["image/jpeg"],
    ".jpeg": ["image/jpeg"],
};

export const ALLOWED_UPLOAD_EXTENSIONS = Object.keys(ALLOWED_UPLOADS).map((ext) => ext.slice(1)) as FileTypeName[];

export const isAllowedUpload = (originalName: string, mimetype: string): boolean => {
    const extension = path.extname(originalName).toLowerCase();
    return (ALLOWED_UPLOADS[extension] ?? []).includes(mimetype.toLowerCase());
};

export type FileTypeName = "pdf" | "txt" | "docx" | "png" | "jpg" | "jpeg";

export const FILE_TYPE_NAMES = ALLOWED_UPLOAD_EXTENSIONS as [FileTypeName, ...FileTypeName[]];

// the table stores the mimetype in fileType, so a filter by extension name maps to it
export const mimeTypeForFileType = (name: FileTypeName): string => ALLOWED_UPLOADS["." + name][0];
