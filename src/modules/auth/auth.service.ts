import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { getManager } from 'typeorm';

import { User } from '../../entities/user.entity';

type JwtPayload = {
  id: string;
  email: string;
};

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async login(user: any) {
    const payload: JwtPayload = await this.validateUser(
      user.email,
      user.password,
    );

    if (payload) {
      return {
        access_token: this.jwtService.sign(payload),
      };
    } else {
      throw new UnauthorizedException();
    }
  }

  private async validateUser(
    email: string,
    password: string,
  ): Promise<JwtPayload> {
    const manager = getManager();
    const user = await manager.findOne(User, { email: email });

    let payload: JwtPayload;

    // This part is for generating encrypted salt password for seeding
    // data in DB purpose with SQL statements for demo purpose only
    // if(!user) {
    //   const salt = await bcrypt.genSalt();
    //   console.log(await bcrypt.hash(user.password, salt));
    // }

    if (user && (await bcrypt.compare(password, user.password))) {
      payload = {
        id: user.id,
        email: user.email,
      };
    }
    return payload;
  }
}
