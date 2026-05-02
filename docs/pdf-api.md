# PDF API – Implementation Guide (FE Team)

Base URL: `http://localhost:3002`

> All endpoints require authentication cookies (`access_token`) to be sent with each request (`credentials: 'include'`).

---

## 1. Upload a PDF

| Field  | Value |
|--------|-------|
| Method | `POST` |
| URL    | `/api/pdfs` |
| Auth   | Required (cookie) |
| Body   | `multipart/form-data` |
| Field name | `pdf` |
| Max size | 50 MB |
| Accepted types | `application/pdf` only |

### Request example (fetch)

```js
const formData = new FormData();
formData.append("pdf", fileInput.files[0]); // <input type="file" accept=".pdf">

const res = await fetch("http://localhost:3002/api/pdfs", {
  method: "POST",
  credentials: "include",
  body: formData,
});

const data = await res.json();
// { lessonId: "lesson-<uuid>", url: "/api/pdfs/lesson-<uuid>" }
```

### Success response `201`

```json
{
  "lessonId": "lesson-3f2a1b4c-...",
  "url": "/api/pdfs/lesson-3f2a1b4c-..."
}
```

**Store `lessonId`** in your database alongside the lesson record so you can build the viewer URL later.

### Error responses

| Status | Reason |
|--------|--------|
| `400`  | No file attached, or wrong file type |
| `401`  | Not authenticated |
| `413`  | File exceeds 50 MB |

---

## 2. View / Serve a PDF

| Field  | Value |
|--------|-------|
| Method | `GET` |
| URL    | `/api/pdfs/:lessonId` |
| Auth   | Required (cookie) |
| Response | Binary PDF stream (`Content-Type: application/pdf`) |

### Embedding in an `<iframe>`

```html
<iframe
  id="pdf-viewer"
  src=""
  width="100%"
  height="800px"
  type="application/pdf"
></iframe>
```

```js
// Set the src after the lesson data is loaded
document.getElementById("pdf-viewer").src =
  `http://localhost:3002/api/pdfs/${lessonId}`;
```

Because the request is made by the browser (not fetch), the cookie is sent automatically.

### Opening in a new tab

```js
window.open(`http://localhost:3002/api/pdfs/${lessonId}`, "_blank");
```

### Fallback behaviour

If the server cannot find the requested PDF, it automatically serves `pdf/test.pdf` (a placeholder). This prevents broken viewers during development or when a lesson has no PDF yet.

---

## 3. Full upload + view example

```html
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>PDF Upload</title></head>
<body>
  <h2>Upload PDF</h2>
  <input type="file" id="fileInput" accept=".pdf" />
  <button onclick="upload()">Upload</button>

  <h2>Preview</h2>
  <iframe id="viewer" width="100%" height="700px" type="application/pdf"></iframe>

  <script>
    async function upload() {
      const file = document.getElementById("fileInput").files[0];
      if (!file) return alert("Select a PDF first");

      const form = new FormData();
      form.append("pdf", file);

      const res = await fetch("http://localhost:3002/api/pdfs", {
        method: "POST",
        credentials: "include",
        body: form,
      });

      if (!res.ok) {
        const err = await res.json();
        return alert("Upload failed: " + err.message);
      }

      const { lessonId } = await res.json();
      document.getElementById("viewer").src =
        `http://localhost:3002/api/pdfs/${lessonId}`;
    }
  </script>
</body>
</html>
```

---

## 4. Notes

- The server returns `Content-Disposition: inline` so modern browsers render the PDF directly instead of downloading it.
- For lesson playback pages, store only the `lessonId` returned at upload time — never the full server path.
- CORS is already configured for `localhost:3000`, `localhost:3001`, and `127.0.0.1:5500`.
