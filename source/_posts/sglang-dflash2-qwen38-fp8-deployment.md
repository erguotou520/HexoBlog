---
title: 用 sgLang + DFlash2 在 4 张 RTX 3090 上跑通 Qwen3.8-27B FP8：部署记录与踩坑
s: sglang-dflash2-qwen38-fp8-deployment
date: 2026-09-21 20:00:00
tags:
  - LLM
  - sgLang
  - 推理部署
  - 投机解码
  - Qwen3.8
---

## 背景与目标

手头几台实验室服务器都是消费级显卡（RTX 3090 24G×4 / ×8），之前用 vLLM 部署 Qwen3.8-27B 时体验很一般：BF16 权重 52G，tp=8 摊到每张卡上解码速度也就几十 tok/s，长上下文 prefill 更是慢。目标是**又快又准、上下文尽量大**，并且**不碰机器上已有的任何服务和数据**（共享机器，上面有 gluster、AIGC 服务、一堆 docker 容器）。

这篇文章记录从 0 到上线的完整过程，包括驱动升级、镜像选择、参数调优、DFlash2 投机解码接入，以及后续的 sgLang-router 缓存感知负载均衡。所有内网 IP、主机名等敏感信息均已隐去，用 node1 / node2 代称。

<!-- more -->

## 最终结论一览

| 项 | 结论 |
|---|---|
| 模型 | `Qwen/Qwen3.8-27B-FP8`（官方 FP8 blockwise 量化，权重减半） |
| 运行时 | sgLang **v0.5.19-cu129**（稳定版，DFlash2 已内置） |
| 投机解码 | DFlash2（块扩散草稿，无损，验收长度优于内置 MTP） |
| 并行 | tp=4（4 张卡），权重 ~8G/卡，其余全给 KV |
| 上下文 | 131072（128K），48 并发 |
| 单流速度 | ~170 tok/s（数学推理题实测） |
| TTFT | 思考关 0.08s；20K prefill ~7.5s |
| INT8 对比 | 社区 GPTQ-INT8 **不可用**（Marlin 内核不支持混合 GDN 的窄投影层，直接崩溃） |

## 硬件与约束

- 4× RTX 3090 24G，无 NVLink，纯 PCIe 互联
- 3090 是 Ampere（SM 86），**没有 FP8 硬件单元**，但 sgLang 对 FP8 blockwise 量化自动走 Marlin 内核（SM 80-88 支持），所以 FP8 权重能跑，且解码速度≈BF16（权重带宽受限场景），显存省一半
- 驱动 545.23.06 → **升级 580.126.09**（这是硬前提，详见踩坑 #1）

## 踩坑记录（按时间顺序）

### 1. CUDA 13 镜像墙：sgLang v0.5.20+ 默认 tag 全是 CUDA 13

一开始直接 `docker pull lmsysorg/sglang:latest`，结果容器起不来：

```
nvidia-container-cli: requirement error: unsatisfied condition: cuda>=13.0
```

545 驱动最高支持 CUDA 12.3。试了 `NVIDIA_DISABLE_REQUIRE=1` 跳过容器启动检查，结果运行时 `cudaGetDeviceCount()` 直接报 **Error 803**（驱动/运行时组合不受支持）。**没有绕过方案，只能升级驱动**。

### 2. apt 装 580 驱动元包依赖损坏

`apt-get install nvidia-driver-580` 报 broken packages。解法：无头服务器不需要 GL/X11 那堆依赖，**跳过元包，直接装计算栈**：

```bash
sudo apt-get install -y nvidia-dkms-580 nvidia-kernel-source-580 \
    libnvidia-compute-580 nvidia-utils-580
```

中途报 `/usr/bin/nvidia-powerd` 文件冲突（nvidia-compute-utils-545 残留占用）：

```bash
sudo dpkg --remove --force-depends nvidia-compute-utils-545
sudo dpkg --configure -a && sudo apt-get -f install -y
```

### 3. 驱动热切换被占用进程挡住

装完 580 用户态但旧 545 模块还在内核里，NVML 报版本不匹配。卸载模块需要 GPU 空闲，而机器上有个 supervisord 托管的 AIGC 服务开着 `/dev/nvidia*`。**先停占卡进程 → rmmod → modprobe → 验证 → 拉回**：

```bash
sudo supervisorctl stop aigc-creator
sudo rmmod nvidia_uvm nvidia_drm nvidia_modeset nvidia
sudo modprobe nvidia nvidia_uvm
nvidia-smi   # 确认 580.126.09
sudo supervisorctl start aigc-creator
```

### 4. mem-fraction-static 0.85 会 OOM

权重加载和预热都正常，但一旦有真实请求（尤其长上下文）进来，TP0 只剩 0.13G 激活内存，直接 `torch.OutOfMemoryError` 整组 SIGQUIT。降到 **0.80** 后每卡留 ~4.7G 余量，实测稳定。**0.85 是 sglang 文档默认值，但对 24G 卡+投机解码太激进**。

### 5. INT8 社区版不可用

用户要求对比 INT8。官方没有 INT8；下载了社区 `Chungulus/Qwen3.8-27B-GPTQ-INT8`，结果加载时崩溃循环（容器重启 18 次）：

```
RuntimeError: size_n = 24 is not divisible by tile_n_size = 64
```

根因：Qwen3.8 是混合 GDN 架构（Gated DeltaNet + Attention 交替），GDN 的窄投影层 `in_proj_ba` size_n=24，而 Marlin repack 内核要求 n % 64 == 0。**这套硬件+架构上 FP8 是唯一正解**，INT8 权重已删除。

### 6. 工具调用必须显式配 parser

服务端自动检测日志里提示了 `tool_call_parser=qwen3_coder`，但**默认仍是 None**。不配的话模型输出的 `<tool_call>` 标签原样吐在 content 里，`tool_calls` 恒为 null。启动参数加上：

```bash
--reasoning-parser qwen3 --tool-call-parser qwen3_coder
```

## 部署步骤（可复现）

### 模型权重下载

ModelScope 比 hf-mirror 快 3 倍以上（43 vs 13 MB/s），国内首选。多文件并行 curl（-P6）+ 断点续传，逐文件比对 API 返回的 Size 校验完整性：

- `Qwen/Qwen3.8-27B-FP8` → 30.9 GB（81 文件，含 mtp.safetensors）
- `incoai/Qwen3.8-27B-DFlash2` → 3.8 GB

### 镜像

```bash
docker pull docker.m.daocloud.io/lmsysorg/sglang:v0.5.19-cu129
```

> ⚠️ 不要追 latest / v0.5.20+：从 v0.5.20 起默认 tag 基底全是 CUDA 13。cu129 是 CUDA 12.9，对 580 驱动完全够。

### 启动脚本

```bash
docker run -d --name qwen38-fp8-sglang \
  --gpus all --cap-add SYS_NICE --restart unless-stopped --ipc host --shm-size 32g \
  -p 30000:30000 \
  -v /data/models:/models:ro \
  --entrypoint python3 \
  docker.m.daocloud.io/lmsysorg/sglang:v0.5.19-cu129 \
  -m sglang.launch_server \
    --model-path /models/Qwen3.8-27B-FP8 \
    --speculative-algorithm DFLASH \
    --speculative-draft-model-path /models/Qwen3.8-27B-DFlash2 \
    --speculative-num-draft-tokens 8 \
    --tp-size 4 \
    --context-length 131072 \
    --mem-fraction-static 0.80 \
    --chunked-prefill-size 2048 \
    --mamba-full-memory-ratio 0.75 \
    --reasoning-parser qwen3 \
    --tool-call-parser qwen3_coder \
    --served-model-name qwen3.8-27b \
    --host 0.0.0.0 --port 30000
```

**参数要点**：

| 参数 | 值 | 原因 |
|---|---|---|
| `--mem-fraction-static` | **0.80** | 0.85 实测 OOM 崩溃 |
| `--speculative-num-draft-tokens` | 8 | 与 DFlash2 block_size=8 对齐 |
| `--mamba-full-memory-ratio` | 0.75 | 混合 GDN 状态池占比，默认 0.9 会挤占 KV |
| `--chunked-prefill-size` | 2048 | 与 prefill CUDA graph 上限匹配 |
| `--reasoning-parser qwen3` | 必需 | 否则思考过程混在 content 里 |
| `--tool-call-parser qwen3_coder` | FC 必需 | 不配则 tool_call 原样输出 |

### 实测性能

| 场景 | 结果 |
|---|---|
| 单流生成（2048 tok） | 171 tok/s |
| 4 路并发 ×400 tok | 总耗时 2.4s，每路 36-43 tok/s |
| 47.5K 长上下文大海捞针 | 37s prefill，答案准确 |
| 视觉理解 | 4.9s / 357 tok，位置颜色形状描述准确 |
| TTFT（思考关） | 0.08s |
| DFlash2 验收长度 | 2.0-2.6（中文短答场景） |

### 为什么 FP8 而不是 BF16（推演）

BF16 权重 56G ÷ 4 卡 = 13.5G/卡，加上 KV+Mamba+激活 ≈ 24-25G，**放不下 24G**。即使硬塞（降 mem-fraction 砍上下文），权重读取时间翻倍，单流会从 170 掉到 ~85-105 tok/s，而 FP8 block-128 细粒度量化质量"nearly identical"——纯亏。要 BF16 拉开差距得换 4090（原生 FP8 + 1TB/s 带宽）或 Hopper。

## 第二台机器 & 双实例

另一台 8×3090 机器（node2）上原本是 vLLM BF16 tp=8，占满 8 卡但速度也只有几十 tok/s。替换成同款方案后，**单实例只用 4 卡就到 173 tok/s**，剩 4 张卡起了第二个实例（端口 30001），两实例共享同一份只读权重（磁盘零额外占用）、各自独立 KV 池（各 48 并发）、互不影响。8 卡全用上，总容量 96 并发。

旧服务是 systemd 服务（unit 文件保留未删），回滚一条命令即可。

## 后续：sgLang-router 缓存感知负载均衡

### 问题

双实例朴素轮询有个致命问题：**prefix cache 各自独立**，同一会话的请求随机落到不同实例上，前几轮辛苦 prefill 的长上下文缓存完全白费。20K 提示未命中 prefill ~7.5s，命中只要 ~0.2s，差 30 倍。

### 方案：sgl-router cache_aware

sgl-router 是个独立路由进程，自己不跑模型，只做"记账 + 分发"：

1. 解析请求的前缀（messages 的文本/token）
2. 查它维护的"前缀树账本"：每台实例各自持有哪些前缀
3. 找到持有最长匹配前缀的实例 → 转发（KV 已在卡上，prefill 几乎免费）
4. 没有足够长的匹配 → 按负载挑一台；负载接近时保持亲和，一台明显更闲（请求数差 > 阈值）时发给闲的
5. 转发时把这次请求记进该实例的账本

关键点：**账本是近似的**——它只知道"router 发出去过什么"，不知道 sgLang 内部 KV 池满了之后的 LRU 驱逐。偶尔"账本说有、实际被逐了"，那一次重新 prefill，下一轮账本自然修正，不影响正确性只影响那一次延迟。

### 部署

```bash
docker run -d --name sgl-router --network host --restart unless-stopped \
  docker.m.daocloud.io/lmsysorg/sglang-router:v0.2.4 \
  --worker-urls http://127.0.0.1:30000 http://127.0.0.1:30001 \
  --host 0.0.0.0 --port 30002 --policy cache_aware
```

> 注意 `--network host`：必须让 router 容器内能访问到宿主机的 worker 端口。另外 `latest` tag 不存在，Hub 上只有版本号 tag。

### 实测验证

设计了一个可归因的测试：6 个不同长度（118-123 行）的唯一长前缀，各发 2 次。每个前缀的 token 数唯一，可以直接从两台实例的 prefill 日志归因：

| 请求 | 路由结果 | prefill 表现 |
|---|---|---|
| R1：长前缀 P1 首次 | 实例2 | prefill 836 tok（正常计算） |
| R2：同前缀 P1 重复 | **粘住实例2** | `#cached-token: 2880, #new-token: 4`——几乎零重复 prefill |
| R3：不同前缀 P2 | 按负载分到实例1 | 正常 prefill |

也就是说多轮会话、共享 system prompt、RAG 固定文档这类场景，第二次起 prefill 基本免费。

### 三机池

把第一台 4 卡机器（node1）的实例也挂进 router 池（统一入口 30002）。跨机机制和本机完全一致——router 的 worker 列表就是普通 URL，跨机器只是把 `127.0.0.1` 换成对方 IP。实测 18 路并发唯一前缀时三台全部分到活（117 接了多个全量 prefill），重复请求各自粘回原实例命中缓存。

两个注意点：

1. **router 是单点**：跑在 node2 上，node2 宕则统一入口断（直连 worker 端口仍可用）。要高可用就在另一台机器再起一个同配置 router 做备份入口。
2. **模型一致性是前提**：池里所有 worker 必须跑同一个模型同一套 tokenizer；混入其它模型要另建 router 池。

## 总结

- **FP8 权重 + Marlin 内核 + DFlash2 投机解码**是 RTX 3090 上 Qwen3.8-27B 的最优解：4 卡单流 170 tok/s，比 vLLM BF16 tp=8 快 3-4 倍
- 上下文 128K 够用且稳（权重减半后每卡剩 ~13G 给 KV+Mamba），`mem-fraction 0.80` 是 24G 卡的安全线
- 驱动 545→580 是硬前提，热切换可行但要先停占卡进程
- **cache_aware router** 解决了多实例 prefix cache 碎片化问题，实测命中效果符合预期，跨机组池也是加一行 worker URL 的事

相关代码和脚本已整理在各服务器的 `/data*/models/` 下（README-ops.md 里有完整运维手册）。
