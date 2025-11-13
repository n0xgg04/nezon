# create-mezon-bot

Create a new Mezon bot project with Nezon framework.

## Usage

```bash
npx create-mezon-bot my-bot
```

This will create a new directory `my-bot` with a complete Mezon bot project setup.

## What's included

- NestJS project structure
- Nezon module configured
- Example handlers demonstrating:
  - Commands (`@Command`)
  - Components (`@Component`)
  - Event listeners (`@On`)
  - ButtonBuilder with onClick handlers
  - SmartMessage usage
- TypeScript configuration
- All necessary dependencies

## Next steps

After creating the project:

1. Navigate to the project directory:
   ```bash
   cd my-bot
   ```

2. Copy the environment file:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` and add your Mezon credentials:
   ```
   MEZON_TOKEN=your_mezon_token_here
   MEZON_BOT_ID=your_bot_id_here
   ```

4. Start the development server:
   ```bash
   yarn start:dev
   ```

## Documentation

Visit [https://nezon-docs.vercel.app/](https://nezon-docs.vercel.app/) for full documentation.

