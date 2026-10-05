# Crown & Ash RC10 Windows release evidence

Source candidate: `ai/crown-and-ash-rc10-state-recovery-gated-20261005`

Source commit: `8368f12897e88289d248c26d193fc481b0f5f318`

Release workflow run: `37286152160`

Release workflow conclusion: **success**

## Verified Windows lifecycle

The Windows release job completed all of the following successfully on the source commit:

- chess rules
- productization/offline contract
- 30-character roster integrity
- faction audio
- Xbox and PlayStation-compatible controller behavior
- complete browser gameplay
- Windows NSIS packaging
- packaged Windows runtime smoke test
- installed Windows lifecycle

The produced installer was:

`Crown-and-Ash-0.2.0-x64.exe`

The installed executable was:

`Crown-and-Ash.exe`

The installed lifecycle gate verified silent install, launch from a fresh user profile, fully local/offline runtime behavior, clean exit, and silent uninstall.

## Rollback/reference artifact

GitHub Actions artifact:

- name: `crown-and-ash-windows-unsigned`
- artifact id: `11334432775`
- size: `111594477` bytes
- GitHub artifact digest: `sha256:b6fea7d6cd0d46a9bafc37433a906155ecaa6d98b4d1d52ced33fe16dd3e616a`
- source branch: `ai/crown-and-ash-rc10-state-recovery-gated-20261005`
- source commit: `8368f12897e88289d248c26d193fc481b0f5f318`
- created: `2026-10-05T08:54:57Z`
- expires: `2027-01-03T08:50:31Z`

This artifact is an unsigned internal Windows test build only. It is not authorized for public distribution or Steam publication.

## Scope boundary

This evidence record changes no runtime, gameplay, website, installer, or packaging behavior. It preserves RC10 as the known-green source and provides an explicit rollback/reference identity for later release-candidate comparisons.
