#!/usr/bin/env bash
set -euo pipefail

OPENCLAW_ROOT="/srv/openclaw"
OPENCLAW_APP="$OPENCLAW_ROOT/app"
OPENCLAW_CONFIG="$OPENCLAW_ROOT/config"
OPENCLAW_WORKSPACE="$OPENCLAW_ROOT/workspace"

echo "==> Updating apt"
sudo apt update
sudo apt install -y ca-certificates curl gnupg git

echo "==> Removing old Docker packages"
sudo apt remove -y docker.io docker-doc docker-compose podman-docker containerd runc || true

echo "==> Adding Docker repo"
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

source /etc/os-release
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

echo "==> Installing Docker"
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

echo "==> Enabling Docker"
sudo systemctl enable --now docker

echo "==> Adding current user to docker group"
sudo usermod -aG docker "$USER" || true

echo "==> Creating folders"
sudo mkdir -p "$OPENCLAW_ROOT" "$OPENCLAW_CONFIG" "$OPENCLAW_WORKSPACE"
sudo chown -R "$USER":"$USER" "$OPENCLAW_ROOT"

echo "==> Cloning OpenClaw"
if [ ! -d "$OPENCLAW_APP/.git" ]; then
  git clone https://github.com/openclaw/openclaw.git "$OPENCLAW_APP"
else
  echo "Repo already exists, skipping clone"
fi

echo "==> Saving env vars to ~/.bashrc"
grep -qxF 'export OPENCLAW_CONFIG_DIR=/srv/openclaw/config' ~/.bashrc || \
  echo 'export OPENCLAW_CONFIG_DIR=/srv/openclaw/config' >> ~/.bashrc

grep -qxF 'export OPENCLAW_WORKSPACE_DIR=/srv/openclaw/workspace' ~/.bashrc || \
  echo 'export OPENCLAW_WORKSPACE_DIR=/srv/openclaw/workspace' >> ~/.bashrc

export OPENCLAW_CONFIG_DIR=/srv/openclaw/config
export OPENCLAW_WORKSPACE_DIR=/srv/openclaw/workspace

echo "==> Done"
echo
echo "Next steps:"
echo "1. Re-login to apply docker group:"
echo "   exit"
echo "   ssh <user>@<server-ip>"
echo
echo "2. Go to project:"
echo "   cd /srv/openclaw/app"
echo
echo "3. Build image:"
echo "   docker build -t openclaw:local -f Dockerfile ."
echo
echo "4. Run onboarding:"
echo "   docker compose run --rm openclaw-cli onboard"
echo
echo "5. Start gateway:"
echo "   docker compose up -d openclaw-gateway"
echo
echo "6. Check health:"
echo "   curl http://127.0.0.1:18789/healthz"
echo
echo "7. Open UI through SSH tunnel from your PC:"
echo "   ssh -N -L 18789:127.0.0.1:18789 <user>@<server-ip>"
echo "   then open http://127.0.0.1:18789/#token=YOUR_TOKEN"
