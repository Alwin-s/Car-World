# CarWorld

Website (`apps/web`) and API (`apps/api`) in one pnpm workspace. No database in this step.

## Start the website

From the project root, install once:

```bash
pnpm install
```

Then start the website:

```bash
pnpm --filter web dev
```

Open [http://localhost:5173](http://localhost:5173). You should see a page with the heading **CarWorld**.

## Start the API

In a **second** terminal, from the project root:

```bash
pnpm --filter api start:dev
```

Then open [http://localhost:3000/health](http://localhost:3000/health). You should see `{"status":"ok"}`.
