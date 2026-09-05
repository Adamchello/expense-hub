/**
 * PDFs are not parsed in the browser. Layout is what carries meaning in a bank
 * statement, and text extraction throws it away, so the whole file goes to the
 * server-side model as base64.
 */
export function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result ?? "");
      const comma = dataUrl.indexOf(",");
      resolve(comma >= 0 ? dataUrl.slice(comma + 1) : "");
    };
    reader.onerror = () =>
      reject(new Error("Failed to read file. Please try again."));
    reader.readAsDataURL(file);
  });
}
