# Crown & Ash RC12 Windows release evidence

Status: internal QA evidence only. This document does **not** authorize merge, deployment, public distribution, or Steam publication.

## Source

- Candidate branch: `ai/crown-and-ash-rc12-audit-accessibility-20261005`
- Candidate commit: `3b7e7e5363e4f3e7e7449942d8ca21a38a3be71f`
- Protected baseline: `ai/crown-and-ash-release-hardening` @ `9e7a05beceafe75ca2d155c71cdec2224b32b7d0`
- Evidence captured from GitHub Actions on 2026-10-05.

## Crown & Ash gate results

All applicable Crown & Ash workflows observed for RC12 completed successfully:

- Crown & Ash Release — run `37309239018` — SUCCESS
- Crown & Ash Final Audit — run `37309238890` — SUCCESS
- Crown & Ash Accessibility — run `37309238926` — SUCCESS
- Crown & Ash Controller Gate — run `37309238916` — SUCCESS
- Crown & Ash Edition Boundary — run `37309239028` — SUCCESS
- Crown & Ash State Recovery — run `37309238991` — SUCCESS
- Crown & Ash Performance Candidate — run `37309238882` — SUCCESS
- Crown & Ash Combat Choreography — run `37309238975` — SUCCESS
- Crown & Ash Combat VFX — run `37309238937` — SUCCESS
- Crown & Ash Contact Physics — run `37309238893` — SUCCESS
- Crown & Ash Camera Choreography — run `37309238948` — SUCCESS
- Crown & Ash Board Motion — run `37309238987` — SUCCESS
- Crown & Ash Material Language — run `37309238986` — SUCCESS
- Crown & Ash Role Readability — run `37309239054` — SUCCESS
- Crown & Ash Audio Candidate — run `37309238990` — SUCCESS

The unrelated repository-wide Site validation and OSU science-safe overlay jobs failed on this commit. They are outside the Crown & Ash release boundary and are not represented as passing here.

## Windows lifecycle evidence

Crown & Ash Release run `37309239018` completed the Windows `verify-and-package` job successfully. The following release steps each completed successfully in order:

1. chess rules
2. productization/offline contract
3. 30-character roster integrity
4. faction audio
5. Xbox and PlayStation-compatible controller behavior
6. complete browser gameplay
7. desktop dependency install
8. Windows NSIS build
9. packaged Windows runtime smoke
10. installed Windows lifecycle
11. unsigned internal artifact upload

The installed lifecycle gate exercises silent NSIS install, launch from a fresh Windows profile, pinned local Three.js/offline file-protocol assertions, desktop preload bridge availability, clean process exit, and silent uninstall.

## Current RC12 internal Windows artifact

- GitHub artifact id: `11344194906`
- Artifact name: `crown-and-ash-windows-unsigned`
- Uploaded size: `111595176` bytes
- GitHub artifact digest: `sha256:96f0519656aff98c5cfeed7ad22eddf19e8546cf5a16186ffe00afab7a64ea3d`
- Workflow run: `37309239018`
- Head SHA: `3b7e7e5363e4f3e7e7449942d8ca21a38a3be71f`
- Expiration: `2027-01-03T12:23:50Z`
- External/public distribution: **not authorized**

The GitHub digest above identifies the uploaded Actions artifact archive. It is not asserted here to be the raw installer EXE checksum.

## Rollback/reference artifact

Last prior verified-green RC11 artifact retained for rollback/reference:

- Source branch: `ai/crown-and-ash-rc11-presentation-windows-20261005`
- Source SHA: `659cd6a84ab9baf7f853769e7b117c9054661c1f`
- Crown & Ash Release run: `37305817229` — SUCCESS
- GitHub artifact id: `11343417686`
- Artifact name: `crown-and-ash-windows-unsigned`
- Uploaded size: `111595190` bytes
- GitHub artifact digest: `sha256:da3d2884a090cf75ad1dce8d7e17d7df989170309f37f9cbb314a66d8504a85f`
- Expiration: `2027-01-03T11:53:13Z`

## Release-owner interpretation

RC12 has a green Crown & Ash Windows build/install/offline/uninstall path and a retained green rollback artifact. This evidence file is documentation only; it does not change runtime behavior, edition gating, packaging configuration, protected branches, or release authorization.
