#!/bin/bash
set -euo pipefail

# --- Set repo details
OWNER="HonchoBTC"
REPO="insur-connect"
echo "➡️ Repo: $OWNER/$REPO"

# --- Ensure milestones
ensure_ms () {
  local TITLE="$1" DESC="$2"
  local NUM
  NUM=$(gh api repos/$OWNER/$REPO/milestones --jq ".[] | select(.title==\"$TITLE\") | .number" 2>/dev/null || echo "")
  if [[ -z "$NUM" ]]; then
    echo "Creating milestone: $TITLE"
    gh api repos/$OWNER/$REPO/milestones -X POST -f title="$TITLE" -f description="$DESC" >/dev/null
    NUM=$(gh api repos/$OWNER/$REPO/milestones --jq ".[] | select(.title==\"$TITLE\") | .number")
  fi
  echo "$NUM"
}

MS11=$(ensure_ms "v0.1.1" "Bugfix + export/import polish")
MS20=$(ensure_ms "v0.2.0" "Campaign builder + Outlook + settings")
echo "Milestones: v0.1.1=$MS11, v0.2.0=$MS20"

# --- Ensure labels
echo "Creating labels..."
for LBL in "priority:high:#d73a4a" "priority:med:#fbca04" "priority:low:#0e8a16" "type:feat:#006b75" "type:chore:#c2e0c6" "type:bug:#b60205"; do
  NAME="${LBL%%:*}"
  REST="${LBL#*:}"
  COLOR="${REST##*:}"
  gh label create "$NAME" -c "$COLOR" 2>/dev/null || true
done

# --- Retarget any open PRs with base=main to base=develop
echo "Retargeting open PRs from base=main -> base=develop (if any)…"
mapfile -t PRS < <(gh pr list --state open --json number,baseRefName --jq '.[] | select(.baseRefName=="main") | .number' 2>/dev/null || echo "")
for PR in "${PRS[@]}"; do
  if [[ -n "$PR" ]]; then
    echo "↪ gh pr edit #$PR --base develop"
    gh pr edit "$PR" --base develop
  fi
done

# --- Helper: create PR if not exists
create_pr_if_missing () {
  local BR="$1" TITLE="$2" BODY="$3" MSNUM="$4" LABELS="$5"

  # Check if PR already exists
  if gh pr list --state open --json headRefName --jq ".[] | select(.headRefName==\"$BR\")" 2>/dev/null | grep -q "$BR"; then
    echo "PR already open for $BR"
    return
  fi

  # Check if branch exists
  git fetch origin "$BR" >/dev/null 2>&1 || true
  if ! git show-ref --quiet "refs/remotes/origin/$BR"; then
    echo "⚠️ Branch $BR not found on origin; skipping"
    return
  fi

  echo "Creating PR for $BR -> develop"
  gh pr create --base develop --head "$BR" --title "$TITLE" --body "$BODY" --draft

  # Get PR number
  PRNUM=$(gh pr list --state open --json number,headRefName --jq ".[] | select(.headRefName==\"$BR\") | .number")

  # Add labels
  IFS=',' read -ra LARR <<< "$LABELS"
  for L in "${LARR[@]}"; do
    gh pr edit "$PRNUM" --add-label "$L"
  done

  # Add milestone
  gh pr edit "$PRNUM" --milestone "$MSNUM"
}

# --- PR body template
BODY_COMMON="## What & Why

(see title)

## Screenshots / Demos

(attach)

## How to Test

- Follow acceptance criteria for this feature

## Checklist

- [x] CI passes
- [x] Signed commits
- [x] RLS respected
- [ ] CHANGELOG updated if needed"

# --- Create PRs for each feature branch
create_pr_if_missing "feature/csv-bulk-import" \
  "feat(csv): bulk import RPC with validation + onboarding links" \
  "$BODY_COMMON" "$MS11" "type:feat,priority:high"

create_pr_if_missing "feature/reports-export" \
  "feat(reports): export CSV/XLSX respecting filters" \
  "$BODY_COMMON" "$MS11" "type:feat,priority:high"

create_pr_if_missing "feature/stripe-webhook-lifecycle" \
  "feat(billing): handle subscription lifecycle + plan gates" \
  "$BODY_COMMON" "$MS11" "type:feat,priority:med"

create_pr_if_missing "chore/responsive-polish" \
  "chore(ui): responsive polish (dashboard, reports, onboarding)" \
  "$BODY_COMMON" "$MS11" "type:chore,priority:med"

create_pr_if_missing "feature/campaign-builder-ui" \
  "feat(campaigns): builder UI + attach flows" \
  "$BODY_COMMON" "$MS20" "type:feat,priority:med"

create_pr_if_missing "feature/settings-agency-billing" \
  "feat(settings): agency profile, seats, Stripe portal link" \
  "$BODY_COMMON" "$MS20" "type:feat,priority:med"

echo "✅ Done. Review open PRs and watch CI. Mark Ready for review when green."