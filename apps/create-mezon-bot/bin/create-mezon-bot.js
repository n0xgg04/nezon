#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const projectName = process.argv[2] || "my-mezon-bot";
const projectPath = path.resolve(process.cwd(), projectName);
const templatePath = path.join(__dirname, "..", "template");

function createProject() {
  console.log(`Creating Mezon bot project: ${projectName}...\n`);

  if (fs.existsSync(projectPath)) {
    console.error(`Error: Directory ${projectName} already exists!`);
    process.exit(1);
  }

  fs.mkdirSync(projectPath, { recursive: true });
  fs.mkdirSync(path.join(projectPath, "src"), { recursive: true });
  fs.mkdirSync(path.join(projectPath, "src", "bot"), { recursive: true });

  copyTemplateFiles();
  createPackageJson();
  createEnvFile();
  installDependencies();

  console.log(`\n✅ Project created successfully!\n`);
  console.log(`Next steps:`);
  console.log(`  cd ${projectName}`);
  console.log(`  cp .env.example .env`);
  console.log(
    `  # Get your bot token and bot ID at: https://mezon.ai/developers/applications`
  );
  console.log(`  # Edit .env and add your MEZON_TOKEN and MEZON_BOT_ID`);
  console.log(`  yarn start:dev\n`);
}

function copyTemplateFiles() {
  const files = [
    { src: "src/main.ts", dest: "src/main.ts" },
    { src: "src/app.module.ts", dest: "src/app.module.ts" },
    { src: "src/app.controller.ts", dest: "src/app.controller.ts" },
    { src: "src/app.service.ts", dest: "src/app.service.ts" },
    { src: "src/bot/examples/index.ts", dest: "src/bot/examples/index.ts" },
    {
      src: "src/bot/examples/example-command.handlers.ts",
      dest: "src/bot/examples/example-command.handlers.ts",
    },
    {
      src: "src/bot/examples/example-component.handlers.ts",
      dest: "src/bot/examples/example-component.handlers.ts",
    },
    {
      src: "src/bot/examples/example-dm.handlers.ts",
      dest: "src/bot/examples/example-dm.handlers.ts",
    },
    {
      src: "src/bot/examples/example-embed.handlers.ts",
      dest: "src/bot/examples/example-embed.handlers.ts",
    },
    {
      src: "src/bot/examples/example-event.handlers.ts",
      dest: "src/bot/examples/example-event.handlers.ts",
    },
    {
      src: "src/bot/examples/example-mention.handlers.ts",
      dest: "src/bot/examples/example-mention.handlers.ts",
    },
    { src: "tsconfig.json", dest: "tsconfig.json" },
    { src: "tsconfig.build.json", dest: "tsconfig.build.json" },
    { src: "nest-cli.json", dest: "nest-cli.json" },
    { src: ".gitignore", dest: ".gitignore" },
    { src: ".env.example", dest: ".env.example" },
  ];

  files.forEach(({ src, dest }) => {
    const srcPath = path.join(templatePath, src);
    const destPath = path.join(projectPath, dest);
    if (fs.existsSync(srcPath)) {
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

function createPackageJson() {
  const packageJson = {
    name: projectName,
    version: "0.0.1",
    description: "Mezon bot built with Nezon",
    author: "",
    private: true,
    license: "UNLICENSED",
    scripts: {
      build: "nest build",
      format: 'prettier --write "src/**/*.ts" "test/**/*.ts"',
      start: "nest start",
      "start:dev": "nest start --watch",
      "start:debug": "nest start --debug --watch",
      "start:prod": "node dist/main",
      lint: 'eslint "{src,apps,libs,test}/**/*.ts" --fix',
      test: "jest",
      "test:watch": "jest --watch",
      "test:cov": "jest --coverage",
      "test:debug":
        "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
      "test:e2e": "jest --config ./test/jest-e2e.json",
    },
    dependencies: {
      "@n0xgg04/nezon": "^1.2.6",
      "@nestjs/common": "^10.0.0",
      "@nestjs/config": "^4.0.2",
      "@nestjs/core": "^10.0.0",
      "@nestjs/platform-express": "^10.0.0",
      "reflect-metadata": "^0.1.13",
      rxjs: "^7.8.1",
    },
    devDependencies: {
      "@nestjs/cli": "^10.0.0",
      "@nestjs/schematics": "^10.0.0",
      "@nestjs/testing": "^10.0.0",
      "@types/express": "^4.17.17",
      "@types/jest": "^29.5.2",
      "@types/node": "^20.3.1",
      "@types/supertest": "^2.0.12",
      "@typescript-eslint/eslint-plugin": "^5.59.11",
      "@typescript-eslint/parser": "^5.59.11",
      eslint: "^8.42.0",
      "eslint-config-prettier": "^8.8.0",
      "eslint-plugin-prettier": "^4.2.1",
      jest: "^29.5.0",
      prettier: "^2.8.8",
      "source-map-support": "^0.5.21",
      supertest: "^6.3.3",
      "ts-jest": "^29.1.0",
      "ts-loader": "^9.4.3",
      "ts-node": "^10.9.1",
      "tsconfig-paths": "^4.2.0",
      typescript: "^5.1.3",
    },
    jest: {
      moduleFileExtensions: ["js", "json", "ts"],
      rootDir: "src",
      testRegex: ".*\\.spec\\.ts$",
      transform: {
        "^.+\\.(t|j)s$": "ts-jest",
      },
      collectCoverageFrom: ["**/*.(t|j)s"],
      coverageDirectory: "../coverage",
      testEnvironment: "node",
    },
  };

  fs.writeFileSync(
    path.join(projectPath, "package.json"),
    JSON.stringify(packageJson, null, 2) + "\n"
  );
}

function createEnvFile() {
  const envExample = `MEZON_TOKEN=your_mezon_token_here
MEZON_BOT_ID=your_bot_id_here
`;
  fs.writeFileSync(path.join(projectPath, ".env.example"), envExample);
}

function installDependencies() {
  console.log("Installing dependencies...");
  try {
    process.chdir(projectPath);
    let hasYarn = false;
    try {
      execSync("which yarn", { encoding: "utf-8", stdio: "ignore" });
      hasYarn = true;
    } catch {
      hasYarn = false;
    }
    if (hasYarn) {
      execSync("yarn install", { stdio: "inherit" });
    } else {
      execSync("npm install", { stdio: "inherit" });
    }
  } catch (error) {
    console.warn("\n⚠️  Failed to install dependencies automatically.");
    console.log('Please run "yarn install" or "npm install" manually.\n');
  }
}

createProject();
