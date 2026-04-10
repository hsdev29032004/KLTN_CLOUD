import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const req = context.switchToHttp().getRequest<Request>();

        console.log(req.cookies);

        return true;

        const token = req.cookies?.access_token;

        if (!token) {
            throw new UnauthorizedException('Missing access token');
        }

        try {
            const payload = jwt.verify(
                token,
                process.env.JWT_SECRET || 'secret',
            );
            (req as any).user = payload;
            return true;
        } catch {
            throw new UnauthorizedException('Invalid or expired token');
        }
    }
}
