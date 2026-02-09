import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto, UpdateSubjectDto } from './dto';
import { SupabaseGuard } from '../auth/guards/supabase.guard';
import { User } from '@prisma/client';

interface RequestWithUser extends Request {
  user: User;
}

@Controller('subjects')
@UseGuards(SupabaseGuard)
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Post()
  create(
    @Request() req: RequestWithUser,
    @Body() createSubjectDto: CreateSubjectDto,
  ) {
    return this.subjectsService.create(req.user.id, createSubjectDto);
  }

  @Get()
  findAll(@Request() req: RequestWithUser) {
    return this.subjectsService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.subjectsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
    @Body() updateSubjectDto: UpdateSubjectDto,
  ) {
    return this.subjectsService.update(id, req.user.id, updateSubjectDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.subjectsService.remove(id, req.user.id);
  }
}
