import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import { join, basename } from 'path';
import * as mime from 'mime-types';
import { Request, Response } from 'express';

// ensure we read videos from project root 'videos' folder (works in dev and prod)
const VIDEO_ROOT = join(process.cwd(), 'videos');

@Injectable()
export class VideoService {
    stream(lessonId: string, filename: string, req: Request, res: Response) {
        // Ngăn chặn path traversal
        const safeLessonId = basename(lessonId);
        const safeFilename = basename(filename);

        let filePath = join(VIDEO_ROOT, safeLessonId, safeFilename);

        console.log(`Streaming request: lesson=${safeLessonId} filename=${safeFilename} path=${filePath}`);
        console.log('Range header:', req.headers.range);

        if (!fs.existsSync(filePath)) {
            const fallbackPath = join(VIDEO_ROOT, 'test', safeFilename);
            if (fs.existsSync(fallbackPath)) {
                filePath = fallbackPath;
                console.warn(
                    `File not found for lesson ${safeLessonId}, serving test fallback: ${fallbackPath}`,
                );
            } else {
                throw new NotFoundException();
            }
        }

        const stat = fs.statSync(filePath);
        const fileSize = stat.size;
        const range = req.headers.range;

        const contentType =
            mime.lookup(filePath) || 'application/octet-stream';

        if (range) {
            const parts = range.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunkSize = end - start + 1;

            res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunkSize,
                'Content-Type': contentType,
            });

            fs.createReadStream(filePath, { start, end }).pipe(res);
        } else {
            res.writeHead(200, {
                'Content-Length': fileSize,
                'Content-Type': contentType,
            });

            fs.createReadStream(filePath).pipe(res);
        }
    }
}
