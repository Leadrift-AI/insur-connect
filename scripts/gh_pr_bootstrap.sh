#!/usr/bin/env bash
set -euo pipefail

# --- nicer errors ---
trap 'echo -e "\n❌ Error at line $LINENO: \`$BASH_COMMAND\`"; exit 1' ERR

# Config
BRANCH_NAME="setup/pc-bootstrap"
PR_TITLE="chore(setup): PC bootstrap"
PR_BODY="Node 20 via .nvmrc, ignore .env.local, CLIs verified on new PC."

green(){ printf "\033[32m%s\033[0m\n" "$*"; }
yellow(){ printf "\033[33m%s\033[0m\n" "$*"; }
red(){ printf "\033[31m%s\033[0m\n" "$*"; }

# 0) Repo checks
if [ ! -d .git ]; then
  red "❌ Not in a git repository. cd into your repo root (e.g., insur-connect) and re-run."
  exit 1
fi

# 1) Ensure gh exists and is authed
if ! command -v gh >/dev/null 2>&1; then
  red "❌ GitHub CLI (gh) not found."
  echo "   Install: sudo apt-get update && sudo apt-get install -y gh"
  exit 1
fi

yellow "🔐 Checking GitHub auth status…"
if ! gh auth status >/dev/null 2>&1; then
  yellow "👉 Please run 'gh auth login' in another terminal tab/window."
fi
until gh auth status >/dev/null 2>&1; do sleep 2; done
green "✅ gh authenticated."

# 2) Minimal, idempotent bootstrap changes
# Ensure .gitignore exists and has a trailing newline
touch .gitignore
tail -c1 .gitignore 2>/dev/null | grep -q $'\n' || echo >> .gitignore
grep -qxF ".env.local" .gitignore || echo ".env.local" >> .gitignore

if [ ! -f .nvmrc ]; then
  echo "20" > .nvmrc
  green "✅ Wrote .nvmrc (20)"
fi

# 3) Branch and commit (only if needed)
git fetch origin --quiet || true
git checkout -B "$BRANCH_NAME"

git add .gitignore .nvmrc 2>/dev/null || true
if ! git diff --cached --quiet; then
  git commit -m "chore(setup): enforce Node 20 via .nvmrc and ignore .env.local"
  green "✅ Commit created."
else
  yellow "ℹ️ No changes to commit (already set)."
fi

# 4) Push branch (no fail if it already exists)
git push -u origin "$BRANCH_NAME" || git push origin "$BRANCH_NAME" || true
green "✅ Pushed $BRANCH_NAME."

# 5) Pick base branch
pick_base_branch() {
  # Try repo's default branch first
  local def
  def="$(gh repo view --json defaultBranchRef -q .defaultBranchRef.name 2>/dev/null || echo "")"
  if [ -n "$def" ] && git ls-remote --exit-code --heads origin "$def" >/dev/null 2>&1; then
    echo "$def"; return
  fi
  # Fallbacks
  for cand in develop main; do
    if git ls-remote --exit-code --heads origin "$cand" >/dev/null 2>&1; then
      echo "$cand"; return
    fi
  done
  echo "main"
}
BASE="$(pick_base_branch)"
yellow "ℹ️ Using base branch: $BASE"

# 6) If PR exists, show it; otherwise create it
if gh pr view --head "$BRANCH_NAME" >/dev/null 2>&1; then
  green "✅ PR already exists for $BRANCH_NAME"
  gh pr view --head "$BRANCH_NAME" --web || true
  exit 0
fi

if gh pr create --fill --title "$PR_TITLE" --body "$PR_BODY" --base "$BASE"; then
  green "✅ PR opened against '$BASE'."
  gh pr view --web || true
else
  red "❌ Failed to create PR automatically."
  # Print manual compare URL
  OWNER_REPO="$(git remote get-url origin | sed -E 's#(git@|https://)github.com[:/]|\.git##g')"
  echo "   Open manually:"
  echo "   https://github.com/${OWNER_REPO}/compare/${BASE}...${BRANCH_NAME}?expand=1"
fi
