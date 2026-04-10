import {
    Controller,
    Get,
    Param,
    Req,
    Res,
    UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { VideoService } from './video.service';

@Controller('api/videos')
export class VideoController {
    constructor(private readonly videoService: VideoService) { }

    @Get(':lessonId/:filename')
    @UseGuards(AuthGuard)
    streamVideo(
        @Param('lessonId') lessonId: string,
        @Param('filename') filename: string,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        this.videoService.stream(lessonId, filename, req, res);
    }
}
