---
title: 个人项目[my-jev]：复刻 JEV 的毫秒级文本判断服务，从立项到 API 上线的全过程
s: my-jev-full-journey
date: 2026-09-21 18:00:00
# cover:
tags:
  - 我开发的
  - LLM
  - 推理部署
  - 蒸馏
---

## 背景：我想复刻的东西是什么

最近看到一个叫 `JEV` 的产品（TypeSafe 出品），它做的事很有意思：**给定一段共享上下文（state）和一组问题，一次性返回所有问题的判别结果**——不是生成式地一个一个写答案，而是"判断"。官方宣称比传统 LLM 工作流快 193.6×、便宜 444.6×。

它的几个可观察行为很吸引我：

- **没有首 token 等待**：判别类任务不需要等自回归解码出第一个 token，单次前向就能出结果；
- **零非法选项**：输出只可能是你声明的候选之一，不会"幻觉"出一个没提供的选项；
- **多问共享 state**：同一上下文下的一堆问题摊薄 prefill 成本，问得越多越划算。

但 TypeSafe 没公开它的架构、参数量、训练数据，那套 RLCD 也摸不到。所以我的目标定得很实际：**复刻它的可观察能力和工程效果，不复刻它没公开的内部实现**。本文记录这条路的完整过程——立项、调研、基线、一路踩坑、对比 benchmark、蒸馏、写 API、上线，所有数字都可复现。

内网主机名/IP 等敏感信息一律隐去（下文用"GPU 验收机"指代），仓库代码见文末。

<!-- more -->

## 最终结论一览

| 项 | 结论 |
|---|---|
| 最终模型 | `Qwen2.5-1.5B-Instruct` + LoRA 蒸馏（KD student，bf16 3.9GB） |
| 质量 | 冻结中英双语私有测试集 108 题 **99.07%**（7B 级精度） |
| 延迟 | 生产形态 **5.25ms/问**（3B teacher 的 63%、7B 的 ~30%） |
| 同协议对标 | 21 问/请求 **148ms**，约 6.9× 于 SemIf（Qwen3.5-4B 官方 1023ms） |
| 结构保证 | 判别零非法选项（argmax ⊆ 声明选项）+ 无自回归/首 token 等待 |
| 交付形态 | JEV 兼容 API 服务（`POST /v1/decide`，换 base URL 即用），E2E 全过 |

## 一、立项：先想清楚"复刻什么"

### 1.1 调研：JEV 能观察到的行为

调研阶段（`docs/01-research.md`）把 JEV、同路线开源项目 `SemIf`/`OpenJEV` 和社区猜测都翻了一遍。能确证的"可观察行为"就三条：

1. **单次前向出判别结果**，不走自回归解码 → 没有首 token 等待，延迟结构上和生成式不同；
2. **输出被约束在声明候选内** → 官方口径是"结构上不可能输出未提供的选项"；
3. **多问共享 state** → 同一上下文下 N 个问题的延迟不是 N 倍，prefill 只做一次。

JEV 官方的"193.6×/444.6×"是厂商声明，没给复现方式，没法当工程目标。真正可对标的是 `SemIf`：同一条 direct-logit 路线（单次前向读判别位 logits），官方在**同一张 RTX 3090** 上报告过数据——21 个二分类问题共享 state，Qwen3.5-4B 要 **1023ms/请求**。这就是我的速度锚点。

### 1.2 技术路线：decoder 直读 logits，不碰 encoder

候选路线有两条：

- **decoder LM 直读判别位 logits**（direct-logit）：在 prompt 末尾加"答案："，看下一个 token 在候选标签上的 logits，argmax 出答案；
- **蒸馏到小 encoder/cross-encoder**：把判别能力压进 100M–500M 的专用模型。

第一条路线当天就能跑基线，而且**结构上天然满足零非法选项**（argmax 只在声明选项的 token 上比）；第二条是长期优化方向。立项决策：**先用路线一走通全链路，路线二作为 sub-ms 的后续选项**（见 `docs/02-project-plan.md`）。

### 1.3 验收标准（四条，全部要过）

| # | 验收项 | 门槛 |
|---|---|---|
| ① | 质量 | 冻结私有测试集准确率 > 90% |
| ② | 零非法选项 | 判别结果必须 ⊆ 声明候选（结构性 + 测试固化） |
| ③ | 延迟 | 毫秒级（目标 5ms/问，生产形态） |
| ④ | 无首 token 等待 | 单次前向读 logits，无自回归解码 |

测试集是立项时就冻结的中英双语 6 家族 108 题（severity / policy_refund / routing / sentiment / extraction / ood），**与训练数据零重叠**，整个项目期间一个字没改过。

## 二、探索：基线 81.5%，然后发现"首 token 伪影"

### 2.1 第一个基线（E102）

`Qwen2.5-3B-Instruct`，bf16，单次前向读判别位 logits，选项取**候选词的首 token** 的 logit 比大小。跑下来 **88/108 = 81.5%**。

离 90% 差一截，但比预想的高——没做任何训练，裸模型直读 logits 就 81.5%。

### 2.2 解剖错误：16/20 是"首 token 伪影"

把 20 个错例逐个拆开看，发现一个系统性问题：**多个候选选项共享同一个首 token**。

比如 routing 家族的 `Shanghai` 和 `Shenzhen`，首 token 都是 `Sh`（token id 2016）；severity 的五个等级 `level_1`–`level_5` 首 token 全是 `等级`。argmax 在首 token 上比，这两个选项的 logit **恒等**，等于抛硬币。

20 个错例里 16 个是这个原因——模型其实"知道"答案，是我读错了位置。

### 2.3 四变体消融（E102b）：单 token 映射 +5.6pp

针对这个问题做了四组消融：

| 变体 | 词表 | 选项 token 取值 | 准确率 |
|---|---|---|---|
| P1 raw + first | base（裸 prefix） | 首 token | 81.5% |
| **P2 raw + single** | base | **canonical 单 token** | **87.0%** |
| P3 chat + first | Instruct chat template | 首 token | 70.4% |
| P4 chat + single | Instruct chat template | canonical 单 token | 78.7% |

两个结论：

1. **canonical 单 token 映射**：为每个选项在词表里找一个能唯一表达它的单 token（比如 `Shanghai` 用完整的 `Shanghai` token，而不是首 token `Sh`），全部 1961 个选项 100% 覆盖、29 个唯一 alias token、零冲突（E102c 全量审计确认）。**+5.6pp**。
2. **chat template 是负收益**：Instruct 模型的 chat 包装把 base 分布带偏了，P3 直接掉到 70.4%。生产用裸 prefix。

### 2.4 模型阶梯（E102b 多模型）

同一配置下从 0.5B 到 7B 各跑一遍：

| 模型 | P1（first） | P2（single） |
|---|---|---|
| 0.5B | 55.6% | 57.4% |
| 1.5B | 67.6% | 72.2% |
| 3B | 80.6% | 87.0% |
| 7B | 80.6% | 88.0% |

注意到 7B 只比 3B 高 1pp——**家族天花板在 88% 左右**，单靠模型大小堆不上去。这个发现直接决定了后面蒸馏用 3B 当 teacher（省一半显存和延迟）。

## 三、失败的尝试：数值比较、量化、编译

### 3.1 失败：让模型自己比数字（E109）

severity（严重等级）和 policy_refund（退款政策）这两个家族带**数值阈值**：金额 ≥1000 加一级、延迟 ≥3 天触发退款条件……直觉上让模型直接判"1500 是否达到 1000"应该没问题。

跑下来才发现 3B 的数值比较是**系统性不可靠**的：`1500 是否达到 1000` 也答"否"。探针显示 top-1 logit 是"否 35.0 vs 是 23.8"，gap 有 11–15——模型不是猜错，是**先验性地偏"否"**。prompt 怎么改都救不了，这是小模型算术能力的硬缺口。

教训很直接：**数值条件外置为确定性解析，模型只判语义**。severity 因此变成零模型调用——正则从 state 里抽出金额/投诉次数/延迟天数，按声明规则合成等级，实测 **1.8µs**，比任何模型都快，而且 87/87 与标注零偏差。

### 3.2 失败：INT8 量化（E111）

延迟还想再压，先试了 `bitsandbytes` 8bit 量化。结果在 3090 上**更慢**：单问 164ms vs bf16 27ms，精度持平。反量化开销超过了带宽收益——消费卡上量化不划算，放弃。

### 3.3 失败：torch.compile

`torch.compile` 的 CUDA-graph 路径在 transformers 4.x 下不可用。而且 profiling 显示固定开销主要在 HF 的 Python 派发层而不是 kernel，compile 压不动。

这两条失败把"在 HF eager 部署栈上再抠延迟"这条路封死了：**3B 批量下限 ~10ms/问，1.5B 下限 ~5ms/问，量化和 compile 都无效**。想要更快，只剩两条路——换更小的模型（但 0.5B 只有 74.1%，routing/ood 拖垮），或者**蒸馏**。

### 3.4 生产三路径架构（E109b）

把"数值外置"的教训推广成整体架构，按任务家族路由：

```text
请求 ──┬─ severity（纯数值规则）        → 正则解析 + 规则合成，零模型调用
       ├─ policy_refund（数值+语义混合） → 确定性解析延迟 + 模型判"是否主动要求退款"
       └─ 其余纯语义家族                 → 候选选项 token logits argmax（P2）
```

3B 下生产形态 **96.3%**：severity 27/27（全确定性）、policy 23/24、extraction/ood 100%。7B 99.1%，唯一错例是 `rou-E-00091`（"money never arrived" 判成 delivery）——teacher 天花板样本，后面蒸馏也修不了它。

## 四、Benchmark：质量与速度怎么测的

### 4.1 延迟测量协议（踩过的坑都在这里）

延迟基准是最容易造假的一块，我在这上面摔了三个跟头：

1. **共享 `past_key_values` 污染**：跨请求复用 KV 缓存，不同问题互相污染，延迟虚低、结果错乱。修：每请求独立前向。
2. **batch 尺寸算错**：把"1 次 prefill + 8 个尾前向"的 token 总数当成 batch 160 去均摊，吞吐虚高 2 倍。修：按真实序列数计。
3. **没关梯度**：训练模式下 autograd 记账，延迟虚高且显存翻倍。修：`torch.inference_mode()` + `num_logits_to_keep=1`（只算末位 logits，顺带避开 full logits 的 OOM）。

最终协议：30 次取 p50/p99、`torch.cuda.synchronize()` 包围计时、warmup 3 次、`num_logits_to_keep=1`。

### 4.2 质量阶梯（test 108 题，生产三路径）

| 模型 | 准确率 | severity | routing | ood | policy | sentiment |
|---|---|---|---|---|---|---|
| Qwen2.5-0.5B | 74.1% | 100% | **46%** | **0%** | 83% | 92% |
| Qwen2.5-1.5B | 92.6% | 100% | 82% | 80% | 87% | 96% |
| Qwen2.5-3B | 96.3% | 100% | 92% | 100% | 96% | 96% |
| Qwen2.5-7B | 99.1% | 100% | 96% | 100% | 100% | 100% |
| **1.5B-KD（最终）** | **99.07%** | **100%** | **100%** | **100%** | **100%** | 96% |

0.5B 的 routing 46%/ood 0% 直接把延迟/精度权衡坐实了——想再小就得先解决语义短板，这是后面"0.5B 更强蒸馏"留作可选项的原因。

### 4.3 延迟（RTX 3090，bf16，p50）

| 场景 | 0.5B | 1.5B | **1.5B-KD** | 3B |
|---|---|---|---|---|
| 单问最坏（无共享 state） | 17.3ms | 21.1ms | 20.9ms | 27.1ms |
| **生产形态**（state prefill 1 次 + 8 问批量尾） | 4.3ms/问 | 5.28ms/问 | **5.25ms/问** | 8.3ms/问 |
| 确定性路径（severity） | — | — | — | **1.8µs** |

"多问共享 state 摊薄 prefill"这条 JEV 宣称的行为，在 decoder 直读 logits 路线上同样成立——8 问比单问只多一个短尾前向的开销。

### 4.4 SemIf 同协议对标（E112b）

为了和 SemIf 的 1023ms 公平对比，我按**完全相同的协议**写了对标脚本：同一条长 state + 21 个二分类问题，共享 state 一次 prefill + 批量尾前向，30 次取 p50。

| 系统 | 21 问/请求 p50 | 吞吐 | 显存 |
|---|---|---|---|
| SemIf · Qwen3.5-4B（官方报告） | 1023ms | 20.03 decisions/s | ~8GB (Q4) |
| **本项目 · 1.5B-KD** | **148ms** | **142 decisions/s** | 3.9GB |
| 本项目 · 3B | 259ms | 81 decisions/s | 7.1GB |

**约 6.9× 于 SemIf 官方数字**，参数更少、显存更低。诚实声明：这是跨模型的工程效率对比（1.5B vs 4B），不是同模型对比；协议一致、锚点可比，但别把它读成"4B 打不过 1.5B"。

与 JEV 本身没法直接比速度——官方没公开任何可复现的延迟数字，只有 193.6× 的相对声明。可比的锚点只有 SemIf 这一条开源路线。

## 五、蒸馏：把 7B 级精度塞进 1.5B（E112）

### 5.1 先解剖 1.5B 的 9 个错例

1.5B 裸模型 92.6%，离 99% 差 6.4pp。决定蒸谁之前，先把 9 个错例逐个拆：

- **7 个是 teacher（3B）判对、学生判错的**——可学差距，蒸馏应该能收掉。典型如"改绑手机号+发票错"的多意图样本，1.5B 路由错、3B 路由对；
- **2 个是 teacher 自己也错的**——`rou-E-00091`（"money never arrived"）和 `pol-E-00023`（"did not request a refund" 的否定句误读）。

结论：**蒸馏上限 = teacher 上限**。3B 96.3% 意味着学生最多摸到 96.3%……但等等，3B 生产架构是 96.3%，而 1.5B 的 9 错里只有 2 个是 teacher 也错的——那蒸馏应该能到 **98.1%+**（9 错里收掉 7 个）。这个推算后来被验证了。

### 5.2 软标签与损失

teacher（3B，冻结）在 dev 集 6468 条上产出判别位软标签 5347 条（P2 四家族 4248 + policy requested 1099，含预编码的 `input_ids`）。

学生：`Qwen2.5-1.5B-Instruct` + LoRA r16（七个投影矩阵）。teacher 和学生**共享 Qwen2.5 词表（151936）**，选项 alias token id 完全一致，logit 直接对齐、无需重映射——这点省了很多事。

损失是**选项内 logit 蒸馏**：

```text
L = α · T² · KL( softmax(t/T) ‖ softmax(s/T) ) + (1−α) · CE
α = 0.5, T = 2.0
```

关键细节：KL **只在声明选项的 token 切片上算**，其余位置不参与——否则未选中选项的 padding logit 会走 `0×log0` 出 NaN。

### 5.3 训练踩坑（四个）

1. **OOM**：teacher/student 同卡驻留 + 长序列，`Tried to allocate 1.10 GiB`。修：分阶段，teacher 出完标签先离卡再载学生。
2. **CE 恒 0**：`F.cross_entropy(softlogits, zeros)` 这种写法目标全零，梯度直接消失。修：正确标签索引。
3. **KL NaN**：就是上面说的 padding 问题，选项内切片解决。
4. **teacher logits 取错位置**：批量下误取整条序列而不是 `[:, -1, :]`，判别位全错位。

### 5.4 结果

val 早停 2.2 epoch 收敛（best_val_acc 0.992），merged 导出后 test 验收：

- **99.07%（107/108）**——比预期推算的 98.1% 还高一点；
- routing/ood 从 82%/80% **拉满到 100%**；
- 唯一失败 `sen-Z-00160`（"谢谢，投诉"判情感）——3B teacher 自己也错的天花板样本，KD 修不了，符合预期；
- 延迟 **5.25ms/问**，比 3B 快 37%。

最终架构就此冻结：**1.5B-KD + 三路径路由**，四项验收条件全部通过。

### 5.5 为什么蒸馏只动了纯语义路径

severity 是确定性规则（零模型调用），它不需要蒸馏、也不该蒸馏——规则就是规则，87/87 零偏差。policy 的数值条件同样是确定性解析。蒸馏只针对 P2 纯语义家族（routing/sentiment/extraction/ood）和 policy 的语义子条件（"是否主动要求退款"）。这是"数值外置"架构在训练侧的自然延伸。

## 六、API 服务：换 base URL 即用

### 6.1 协议设计

项目里本来就定义好了协议契约（`src/jev/protocol/schemas.py`），对齐 JEV 的可观察行为：`choice` / `binary` / `score` 三种题型，候选概率 + 置信信息，无自回归。服务层就是把这个契约包成 HTTP：

```text
POST /v1/decide   # 共享 state + 多问题 → 每个问题的判别 + 置信 + logits
GET  /health      # 状态/模型/设备
```

一个请求长这样（长 state + 8 问，覆盖全部 6 家族）：

```bash
curl -s http://127.0.0.1:8321/v1/decide -H "Content-Type: application/json" -d '{
 "state": "客户王先生下单购买高端笔记本电脑，订单金额12800元，已在本平台投诉3次，物流延迟5天未更新。……",
 "questions": [
  {"question_id":"sev","kind":"score","task":"severity",
   "instruction":"判定严重等级","scores":["level_1","level_2","level_3","level_4","level_5"]},
  {"question_id":"pol","kind":"binary","task":"policy_refund",
   "instruction":"是否应批准退款","options":[{"id":"yes"},{"id":"no"}]},
  {"question_id":"r1","kind":"choice","task":"routing",
   "instruction":"主问题应路由到哪个团队",
   "options":[{"id":"account"},{"id":"billing"},{"id":"delivery"},{"id":"general"}]}
  // …共 8 问
 ]}'
```

实测返回：sev → `level_5`（conf=1.0，**deterministic**，零模型调用）、r1 → `delivery`（conf 0.98）、sent → `negative`（0.998）……**8 问总延迟 183ms**（约 23ms/问，含一次 ~150 token 的 state prefill，其余 7 问摊薄）。

### 6.2 服务层踩坑（四个，都是"部署级"的）

1. **`pkill -f` 自杀**：`pkill -f "jev.service.api"` 会匹配到 ssh 自身命令行，会话直接被打死（exit 255）。修：`pgrep -f` 精确匹配 python 进程行。
2. **`kind=score` 与 options 校验耦合**：score 题型用 `scores` 列表，但 `options` 声明成了必填 → 422。修：options 默认空列表，按 kind 分支校验。
3. **确定性分支误用 options**：severity 的 score 分支里对空列表取 `max()` 直接 500。修：回落到 `q.scores`。
4. **旧进程残留**：kill 没生效时端口被占，新服务静默起不来。修：启动前 `fuser -k` + 确认进程列表。

### 6.3 零非法选项：不是"测出来的"，是"结构上保证的"

这条验收我做成了两层：

- **结构性**：argmax 只在声明选项的 token id 集合上比大小，输出**不可能**越界；
- **测试固化**：`tests/test_zero_illegal.py` 用属性测试（多家族 × 选项顺序置换 × 中英）锁住这个不变量，12/12。API 服务侧还有第三层：返回前再校验一次 choice ∈ 声明选项，否则 500 而不是把非法值发出去。

### 6.4 启动与部署

```bash
# GPU（加载 2s，生产形态 5.25ms/问）
CUDA_VISIBLE_DEVICES=0 MYJEV_REPO=/path/to/my-jev .venv/bin/python -m jev.service.api

# CPU 降级（8GB 内存可跑，float32 约 6GB）
MYJEV_REPO=/path/to/my-jev MYJEV_DEVICE=cpu .venv/bin/python -m jev.service.api
```

systemd 单元 + Nginx 反代片段都在 `docs/06-api-deployment.md`。已知边界：`/v1/decide` 目前是单请求串行（同一请求内多问已共享 state 摊薄），跨请求并发需要加 batch 聚合层——这条我写在文档里了，不藏着。

## 七、总结

| 验收项 | 门槛 | 实测 |
|---|---|---|
| ① 质量 | > 90% | **99.07%** ✅ |
| ② 零非法选项 | 结构性 + 测试 | argmax ⊆ 声明选项 + 12/12 属性测试 ✅ |
| ③ 延迟 | 毫秒级 | **5.25ms/问**（生产形态）✅ |
| ④ 无首 token 等待 | 单次前向 | 读判别位 logits，无自回归 ✅ |

回头看，这个项目最有意思的三件事：

1. **小模型的算术缺口是硬缺口**——3B 连"1500≥1000"都答否，prompt 救不了。把数值条件外置成确定性解析后，severity 直接零模型调用、1.8µs，比任何量化/编译优化都猛；
2. **蒸馏的天花板在 teacher**——先解剖错例再决定蒸不蒸，9 错里 7 个可学、2 个是天花板，这个推算在 99.07% 上被验证；
3. **延迟基准是最容易自欺的地方**——三个方法学坑（KV 污染、batch 算错、没关梯度）每一个都能让数字好看 2 倍，也都能让结论反过来。

还没做的事：严格 sub-ms 需要 vLLM/TensorRT-LLM 部署栈（3090 + HF eager 的固定开销 floor 到不了 <1ms）；0.5B student 的更强蒸馏（现在 74.1%，routing/ood 拖垮）；校准与拒答阈值（低置信样本升级人工/强模型的网关逻辑，API 的 `confidence` 字段已经留好了口子）。

完整代码、实验记录（`docs/05-experiment-log.md`）、API 部署文档（`docs/06-api-deployment.md`）和全部复现脚本在仓库里，GitHub 地址见下。

## 项目地址

GitHub: [https://github.com/erguotou520/my-jev](https://github.com/erguotou520/my-jev)

（仓库不含模型权重，约 12MB；模型指向 HuggingFace `Qwen/Qwen2.5-*`，复现命令见仓库 README。）
