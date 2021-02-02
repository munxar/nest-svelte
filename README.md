## TL&DR
If you can't wait to get started, this is for you:
```bash
git clone git@github.com:munxar/nest-svelte.git
cd nest-svelte
npm i
npm run start:dev
```
## The Techstack
### What is NestJS?
[NestJS](https://nestjs.com/) is a framework for Node.js backend web applications. It can be compared with [Spring Boot](https://spring.io/) or [Symfony](https://symfony.com/). It's architecture is heavily influenced by [Angular](https://angular.io/) and so it handles [TypeScript](https://www.typescriptlang.org/) as first class citizen.

For me NestJS was a real game changer when it comes to Node.js backend development. It comes with a lot of helpful utilities that you usually would add by yourself, but it let's you change almost all aspects of the framework. Additionally im a big fan of di containers, because they make testing and modularity of your app so much easier.

I don't go into more details about NestJS. If you are interested I highly recomend the very good documentation at [NestJS Documentation](https://docs.nestjs.com/). It covers almost every part of the framework, so I stick to the things we need for our app and give cross references where needed.

### Why, Svelte? Isn't Svelte a "Frontend Framework"?
Well, No. Svelte is a compiler that transforms .svelte components into html, javascript and css.
But why not use Pug, Handlebars, (insert any express view engine available)?
The answer is **components**. I personally like using components for building UIs especially in the way Svelte implements them.
As a sidenote: There is a project [Express React Views](https://github.com/reactjs/express-react-views) that lets you render React components with Express. We'll do the same thing, but with Svelte!

### Why not Sapper?
[Sapper](https://sapper.svelte.dev/) (short for **S**velte **App** Mak**er**) gives us a default template which does server side rendering (SSR) with [Polka](https://github.com/lukeed/polka) or [Express](https://expressjs.com/). There is a basic router included, that generates routes from your folder / file structure similar to [Nuxt.js](https://nuxtjs.org/) or [Next.js](https://nextjs.org/). On top it includes a basic web service implementation to use it as a progressive web app (PWA).
This is all super helpful but it's very limited when it comes to complex business logic and you'll shortly run into the same problems as with plain Express apps.

## Let's Get Started
### Create a NestJS application
Enough talk, let's write some code. I start by setting up a basic NestJS application
```bash
npx nest new nest-svelte
# I'll choose npm as package manager
cd nest-svelte
npm run start:dev
```
The last command spawns a development server. When I enter the url http://localhost:3000 into my browser, I can see a simple *Hello World!*.
### NestJS Application Structure
```bash
# tree -L 2 -I "node_modules|dist"
├── README.md
├── nest-cli.json
├── package-lock.json
├── package.json
├── src
│   ├── app.controller.spec.ts
│   ├── app.controller.ts
│   ├── app.module.ts
│   ├── app.service.ts
│   └── main.ts
├── test
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
├── tsconfig.build.json
└── tsconfig.json
```
It's a fairly simple structure. I drop the details about testing for now and focus on the **src/** directory. The entrypoint for every NestJS application is the **src/main.ts** file.
```ts
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();
```
Quite simple and self explanatory. The NestFactory creates a AppModule by resolving all it's dependencies and then this instance called **app** is listening on port **3000**.
The **app.listen(3000)** part looks very similar to express, and in really that's what's happening under the hoods.
Everything is located in an async function called **bootstrap** that is called right after it's declaration. This is due to the fact that in Node.js you can't (yet) have top level await calles.
Let's open the file **src/app.module.ts** next.
```ts
// src/app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

This looks a lot like Angular to me, and indeed it's quite the same concept:
Everything is composed out of **modules**, like the one above. The name of the class is not important, but helps other develpers to get an idea what it's purpose is. The **@Module** is a class [decorator](https://www.typescriptlang.org/docs/handbook/decorators.html) and it's argument is an configuration object that contains all the information for NestJS to resolve this module.
- **imports** is an array with all dependencies to other modules
- **controllers** lists all controllers that this module provides
- **prodviders** are all service classes of this module that should be resolved by the dependency container
- **exports** (not used here) lists all service classes that should be visible to other modules that import this module.
So this is it, with this basic concepts you can already build very complex but yet maintainable, modular and testable (web) applications.
Let's check out the controller:

```ts
// src/controller.ts
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
```

Again a simple class with a decorator **@Controller** that tells NestJS to treat this class as a web application controller. The method **getHello** is annotated with **@Get()** which is the short form of **@Get('/')**. In other words, NestJS routes get requests with a path of **/** to the method **getHello()**. 
The instance of the controller is provided by NestJSs dependency injection container as a per-request singleton. This dependency container is although responsible for injecting an instance of type **AppService** into the contructor of the **AppController** class.
Let's inspect the **AppService** now:

```ts
// src/app.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
}
```
And again, a simple class called **AppService**. The only notable difference is the class decorator **@Injectable()** for service classes compared to **@Controller()** on the controller class. Additionally the service instance is provided as singleton on application scope.
Until now I covered the **M**odel and the **C**ontroller layer of the *MVC* architecture, now I'll extend the app with a **V**iew layer.

## The View Layer
To enable a view engine in NestJS I need to add three things:
1. add a view engine on express level
2. add **@Render("index")** decorators to the controller method that should render a view.
3. add a file **views/index.svelte** and add some content

### Configure The View Engine
First I make changes to the src/main.ts file:
```ts
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { svelteViewEngine } from './svelte-view-engine';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.engine('svelte', svelteViewEngine);
  app.setViewEngine('svelte');

  await app.listen(3000);
}
bootstrap();
```
The first thing I did is importing and using the **NestExpressApplication** interface as template argument on the create method. This gives TypeScript more information about the app instance and I can use some express specific methods like **app.engine()** and **app.setViewEngine()**.
The **app.engine()** call sets a view engine whenever a .svelte file is requestet. The **setViewEngine()** call on the other hand tells express what the default view extension is, if we omit it in the call to **@Render()**. Last but not least I created and imported a file with the svelte view engine implementation:
```ts
// src/svelte-view-engine.ts
export function svelteViewEngine(filePath: string, options: any, next) {
    next(null, 'todo: implement me!')
}
```
A view engine in express is just that, a function with three arguments. The **filePath** contains the absolute path to the requested view, **options** is what the controller method returns plus global view data and **next** is the traditional express middleware like callback.
The only think missing is the real implementation, but for now we close the loop by adding the last puzzle piece for actually executing this code in the **AppController**
```ts
// src/app.controller
import { Controller, Get, Render } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  @Render('index')
  getHello() {
    return { message: 'NestJS <3 Svelte' };
  }
}
```
First I removed the service, because I don't need it for this example. Second I added a decorator **@Render('index')** on the getHello() method. Decorators are called in order they are applied, in this case the order is not important. Third I changed the getHello() signature and return an object instead of the string. This part is important, if you return non objects and use the render decorator, express will complain because it expects an object.

The final step is the template itself
```html
<!-- views/index.svelte -->
<script>
    export let message;
</script>
<h1>{message}</h1>
```
Very basic, but it'll get the job done. If I start my dev server and locate my browser to localhost:3000 it displays: **todo: implement me!** and this is exaclty what I gona do now.
### Implement the Svelte Template Engine
It sounds harder than it is. Luckily the Svelte compiler has a very elegant way to render a .svelte file, but first I install it:
```bash
npm i svelte
```
Now that we have the svelte compiler available, I activate it by importing the registration script **svelte/register** inside of the view engine file.
```ts
// src/svelte-view-engine.ts
import 'svelte/register';

export function svelteViewEngine(filePath: string, options: any, next) {
  const Component = require(filePath).default;
  const { html } = Component.render(options);
  next(null, html);
}
```
The important part happens in **require(filePath)**. Because the filePath is ending in .svelte, the registered svelte integration kicks in and compiles the file in a full featured Svelte component inside of Node.js. The call to render() takes the view model and renders it with the template.
With the dev server running, I get the output **NestJS <3 Svelte** in my browser. Awesome! My Svelte template is rendered.
## Improve the Svelte Template Engine
The current implementation doesn't satisfy me. Nor does it generate a valid html document, nor can I use features like styled components. Let's fix this.
### Layouts
While there are several ways to handle this, I'll go for componen composition. So I create a **Layout.svelte** component like this:
```html
<!-- views/Layout.svelte -->
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body>
    <slot />
  </body>
</html>
```
A basic html page with a **<slot />** element. In Svelte this is where the components content is output if you wrap the component around it.
Back in the `views/Home.svelte` component I can use this layout.
```html
<!-- views/Home.svelte -->
<script>
  import Layout from './Layout.svelte';
  export let message;  
</script>

<Layout>
  <h1>{message}</h1>    
</Layout>
```
After restarting the dev server I see a valid html page in my browser. Awesome, but the there is no styling and the page title is missing. Let me fix that
```html
<!-- views/Home.svelte -->
<script>
  import Layout from './Layout.svelte';
  export let message;  
</script>

<svelte:head>
  <title>Home</title>
</svelte:head>

<Layout>
  <h1>{message}</h1>    
</Layout>

<style>
  h1 {
    color: purple;
  }
  :global(body) {
    background-color: pink;
  }
</style>
```
This still doesn't work yet. Svelte generates the css and head elements, but I don't use them in the svelte template engine. First I need a way to inject some markup into the generated html, the layout component seams right for this purpose.
```html
<!-- views/Layout.svelte -->
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    %head%
  </head>
  <body>
    <slot />    
  </body>
</html>
```

Here I use a made up string **%head%** to have something i can replace. In the template engine it looks like this:

```ts
// src/svelte-view-engine.ts
import { identity } from 'rxjs';

export function svelteViewEngine(filePath: string, options: any, next) {
  const Component = require(filePath).default;
  let { html, head, css } = Component.render(options);
  if(css.code) {
    head = `${head}<style>${css.code}</style>`
  }
  next(null, html.replace('%head%', head));
}
```
The call to Component.render() return a **head** and a **css** attribute. The **if**-condition checks if there are styles and adds them to the head. After that in the **html** markup my string **%head%** is replaced by it.
Now when I restart the dev server and reload my browser I get all the css injected and even the pages title is set correctly. Fantastic!
### More Pages
Let my finish this little app by adding an about page and a simple nav component.
```html
<!-- views/About.svelte -->
<script>
  import Layout from './Layout.svelte';
</script>

<svelte:head>
  <title>About</title>
</svelte:head>

<Layout>
  <h1>About</h1>
  <div>
    Lorem ipsum dolor sit amet consectetur adipisicing elit. Amet non architecto
    magni aut eveniet aperiam possimus debitis praesentium, distinctio magnam ex
    nulla illum unde aliquid vitae excepturi, maiores vel fugiat.
  </div>
</Layout>
```
```ts
// src/app.controller.ts
import { Controller, Get, Render } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  @Render('Home')
  getHello() {
    return { message: 'NestJS ❤ Svelte' };
  }
  
  @Get('/about')
  @Render('About')
  getAbout() {
  }
}
```
```html
<!-- views/Nav.svelte -->
<nav>
    <a href="/">Home</a>
    <a href="/about">About</a>
</nav>
```
```html
<!-- views/Layout.svelte -->
<script>
  import Nav from './Nav.svelte';
</script>

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    %head%
  </head>
  <body>
    <header>
      <Nav />
    </header>
    <main>
      <slot />
    </main>
  </body>
</html>
```
That was quit some code, but you'll get the the idea. From here you can build quite some complex fullstack mvc web applications. So what's the catch?

## Things to Improve
One thing that I noticed is that the default tsc compiler doesn't catch .svelte file changes. Everytime I make a change in a .svelte component I have to restart the dev server manually.
Because I went with the explicity Layout.svelte component, I have to pass down state from every page into this component if needed, this could play a little agains the DRY principle.
Beside that, I can't find a Svelte feature that didn't work, except the obvious cases where you run client side JavaScript like event handlers or the like.

## Closing Round
I tried to demonstrate how a traditional fullstack application can be build with NestJS and how I intergrate Svelte as a template engine to build modern component based views.
I hope you enjoyed this little like I did and learned a few new things.
