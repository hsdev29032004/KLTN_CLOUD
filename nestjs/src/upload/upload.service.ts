import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as fs from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as ffmpeg from 'fluent-ffmpeg';
import * as ffmpegPath from 'ffmpeg-static';

ffmpeg.setFfmpegPath(ffmpegPath as unknown as string);

// place generated HLS files in project root 'videos' folder (not under dist)
const VIDEO_DIR = join(process.cwd(), 'videos');

@Injectable()
export class UploadService {
    constructor() {
        if (!fs.existsSync(VIDEO_DIR)) fs.mkdirSync(VIDEO_DIR, { recursive: true });
    }

    processVideo(file: Express.Multer.File): Promise<{ lessonId: string; hls: string }> {
        return new Promise((resolve, reject) => {
            const lessonId = 'lesson-' + uuidv4();
            const outputDir = join(VIDEO_DIR, lessonId);
            fs.mkdirSync(outputDir, { recursive: true });

            const outputPath = join(outputDir, 'index.m3u8');

            ffmpeg(file.path)
                .outputOptions([
                    '-hls_time 6',
                    '-hls_list_size 0',
                    '-hls_segment_filename',
                    join(outputDir, '%d.ts'),
                ])
                .output(outputPath)
                .on('end', () => {
                    fs.unlinkSync(file.path); // xóa file gốc
                    resolve({
                        lessonId,
                        hls: `/api/videos/${lessonId}/index.m3u8`,
                    });
                })
                .on('error', (err) => {
                    console.error(err);
                    reject(new InternalServerErrorException('Encode failed'));
                })
                .run();
        });
    }
}
