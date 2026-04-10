# req_changelog

## 说明

- 这里记录每次已推送会话中的用户原始需求，避免后续实现偏离。
- 当前仓库刚接入该文件，历史会话暂不补录。

## 已推送需求

- 2026-04-10
  - 原话：`check current implementation of claude code switch is sound. because I need to refresh claude code oauth every other day. maybe it is because I logged out from browser right after I refreshed it or because the bad implementation.`
  - 原话：`can you open a private browsing window so that I dont need to log out? for the others, just implement`
  - 审计结论：实现基本正确，频繁重新认证最可能的原因是登录后注销浏览器导致 OAuth token 被撤销
  - 修复：(1) 登录时通过 BROWSER 环境变量打开隐私窗口 (2) 修复同 profile 切换时覆盖新鲜凭据的 bug (3) 凭据文件权限从 0o644 改为 0o600

## 待推送需求

- 2026-04-06
  - 原话：`curl + bun + Homebrew 公式`
  - 原话：`再加 GitHub Actions release 自动化`
  - 原话：`根据git历史记录了解本项目目前为止遇到的问题，结合当前的项目形态，增加测试用例，以后要通过后才能发布`
  - 原话：`我遇到这个问题，你看看是本项目切换的问题还是我的token确实过期了`
  - 原话：`是 refresh alias更好，还是refresh codex/claude更好`
  - 原话：`可以，就这么改代码吧`
- 2026-04-07
  - 原话：`我发现这个项目命名有错误，是claudex-switch才对，要怎么改？`
  - 原话：`另外，已经安装的用户要怎么更新项目`
  - 原话：`改好了。其他你全部处理完`
  - 原话：`我本地遇到这个问题`
  - 原话：`但是我刚跑完`
  - 原话：`总结这次经验，增加test case。然后把整个发布流程写到.claude/skills作为一个skill,以免下次有遗漏`
  - 原话：`开始`
