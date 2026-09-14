# 🦇 FEARNOTE — srymcfear

## Session 1 — UI customization + cleanup

**Date:** 2026-07-24

### Done

- Vietnamese i18n: added 16 YAML files, wired into main & renderer
- Match card opacity slider (background-only transparency, theme-aware)
- Match card resize: smaller padding, champion icon, fonts, gaps
- Premade team overlay borders (box-shadow glow per team color)
- Hover zoom (scale 1.02) on PlayerInfoCard
- Rank flex icon bigger: 14px → 20px (ongoing game), emblem 56px → 72px (match history)
- Match card background uses `var(--la-card-surface-90)` instead of hardcoded purple
- Cleaned root trash: HTML demos, PNG screenshots, CLAUDE.md, announcement.md, out/
- Removed AI agent dirs (`.agents/`, `.claude/`, `.codex/`) from git tracking + disk
- Pushed to `github.com/srymcfear/LeagueAkari-UI`

### Pending / Next

- Sync with upstream when source updates (`git pull upstream dev`)

---

## Notes

- `origin` = fork, `upstream` = LeagueAkari/LeagueAkari
- Build: `yarn build:win`
