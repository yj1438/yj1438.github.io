---
title: Codex 多 Provider 配置：保留官方服务，添加自定义服务并切换使用
pubDatetime: 2026-10-18T17:25:00+08:00
description: 以 ZAI 为例，说明如何在 Codex 官方 provider 之外添加自定义服务，通过 profile 在 CLI 中选择服务、修改桌面端默认值，以及旧会话迁移时遇到的 provider 丢失、TOML 作用域和历史消息格式兼容问题。
featured: true
tags:
  - Codex
  - ChatGPT
  - GLM
  - 配置
  - 踩坑
---

用 Codex 一段时间后，很容易遇到这样的需求：**官方服务继续保留，同时接入另一家模型服务，需要时切过去用。**

我的场景是 OpenAI + ZAI。原本以为改一下 `model_provider` 就够了，实际操作才发现，「切换」至少有三种意思：给这次 CLI 启动选服务、修改桌面 App 的默认服务、把已有会话迁移到另一家服务。它们的操作和影响范围都不一样。

这篇先把通用配置和切换方法讲清楚，再记录 ZAI 这个例子里遇到的几个坑。

> 记录时间：2026-10-18。本文讨论使用本机 Codex 配置的 CLI 和桌面端本地会话；不能据此外推普通 ChatGPT 云端聊天也支持更换 API 服务商。桌面端能力以本次 Windows 环境的检查结果为准，其他版本需要重新确认。

## 1. 先分清：模型、Provider、默认值、会话

`model` 回答「使用哪个模型」；`provider` 回答「通过哪个服务、用什么地址和认证方式调用它」。即使模型名称相同，通过官方接口与通过第三方网关调用，也可能是两套 provider 配置。

几个关键字段的关系如下：

| 配置                    | 作用                      | 本文示例                         |
| ----------------------- | ------------------------- | -------------------------------- |
| `model`                 | 模型标识                  | `gpt-6.1-sol` 或 `glm-5.3-flash` |
| `model_provider`        | 选择 provider ID          | `openai` 或 `ZAI`                |
| `[model_providers.ZAI]` | 定义一个自定义 provider   | 地址、认证、协议等               |
| `name`                  | provider 的显示名称       | `ZAI`                            |
| `base_url`              | API 基础地址              | 自定义服务的接入地址             |
| `env_key`               | 存放 API key 的环境变量名 | `ZAI_API_KEY`                    |
| `wire_api`              | 接口协议                  | `responses`                      |

`openai` 是内置 provider，可以直接使用。添加 ZAI 时，保留内置 `openai`，另外定义 `[model_providers.ZAI]` 即可。**引用时对应的是表名里的 ID `ZAI`，不是显示名称 `name`。** 配置字段的准确含义见 [OpenAI 官方配置参考](https://learn.chatgpt.com/docs/config-file/config-reference)。

更容易忽略的是另一层关系：

```text
用户配置
├─ 默认选择：openai / 官方模型
└─ 自定义定义：ZAI / 地址、认证、协议

会话 A ── 保存自己的 provider：openai
会话 B ── 保存自己的 provider：ZAI
```

这是本次排查确认的行为：**修改全局默认值，不会自动把所有旧会话改成这个 provider。** 同一个桌面 App 里的不同本地会话，也可以保存不同的 provider，不能把它理解成整个 App 永远只能使用一家服务。

## 2. 在官方配置之外，添加自定义 Provider

默认情况下，用户配置文件是 `~/.codex/config.toml`。Windows 中，`~` 对应用户目录；如果设置了 `CODEX_HOME`，则要检查实际使用的配置目录。

下面保留官方服务作为默认值，并加入 ZAI 定义：

```toml
# ~/.codex/config.toml
# 顶层：默认仍使用官方服务
model_provider = "openai"
model = "gpt-6.1-sol"

# 自定义服务定义
[model_providers.ZAI]
name = "ZAI"
base_url = "https://open.bigmodel.cn/api/v1"
env_key = "ZAI_API_KEY"
wire_api = "responses"
requires_openai_auth = false
```

这里的地址和模型名来自我本机这次接入的配置，**不代表所有 ZAI 套餐或网关都使用这个地址，也不代表接入已经通过实际请求验证**。照着配置时，应换成服务商为你提供的地址和模型 ID，并确认它支持 Codex 所需的 Responses 接口。只有「OpenAI 兼容」几个字，还不足以确认兼容范围。

`env_key = "ZAI_API_KEY"` 填的是**变量名**，不是 key 本身。实际凭据放在启动 Codex 的进程能读取到的环境变量里。官方配置也支持 `experimental_bearer_token` 直接填 token，但明确建议优先使用 `env_key`。

桌面端还要留意进程环境：在某个 PowerShell 窗口里临时设置变量，不代表已经启动的桌面 App 能读到它。配置好桌面进程可继承的环境后，需要重新启动应用。

provider 的定义应放在用户级配置里。当前官方文档明确说明，项目里的 `.codex/config.toml` 不能覆盖 `model_provider`、`model_providers` 等字段，放进去会被忽略并产生启动警告。详见[项目配置的限制](https://learn.chatgpt.com/docs/config-file/config-advanced#project-config-files-codexconfigtoml)。

## 3. CLI：用两套 Profile 选择服务

与其每次手改全局配置，不如准备两套 profile，每套同时指定 provider 和配套模型。

当前文档使用与 `config.toml` 同目录的独立文件：

```toml
# ~/.codex/openai.config.toml
model_provider = "openai"
model = "gpt-6.1-sol"
```

```toml
# ~/.codex/zai.config.toml
model_provider = "ZAI"
model = "glm-5.3-flash"
```

ZAI 的地址、认证等公共定义仍放在基础 `config.toml` 中。profile 负责选择组合。

新建会话时：

```powershell
# 使用官方服务
codex -p openai

# 使用 ZAI
codex -p zai
```

`-p` 是 `--profile` 的简写。这里的 `zai` 是 profile 文件名，对应文件内部的 provider ID `ZAI`；两者是不同的名字。

**这会为本次 CLI 启动选择配置，不会把全局默认值永久改成 ZAI。** 可以把它作为最先尝试的接入方式：先用新会话确认地址、凭据和模型可用，再考虑带着旧历史跨服务继续聊。

旧教程可能把 profile 写成 `config.toml` 中的 `[profiles.zai]`。官方说明，**Codex 0.134.0 起已经改用独立的 `zai.config.toml` 文件**，不再读取旧式 profile 表。不要把不同版本的写法混在一起，参见[官方 Profile 说明](https://learn.chatgpt.com/docs/config-file/config-advanced#profiles)。

## 4. 桌面端：修改默认值，与迁移旧会话分开处理

如果想让桌面端后续新建的本地会话默认使用 ZAI，需要修改用户配置中的顶层选择：

```toml
model_provider = "ZAI"
model = "glm-5.3-flash"
```

切回官方服务时，改回：

```toml
model_provider = "openai"
model = "gpt-6.1-sol"
```

**两次操作都保留 `[model_providers.ZAI]` 定义。** 切换当前默认值，不需要把另一套配置删除或注释掉。修改后重启桌面 App，再检查新建会话实际使用的服务。

本次检查没有确认桌面端存在「为同一个会话选择 OpenAI / ZAI」的原生按钮。模型下拉框也不能直接当作 provider 切换器：同一家服务内选择另一个模型，与换一家服务，是不同操作。CLI 配了两套 profile，也不会自动给桌面端增加两个菜单项。

为了少改文件，我后来在本机加了一个辅助命令：

```powershell
codex-provider zai
codex-provider openai
codex-provider status
```

**`codex-provider` 是自建脚本，不是 Codex 官方命令。没有安装这个脚本的机器不能直接运行。** Windows 上的入口是 `~/.local/bin/codex-provider.cmd`，调用同目录的 `codex-provider.py`；该目录原本已在本机 PATH 中。

它的工作很简单：读取对应 profile，备份 `config.toml`，只修改顶层 `model_provider` 和 `model`。修改前后会解析 TOML，确认其他配置没有发生语义变化，再替换文件。

这个脚本只是把「改默认值」封装成一条命令。它不会迁移旧会话，也不会让正在运行的桌面进程立即换服务。本次只完成了脚本测试，最终默认值仍保留为 OpenAI。

## 5. 已有会话：停止当前轮，再按目标 Provider 恢复

如果要继续同一个会话，CLI 的恢复入口是：

```powershell
codex -p openai resume 会话ID
codex -p zai resume 会话ID
```

但「启动时选中了目标 profile」还不等于迁移完成。需要核对恢复后的实际 provider、模型，并确认下一次请求能被目标服务接受。

这次修复还用到了本机 app-server 的 `thread/resume` 接口，在恢复时显式传入 `modelProvider` 和 `model`。返回结果及保存的会话元数据都确认已切到 OpenAI。这属于本机接口验证结果；接口参数应以所用版本的定义为准。官方文档对[启动、恢复会话与开始一轮对话](https://learn.chatgpt.com/docs/app-server)有分别说明。

操作顺序可以这样记：

1. 等当前回答结束，或先停止当前轮。
2. 确认目标 provider 定义、认证和模型都已准备好。
3. 使用目标配置恢复会话，并核对实际选择结果。
4. 发起下一轮，验证历史回放与目标接口兼容。

这里的切换发生在恢复会话的边界。**本次确认的接口不支持把一条正在生成的回答中途接到另一家 provider 上。**

如果只是想换一家服务继续做事，不要求保留同一个会话 ID，更省事的路径通常是整理任务摘要，在目标 provider 下新建会话：带上目标、已完成事项、关键文件和下一步，让新会话从明确的上下文开始。

## 6. ZAI 示例中，实际踩到的几个坑

### 坑一：旧会话提示 Provider 找不到

**问题描述**：全局默认已切回 OpenAI，打开部分旧会话却报 `Model provider ZAI not found`。

**问题排查**：ZAI 定义被注释了，但还有 **17 个历史会话保存着 `ZAI` 这个 provider ID**。改全局默认值不会自动迁移它们。

**问题解决**：继续用 ZAI，就恢复它的定义和认证；改用 OpenAI，就显式迁移会话。切换默认服务时保留另一套 provider 定义，避免旧会话找不到依赖。

### 坑二：切换后，旧会话的历史消息被拒绝

**问题描述**：迁移到 OpenAI 后，一个旧会话每次继续对话都报：

```text
Invalid 'input[14].content': array too long.
Expected an array with maximum length 0,
but got an array with length 1 instead.
```

**问题排查**：定位到一条旧 ZAI 推理记录：非空的 `reasoning.content` 不被目标接口接受。两家都支持 Responses 协议，也不保证历史项目可以互相回放。

**问题解决**：备份后，仅清空已定位记录中用于回放的 `reasoning.content`，保留会话 ID、用户消息和回答。这是针对该记录的修复，不能批量照搬；格式与完整性检查已通过，实际调用仍待重启后验证。

### 坑三：配置写了，却放错 TOML 层级

**问题描述**：设置了 `model_reasoning_effort`，却没有成为全局默认值；ZAI 表里还多出一份 `notify`。

**问题排查**：这两个字段写在 `[model_providers.ZAI]` 后面，实际属于该表。**空行和注释不会结束 TOML 表的作用域。**

**问题解决**：把全局推理强度放到第一个表标题之前，删除 ZAI 表内多余的 `notify`，保留顶层通知配置。检查时同时确认 TOML 语法、字段层级和应用是否识别该字段。

### 坑四：Profile 校验命令选错了

**问题描述**：用 `codex -p zai features list` 检查配置，命令直接报错。

**问题排查**：当前版本的 `features list` 不支持 `--profile`，不能据此判断 profile 配置有问题。

**问题解决**：改用支持 profile 的 `codex -p zai mcp list --json`，两套配置均通过加载检查。加载成功只证明配置能读取；凭据、模型和历史兼容性，还要分别用新会话、旧会话的实际请求验证。

我现在会先用独立 profile 验证新服务，再按需要修改桌面端默认值或迁移旧会话。记住三层关系就够了：**默认配置决定默认选择，会话保存自己的选择，跨服务继续对话还要检查历史兼容性。**
