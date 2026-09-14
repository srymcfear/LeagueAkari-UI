# Build Notes

## Package for Windows

```powershell
yarn build:win
```

Output: `.7z` file in `dist/`

First time — install native deps first:

```powershell
yarn build:native:win
yarn build:win
```

## Sync with upstream (source)

```powershell
git pull upstream dev
```

## Remote setup

- `origin` → your fork (`srymcfear/LeagueAkari-UI`)
- `upstream` → original repo (`LeagueAkari/LeagueAkari`)
