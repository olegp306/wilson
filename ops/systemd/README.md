# Wilson systemd units (Ubuntu)

This layout matches the Wilson monorepo **Nest** build output: each app compiles to `apps/<name>/dist/main.js` (not `dist/apps/<name>/main.js`). `WorkingDirectory` is the **repository root** so `node` resolves workspace dependencies from the root `node_modules`.

If your `node` binary is not `/usr/bin/node` (e.g. **nvm**), either install a system Node, symlink, or add `PATH=...` to `/etc/wilson.env` pointing at your Node `bin` directory.

## Install

```bash
# 1) Environment file (root)
sudo mkdir -p /etc
sudo cp ops/systemd/wilson.env.example /etc/wilson.env
sudo nano /etc/wilson.env   # fill real secrets and URLs
sudo chmod 600 /etc/wilson.env

# 2) Adjust paths in unit files if your home is not /home/ubuntu
sudo cp ops/systemd/wilson*.service ops/systemd/wilson.target /etc/systemd/system/

# 3) Reload and enable
sudo systemctl daemon-reload
sudo systemctl enable wilson.target wilson-orchestrator.service wilson-admin-api.service \
  wilson-mail-agent.service wilson-task-agent.service wilson-calendar-agent.service wilson-telegram-bot.service
```

## Start / stop all

```bash
sudo systemctl start wilson.target
sudo systemctl stop wilson.target
sudo systemctl status wilson.target
```

## Logs (journal)

```bash
# All Wilson units
journalctl -u 'wilson-*' -f

# One service
journalctl -u wilson-orchestrator.service -f
journalctl -u wilson-orchestrator.service --since "1 hour ago"
```

## After deploy (new build)

```bash
cd ~/wilson && pnpm install --frozen-lockfile && pnpm run build && pnpm prisma migrate deploy
sudo systemctl restart wilson.target
```
