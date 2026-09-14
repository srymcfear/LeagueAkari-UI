import { execSync } from 'child_process'

function run(cmd, ignoreError = false) {
  try {
    return execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim()
  } catch (err) {
    if (ignoreError) return ''
    throw err
  }
}

function log(msg) {
  console.log(`\x1b[36m==>\x1b[0m ${msg}`)
}

function success(msg) {
  console.log(`\x1b[32m✔\x1b[0m ${msg}`)
}

function warn(msg) {
  console.log(`\x1b[33m⚠\x1b[0m ${msg}`)
}

function error(msg) {
  console.error(`\x1b[31m✖\x1b[0m ${msg}`)
}

async function main() {
  log('Setting up Git merge driver and rerere...')
  run('git config merge.ours.driver true')
  run('git config rerere.enabled true')

  // Check if uncommitted changes exist
  const status = run('git status --porcelain', true)
  let stashed = false
  if (status) {
    warn('Uncommitted changes detected. Creating temporary stash...')
    run('git stash push -m "temp-stash-before-upstream-sync"')
    stashed = true
  }

  try {
    log('Fetching updates from upstream (LeagueAkari/LeagueAkari)...')
    run('git fetch upstream dev')

    const upstreamRev = run('git rev-parse upstream/dev')
    const baseRev = run('git merge-base HEAD upstream/dev')

    if (upstreamRev === baseRev) {
      success('Source chinh chua co commit moi. Code cua ban da la moi nhat!')
    } else {
      log('Phat hien commit moi tu upstream, dang tien hanh gop an toan...')

      // Create a safety backup branch
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
      const backupBranch = `backup-ui-${timestamp}`
      run(`git branch ${backupBranch}`)
      log(`Da tao nhanh backup an toan: ${backupBranch}`)

      // Merge with custom ui preservation via .gitattributes
      execSync(
        'git merge upstream/dev -m "chore(sync): auto-merge upstream while preserving custom layout"',
        {
          stdio: 'inherit'
        }
      )
      success('Gop thanh cong! Toan bo layout custom da duoc bao toan nguyen ven.')
    }
  } catch (err) {
    error(`Qua trinh gop gap van de: ${err.message}`)
  } finally {
    if (stashed) {
      log('Phuc hoi lai cong viec dang do (git stash pop)...')
      try {
        run('git stash pop')
      } catch (err) {
        warn('Khong the pop stash tu dong, vui long kiem tra `git stash list`.')
      }
    }
  }

  success('Hoan tat!')
}

main()
