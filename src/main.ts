import 'svelte/register';

import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { svelteViewEngine } from './svelte-view-engine';
import { Logger } from '@nestjs/common';

async function bootstrap() {  
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.engine('svelte', svelteViewEngine);
  app.setViewEngine('svelte');  
  await app.listen(3000);
  Logger.log(`server listening: ${await app.getUrl()}`)
}
bootstrap();
