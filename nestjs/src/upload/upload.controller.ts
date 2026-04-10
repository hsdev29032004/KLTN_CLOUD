import {
    Controller,
    Post,
    UploadedFile,
    UseGuards,
    UseInterceptors,
    BadRequestException,
    Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join } from 'path';
import { AuthGuard } from '../auth/auth.guard';
import { UploadService } from './upload.service';
import { Request } from 'express';

// store uploads relative to project root (process.cwd()), not the compiled `dist` folder
const UPLOAD_DIR = join(process.cwd(), 'uploads');

@Controller('api/videos')
export class UploadController {
    constructor(private readonly uploadService: UploadService) { }

    @Post()
    @UseGuards(AuthGuard)
    @UseInterceptors(
        FileInterceptor('video', {
            storage: diskStorage({ destination: UPLOAD_DIR }),
            limits: { fileSize: 1024 * 1024 * 500 }, // 500 MB
        }),
    )
    async createVideo(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
        console.log('Upload request received');
        console.log('url:', req.url);
        console.log('headers:', req.headers);
        try {
            console.log('body:', req.body);
        } catch (e) {
            console.log('body: <unreadable>');
        }
        console.log('file:', file);
        if (!file) {
            throw new BadRequestException('Missing file');
        }
        return this.uploadService.processVideo(file);
    }
}
