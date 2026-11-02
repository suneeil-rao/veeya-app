export function createMultipartBody(
    boundary: string,
    fileBinary: ArrayBuffer,
    fileName: string,
    importConfig: object
): string {
    const CRLF = '\r\n';

    let body: string = '';

    // File part
    body += `--${boundary}${CRLF}`;
    body += `Content-Disposition: form-data; name="file"; filename="${fileName}"${CRLF}`;
    body += `Content-Type: application/octet-stream${CRLF}${CRLF}`;
    body += Array.from(new Uint8Array(fileBinary))
        .map((byte: number) => String.fromCharCode(byte))
        .join('');
    body += CRLF;

    // ImportConfig JSON part
    body += `--${boundary}${CRLF}`;
    body += `Content-Disposition: form-data; name="importConfig"; filename="config.json"${CRLF}`;
    body += `Content-Type: application/json${CRLF}${CRLF}`;
    body += JSON.stringify(importConfig);
    body += CRLF;

    // Closing boundary
    body += `--${boundary}--${CRLF}`;

    return body;
}