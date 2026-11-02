---
title: JEV-27B-VL 决策服务全记录：零训练部署 + 7800 题完整评测（45.8 → 97.9）
s: jev-27b-vl-deployment
date: 2026-10-28 16:40:00
# cover:
tags:
  - 我开发的
  - LLM
  - sgLang
  - 推理部署
  - LoRA
---

上一篇 [《个人项目[my-jev]》](./my-jev-full-journey) 里，我用 1.5B 小模型做了一个只能看文本的决策服务。这次把基座换成 27B 大模型：不光能看文本，还能看图，复杂判断的能力强了很多——而且模型一次都没训练，直接给现成模型挂上一个现成的"决策插件"就部署成了服务。评测做了三件事：7800 道官方题、500 多道自出题，再和开源竞品 StartLux 在同一台机器上正面打了一架。

结果一句话先放这儿：不开"思考"，JEV 45.8 分，输 StartLux 的 50.6；开了"思考"，97.9 分，领先 47 分。而在一套双方都没见过的私有题上，两家基本打平。

<!-- more -->

## 最终结论一览

| 项目 | 结论 |
|---|---|
| 这是什么服务 | 发一道题（能不能 / 选哪个 / 打几分），几秒内返回答案 + 置信度；还能看图 |
| 怎么搭的 | 27B 基座 + 483MB 现成"决策插件"，**零训练、不改权重** |
| 部署 | 4 张 RTX 3090，一个容器一条命令启动；一个端口同时提供决策接口和标准 chat 接口 |
| 7800 题官方基准 | 不思考 45.8 → 开思考 **97.9**（+52.1），13 个题类全部提升、无一倒退 |
| 对比 StartLux（同机同题） | 快模式：对方准一点、我们快 3 倍；慢模式：官方题 97.9 vs 50.6，私有题基本打平 |
| 踩的最大坑 | 一行代码写错，模型"看不见图"但接口全程零报错，一行修好 |
| 怎么用 | 批量任务开思考（97.9 分）；实时场景关思考（约 1.2 秒/题）；"自动"开关暂时别用 |

## 一、这是个什么服务

给服务一段背景（工单、日志、政策文本……）加一个问题，它返回三种答案之一：**是/否**、**选哪一个**、**打几分（0–5）**，每个答案都带一个置信度。普通题大约 1 秒出结果，而且模型能直接看图。

上一篇的 1.5B 小模型做不了复杂判断，也看不了图；这次换 27B，能力就到位了。关键在于**模型一次都没训练**：开源社区已经训好了一份 483MB 的"决策插件"（技术名 `LoRA`，可以理解成一个小的权重补丁），往模型上一挂，它就学会了按约定格式做判断；摘掉插件，模型原样还原，基座权重一个 bit 都没动。

服务内部有两条路：

| | 快路径 | 慢路径 |
|---|---|---|
| 做法 | 直接读模型对每个候选答案的概率，不逐字生成 | 先让模型想一段（几千字），再读答案 |
| 速度 | 约 0.2 秒 | 约 1–1.5 秒起 |
| 用途 | 大多数简单题 | 难题、需要仔细看图判断的题 |

接口上写 `thinking: "on"` 走慢路径，`"off"` 走快路径，`"auto"` 是"没把握才深思"（这个模式的问题后面会讲）。

## 二、部署：踩了一个"看不见图"的坑

部署本身很顺：4 张 RTX 3090 共载一个模型，一个容器一条命令启动，启动后 11 项自检 + 9 条外部测试全部通过，快路径单题 0.17 秒，标准 chat 接口（支持流式和图像）也正常。

真正的坑在视觉。给服务传一张图问"图里方块是什么颜色"，**接口全程 200 正常返回，概率分布正常、时延正常——但答案跟图片内容毫无关系**，等于模型蒙着眼在回答。这种静默失败最危险，所有监控都是绿的。

排查下来根因很具体：大模型"看图"依赖提示词里的一个特殊占位符——图片要先被展开成几百个"视觉格子"再进模型。网关代码把这个占位符写错了，图片从来没进过模型，模型收到的其实是一个纯文本请求。修复只改了一行代码，重启后立刻验证通过（"方块是红色吗" → 99.99998% 是）。

经验：**任何带图的部署都该加一条冒烟测试——带图请求的输入长度必须比不带图明显变长**，否则模型就是盲的。

## 三、怎么测的

两套题：

1. **7800 道官方基准题**（DecisionPivot v1.1）：13 个题类 × 600 题，是数日志行数、判政策合规、排日程冲突、对账这类真实业务判断，官方打分器合成 0–100 的总分。注意这是公开题集，各家模型的训练数据里都可能包含它；
2. **506 道自出题**：249 道是/否 + 170 道选择 + 87 道打分，**两边都没见过**，用来测真实水平。

对手是 `StartLux-Decision-v1.1-27B-AutoThink`：同样是 27B 的决策模型，也带思考开关。24G 显存一次只装得下一个 27B，所以两边在同一台 4×3090 上**顺序切换**跑，同题、同提示词、同 16 并发——能做到的最公平的同机对比。

口径差异先说清：JEV 是 FP8 量化，StartLux 是 Q8_0 量化；StartLux 读答案时带一点随机采样（单次有 ±1 分噪声），JEV 是确定性读取、没有随机性。

## 四、网关代码

给出我使用的网关的代码，可供参考

```python
#!/usr/bin/env python3
"""JEV front door on top of sglang.

Same host port serves both systems (per JEV deployment goal):
  POST /v1/decide            System 1 (LoRA "jev-decision" + decision head) with adaptive System 2 thinking
  * (everything else)        transparent proxy to sglang (System 2 native: /v1/chat/completions, /generate, ...)

Read-out path: sglang /generate with token_ids_logprob (exact token logprobs at the first
output position). Fallback: top_logprobs_num=300 if token_ids_logprob comes back empty
(e.g. speculative-decoding path limitations).
"""
import json
import math
import os
import string
import time
import zlib
from typing import Literal, Optional, Union

import httpx
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, Response, StreamingResponse
from pydantic import BaseModel

NL = chr(10)  # newline, to keep string literals escape-free

UPSTREAM = os.environ.get("UPSTREAM", "http://127.0.0.1:30100")
LORA = os.environ.get("JEV_DECIDE_LORA", "jev-decision")
MODEL_DIR = os.environ.get("MODEL_DIR", "/models/Qwen3.8-27B-FP8")
ADAPTER_DIR = os.environ.get("ADAPTER_DIR", "/models/JEV-27B-VL-adapter/adapter_vllm")
PROTOCOL = "jev27-bare-v1"
PLACEHOLDER = "XQXCONTENTXQX"
MAX_OPTIONS = 256
FALLBACK_TOPK = 300
S2_DEFAULT_BUDGET = 32768

_TH = chr(60) + "think" + chr(62)
T_END = chr(60) + "/think" + chr(62)
THINK_OPEN = chr(10) + _TH
THINK_CLOSE = chr(10) + T_END

# 图像占位：chat template 把每个 image 部件渲染成这个 3-token 字面量序列
# （vision_start + image_pad + vision_end；sglang 服务端会把单个 image_pad
#   按网格自动展开成全部像素 token，所以文本里只需出现一次）。
# 字面量拆开拼接，避免被传输层当作特殊标记。
IMG_TOKEN = "<|" + "vision_start" + "|>" + "<|" + "image_pad" + "|>" + "<|" + "vision_end" + "|>"

PROF = {
    "prefix": "",
    # chat template renders each image part as IMG_TOKEN below
    # (add_vision_id defaults false; the "Picture N:" label is not emitted)
    "image": IMG_TOKEN, "end_think": THINK_CLOSE,
    "after_think": NL + NL, "strategy": "single", "threshold": 0.8, "mix": 0.5, "thinking": "off",
}
for k in ("strategy", "threshold", "mix", "thinking"):
    env = os.environ.get("JEV_DECIDE_" + k.upper())
    if env:
        PROF[k] = env if k in ("strategy", "thinking") else float(env)

head = json.load(open(os.path.join(ADAPTER_DIR, "decision_head.json")))
_calib = os.environ.get("JEV_DECIDE_CALIBRATION") or os.path.join(
    os.path.dirname(os.path.abspath(ADAPTER_DIR)), "calibration.json")
temps = json.load(open(_calib))["per_kind"] if os.path.exists(_calib) else {"noul": 1.0, "score": 1.0, "choice": 1.0}
temps.setdefault("score", 1.0)

from transformers import AutoTokenizer

tok = AutoTokenizer.from_pretrained(MODEL_DIR, trust_remote_code=True)
has_effort = "reasoning_effort" in (tok.chat_template or "")


def single_token_labels(context):
    out = []
    for lab in list(string.ascii_uppercase) + [a + b for a in string.ascii_uppercase for b in string.ascii_uppercase]:
        t = tok.encode(lab, add_special_tokens=False)
        if len(t) == 1 and t[0] in tok.encode(context.format(lab), add_special_tokens=False):
            out.append((lab, t[0]))
        if len(out) == MAX_OPTIONS:
            break
    return out


dec = single_token_labels("x" + NL + chr(123) + chr(125) + ") y")
_clo, _chi = head["slots"]["ranges"]["choice"]
assert [t for _, t in dec[: _chi - _clo]] == head["verbalizer_ids"][_clo:_chi], \
    "first labels must be the trained A-P head"
labels = [l for l, _ in dec]
label_ids = [t for _, t in dec]

_base = tok.encode("Answer: (", add_special_tokens=False)
ans = []
for lab in list(string.ascii_uppercase) + [a + b for a in string.ascii_uppercase for b in string.ascii_uppercase]:
    ids = tok.encode("Answer: (" + lab + ")", add_special_tokens=False)
    if ids[: len(_base)] == _base and len(ids) == len(_base) + 2:
        ans.append((lab, ids[len(_base)]))
    if len(ans) == MAX_OPTIONS:
        break
ans_labels = ans

_think_cache = {}


def _think_frame(kwargs):
    key = json.dumps(kwargs or {}, sort_keys=True)
    if key not in _think_cache:
        kw = {k: v for k, v in (kwargs or {}).items() if k != "enable_thinking"}
        chat = tok.apply_chat_template(
            [{"role": "user", "content": PLACEHOLDER}], tokenize=False,
            add_generation_prompt=True, enable_thinking=True, **kw)
        _think_cache[key] = tuple(chat.split(PLACEHOLDER))
    return _think_cache[key]


def _parts(state):
    if isinstance(state, str):
        return [{"type": "text", "text": state}], False
    if isinstance(state, dict):
        return [{"type": "text", "text": json.dumps(state, ensure_ascii=False)}], False
    out, img = [], False
    for p in state:
        if isinstance(p, str):
            out.append({"type": "text", "text": p})
        elif isinstance(p, dict) and "image" in p:
            out.append({"type": "image_url", "image_url": {"url": p["image"]}})
            img = True
        elif isinstance(p, dict) and p.get("type") == "image_url":
            out.append(p)
            img = True
        elif isinstance(p, dict) and p.get("type") == "text":
            out.append(p)
        else:
            out.append({"type": "text", "text": json.dumps(p, ensure_ascii=False)})
    return out, img


def _render(parts):
    """Render content parts to (text, image_data). Image parts render to the image placeholder; urls kept in order."""
    text, image_data = "", []
    for p in parts:
        if p.get("type") == "image_url":
            text += PROF["image"]
            image_data.append(p["image_url"]["url"])
        else:
            text += p.get("text", "")
    return text, image_data


def _softmax(z):
    m = max(z)
    e = [math.exp(x - m) for x in z]
    s = sum(e)
    return [x / s for x in e]


class UpstreamError(Exception):
    def __init__(self, status, detail):
        self.status, self.detail = status, detail


class Ctx:
    def __init__(self):
        self.requests = 0
        self.prompt_tokens = 0
        self.completion_tokens = 0

    def count(self, meta):
        self.requests += 1
        self.prompt_tokens += int(meta.get("prompt_tokens") or 0)
        self.completion_tokens += int(meta.get("completion_tokens") or 0)


app = FastAPI()
client = httpx.AsyncClient(timeout=httpx.Timeout(900.0, connect=10.0),
                           limits=httpx.Limits(max_connections=100, max_keepalive_connections=50))


def _parse_logprob_entry(e):
    """sglang /generate logprob entries are [logprob, token_id, text?] lists or dicts."""
    if isinstance(e, dict):
        tid = e.get("id", e.get("token_id"))
        if tid is None:
            t = e.get("text") or ""
            tid = tok.convert_tokens_to_ids(t) if t else None
        return int(tid), float(e["logprob"])
    return int(e[1]), float(e[0])


async def _read_logprobs(ctx, text, ids, lora_id, image_data):
    """One-token read-out: {token_id: logprob} at the first output position."""
    body = {
        "text": text,
        "sampling_params": {"max_new_tokens": 1, "temperature": 1.0, "top_p": 1.0,
                            "top_k": -1, "min_p": 0.0, "repetition_penalty": 1.0},
        "return_logprob": True,
        "token_ids_logprob": ids,
    }
    if lora_id:
        # Send the registered adapter NAME via lora_path: the tokenizer
        # manager resolves name -> deterministic lora_id. Sending lora_id
        # directly bypasses the registry and the scheduler's adapter dict
        # (keyed by uuid5(name,path)) misses it -> assert crash.
        body["lora_path"] = lora_id
    if image_data:
        body["image_data"] = image_data
    r = await client.post(UPSTREAM + "/generate", json=body)
    if r.status_code != 200:
        raise UpstreamError(r.status_code, r.text[:500])
    meta = r.json()["meta_info"]
    ctx.count(meta)
    out = {}
    ot = meta.get("output_token_ids_logprobs") or []
    if ot:
        for e in ot[0] or []:
            if e is None:
                continue
            tid, lp = _parse_logprob_entry(e)
            out[tid] = lp
        if out:
            return out
    # fallback: top-K
    body2 = {k: v for k, v in body.items() if k != "token_ids_logprob"}
    body2["top_logprobs_num"] = FALLBACK_TOPK
    r2 = await client.post(UPSTREAM + "/generate", json=body2)
    if r2.status_code != 200:
        raise UpstreamError(r2.status_code, r2.text[:500])
    meta2 = r2.json()["meta_info"]
    ctx.count(meta2)
    tl = meta2.get("output_top_logprobs") or []
    for e in (tl[0] if tl else []):
        if e is None:
            continue
        tid, lp = _parse_logprob_entry(e)
        if tid in ids:
            out[tid] = lp
    return out


async def s1_pass(ctx, kind, parts, image_data, question, opts):
    lo, hi = head["slots"]["ranges"][kind]
    if kind == "choice":
        n = len(opts)
        ids = label_ids[:n]
        bias = [head["bias"][lo + i] if lo + i < hi else 0.0 for i in range(n)]
        lines = [labels[i] + ") " + o for i, o in enumerate(opts)]
    else:
        ids = head["verbalizer_ids"][lo:hi]
        bias = head["bias"][lo:hi]
        lines = opts
    text = (PROF["prefix"] + "[kind] " + kind + NL + "[state] " + _render(parts)[0]
            + NL + "[question] " + question + NL + "[options]" + NL + NL.join(lines) + NL + "[decision]:")
    lp = await _read_logprobs(ctx, text, ids, LORA, image_data)
    return _softmax([(max(lp.get(t, -1e9), -1e9) + b) / temps[kind] for t, b in zip(ids, bias)])


def _groups(n, k=16):
    g = math.ceil(n / k)
    base, extra = divmod(n, g)
    out, i = [], 0
    for j in range(g):
        size = base + (1 if j < extra else 0)
        out.append(list(range(i, i + size)))
        i += size
    return out


async def s1_dist(ctx, kind, parts, image_data, question, opts, strategy):
    if kind != "choice" or len(opts) <= 16 or strategy == "single":
        return await s1_pass(ctx, kind, parts, image_data, question, opts)
    n = len(opts)
    if strategy == "permute":
        import random
        rng = random.Random(zlib.crc32(question.encode()))
        orders = [list(range(n))] + [rng.sample(range(n), n) for _ in range(3)]
        res = [await s1_pass(ctx, kind, parts, image_data, question, [opts[i] for i in o]) for o in orders]
        p = [0.0] * n
        for o, r in zip(orders, res):
            for i, v in zip(o, r):
                p[i] += v / len(orders)
        return p
    groups = _groups(n)
    parts_g = [await s1_pass(ctx, kind, parts, image_data, question, [opts[i] for i in g]) for g in groups]
    in_group = {o: p for g, ps in zip(groups, parts_g) for o, p in zip(g, ps)}
    chosen = [max(g, key=lambda o: (in_group[o], -o)) for g in groups]
    rest = sorted((o for g in groups for o in g if o not in set(chosen)), key=lambda o: (-in_group[o], o))
    fin = sorted(chosen + rest[: max(0, 16 - len(chosen))])
    final = dict(zip(fin, await s1_pass(ctx, kind, parts, image_data, question, [opts[i] for i in fin])))
    group_of = {o: gi for gi, g in enumerate(groups) for o in g}
    share = [0.0] * len(groups)
    cap = [0.0] * len(groups)
    for f in fin:
        share[group_of[f]] += final[f]
        cap[group_of[f]] += in_group[f]
    among = sum(a * b for a, b in zip(share, cap))
    p = [final[o] * among if o in final else share[group_of[o]] * in_group[o] for o in range(n)]
    s = sum(p)
    return [x / s for x in p]


async def s2_dist(ctx, kind, parts, image_data, question, opts, budget, want_text, tmpl_kwargs):
    shown = ["Yes (true)", "No (false)"] if kind == "noul" else opts
    labs = ans_labels[: len(shown)]
    body = NL.join("(" + l + ") " + o for (l, _), o in zip(labs, shown))
    tail = (NL + NL + "Question: " + question + NL + NL + "Options:" + NL + body + NL + NL +
            "Think it through carefully, then give your final answer on the last line in the form: Answer: (X)")
    pre, post = _think_frame(tmpl_kwargs)
    gen_parts = [{"type": "text", "text": pre}] + parts + [{"type": "text", "text": tail + post}]
    gen_text, gen_imgs = _render(gen_parts)
    t0 = time.time()
    # 注意：sglang v0.5.19 的 SamplingParams 没有 seed 字段，传入会 500
    body = {
        "text": gen_text,
        "sampling_params": {"max_new_tokens": budget or S2_DEFAULT_BUDGET,
                            "stop": [THINK_CLOSE], "temperature": 1.0},
    }
    if gen_imgs:
        body["image_data"] = gen_imgs
    r = await client.post(UPSTREAM + "/generate", json=body)
    if r.status_code != 200:
        raise UpstreamError(r.status_code, r.text[:500])
    data = r.json()
    thought = data.get("text") or ""
    meta = data.get("meta_info", {})
    ctx.count(meta)
    finished = meta.get("finish_reason") in ("stop", None)
    idx = thought.find(THINK_CLOSE)
    if idx != -1:
        thought = thought[:idx]
    ntok = meta.get("completion_tokens")
    # read-out: fresh single user turn with the thought appended (no LoRA)
    read_text, read_imgs = _render([{"type": "text", "text": pre}] + parts
                                   + [{"type": "text", "text": tail + post + thought + THINK_CLOSE + PROF["after_think"] + "Answer: ("}])
    ids = [t for _, t in labs]
    lp = await _read_logprobs(ctx, read_text, ids, None, read_imgs)
    p = _softmax([max(lp.get(t, -1e9), -1e9) for t in ids])
    if kind == "noul":
        p = [p[1], p[0]]  # (A) yes / (B) no -> [P(false), P(true)]
    info = {"think_tokens": ntok, "think_seconds": round(time.time() - t0, 3), "finished_within_budget": finished}
    if want_text:
        info["reasoning"] = thought.strip()
    return p, info


def _fold(p1, p2, w):
    return [(1 - w) * x + w * y for x, y in zip(p1, p2)]


class DecideRequest(BaseModel):
    kind: Literal["noul", "score", "choice"]
    state: Union[str, dict, list] = ""
    question: str
    options: Optional[list] = None
    strategy: Literal["auto", "single", "tournament", "permute"] = "auto"
    thinking: Literal["default", "off", "auto", "on"] = "default"
    threshold: Optional[float] = None
    think_budget: Optional[int] = None
    reasoning_effort: Optional[str] = None
    chat_template_kwargs: Optional[dict] = None
    return_reasoning: bool = False
    debug: bool = False
    system2_only: bool = False


def _err(msg, code=400):
    return JSONResponse({"error": {"message": msg, "type": "BadRequestError", "code": code}}, status_code=code)


@app.get("/v1/decide/info")
async def decide_info():
    return {"protocol": PROTOCOL, "model": MODEL_DIR, "max_options": len(labels),
            "native_choice_options": len(head["slots"]["verbalizers"]) - 8, "temperatures": temps,
            "defaults": {"strategy": PROF["strategy"], "thinking": PROF["thinking"], "threshold": PROF["threshold"],
                         "mix": PROF["mix"], "think_budget": None},
            "reasoning_controls": {"enable_thinking": True,
                                   "reasoning_effort": ["xhigh", "medium", "low"] if has_effort else None,
                                   "think_budget": "max thinking tokens (default: up to the context window)"},
            "gate": ("thinking=auto: S2 fires when max(S1 prob) < threshold; "
                     "a threshold <= 1/options is degenerate and is clamped to 1/options + 0.25 "
                     "(see response thinking.threshold_effective)")}


@app.get("/health")
async def health():
    try:
        r = await client.get(UPSTREAM + "/health")
        ok = r.status_code == 200
    except Exception:
        ok = False
    return JSONResponse({"front_door": "ok", "sglang": "ok" if ok else "down"}, status_code=200 if ok else 503)


@app.post("/v1/decide")
async def decide(req: DecideRequest):
    t0 = time.time()
    if req.kind == "choice":
        opts = req.options or []
        if not 2 <= len(opts) <= len(labels):
            return _err("choice needs 2-" + str(len(labels)) + " options, got " + str(len(opts)))
    else:
        opts = ["false", "true"] if req.kind == "noul" else [str(i) for i in range(6)]
    thinking = PROF["thinking"] if req.thinking == "default" else req.thinking
    tmpl = dict(req.chat_template_kwargs or {})
    if req.reasoning_effort is not None:
        if not has_effort:
            return _err("this base model has no reasoning_effort setting; control the reasoning length with think_budget")
        tmpl["reasoning_effort"] = req.reasoning_effort
    strategy = PROF["strategy"] if req.strategy == "auto" else req.strategy
    tau = PROF["threshold"] if req.threshold is None else req.threshold
    # auto-gate fix: max(p1) is always >= 1/k (uniform baseline), so a
    # threshold at or below 1/k can never trigger System 2 for this option
    # count (a dead gate on binary at 0.5). Clamp up to a reachable,
    # sensible confidence gate; effective value reported as
    # resp["thinking"]["threshold_effective"].
    _k = len(opts) if req.kind == "choice" else (2 if req.kind == "noul" else 6)
    tau_eff = tau if tau > 1.0 / _k else min(1.0, 1.0 / _k + 0.25)
    parts, has_img = _parts(req.state)
    text0, image_data = _render(parts)
    ctx = Ctx()
    try:
        if req.system2_only:
            p2, think = await s2_dist(ctx, req.kind, parts, image_data, req.question, opts,
                                      req.think_budget, req.return_reasoning, tmpl)
            k = max(range(len(p2)), key=p2.__getitem__)
            return {"kind": req.kind, "options": opts, "probabilities": p2, "choice_index": k,
                    "choice": opts[k], "system": 2, "model": MODEL_DIR,
                    "thinking": {"used": True, "budget": req.think_budget, **think},
                    "usage": {"prompt_tokens": ctx.prompt_tokens, "completion_tokens": ctx.completion_tokens},
                    "elapsed_seconds": time.time() - t0, "num_model_requests": ctx.requests}
        p1 = await s1_dist(ctx, req.kind, parts, image_data, req.question, opts, strategy)
        probs, think = p1, None
        if thinking == "on" or (thinking == "auto" and max(p1) < tau_eff):
            p2, think = await s2_dist(ctx, req.kind, parts, image_data, req.question, opts,
                                      req.think_budget, req.return_reasoning, tmpl)
            probs = _fold(p1, p2, PROF["mix"])
            think = {"used": True, **think}
            if req.debug:
                think.update(system1=p1, system2=p2)
        elif thinking != "off":
            think = {"used": False}
            if req.debug:
                think["system1"] = p1
    except UpstreamError as e:
        return JSONResponse({"error": e.detail}, status_code=e.status)
    k = max(range(len(probs)), key=probs.__getitem__)
    native = req.kind != "choice" or len(opts) <= 16
    resp = {"kind": req.kind, "effective_kind": req.kind, "options": opts, "probabilities": probs,
            "choice_index": k, "choice": opts[k], "adaptation": "native" if native else strategy,
            "protocol": PROTOCOL, "model": MODEL_DIR,
            "usage": {"prompt_tokens": ctx.prompt_tokens, "completion_tokens": ctx.completion_tokens,
                      "total_tokens": ctx.prompt_tokens + ctx.completion_tokens},
            "elapsed_seconds": time.time() - t0, "num_model_requests": ctx.requests}
    if think is not None:
        resp["thinking"] = {"mode": thinking, "threshold": tau, "threshold_effective": tau_eff,
                            "budget": req.think_budget,
                            **({"chat_template_kwargs": tmpl} if tmpl else {}), **think}
    return resp


@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"])
async def proxy(path: str, request: Request):
    url = UPSTREAM + "/" + path
    headers = {k: v for k, v in request.headers.items() if k.lower() not in ("host", "content-length")}
    body = await request.body()
    upstream_req = client.build_request(request.method, url, headers=headers, content=body,
                                        params=dict(request.query_params))
    r = await client.send(upstream_req, stream=True)
    ctype = r.headers.get("content-type", "")
    hop = {"content-length", "transfer-encoding", "connection", "keep-alive"}
    rheaders = {k: v for k, v in r.headers.items() if k.lower() not in hop}
    if "text/event-stream" in ctype:
        async def gen():
            try:
                async for chunk in r.aiter_bytes():
                    yield chunk
            finally:
                await r.aclose()
        return StreamingResponse(gen(), status_code=r.status_code, headers=rheaders)
    data = await r.aread()
    await r.aclose()
    return Response(content=data, status_code=r.status_code, headers=rheaders)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", "30000")))
```

## 四、结果

### 4.1 快模式（双方都不思考）：准度半斤八两，我们快 3 倍

| 指标 | JEV | StartLux |
|---|---|---|
| 7800 题官方分 | 45.8 | **50.6** |
| 506 道私有题正确率 | 96.25% | 96.84% |
| 单题中位时延（16 并发） | **1.17 秒** | 3.44 秒 |

官方题上对方赢 13 个题类里的 10 类，我们只在"工具调用是否合法"一类明显占优（93.0% vs 87.3%）；私有题上基本打平，差距集中在打分题（81.6% vs 86.2%）。

快模式一句话：**准度差不多，JEV 单题快 3 倍**；批量吞吐则是对方快一些（它的推理并行度更高）。

### 4.2 慢模式（开思考）：从 45.8 到 97.9

这个反转中间还差点走错。第一次在私有 506 题上测"自动思考"，结果 95.85%，**比不思考的 96.25% 还低**，当时几乎就要下结论"思考没用"。后来查出来两个原因：一是"自动开关"对是/否题整个失效（设计死区，已修复）；二是私有题上快路径基线本来就有 96%，思考没多少可提升的空间。

真正的转折在 7800 题官方基准的困难题类上：

| 题类 | 不思考 | 开思考 | 600 题明细 |
|---|---|---|---|
| 数日志行数 | 26.0 | **98.0** | 修正 221 题，仅 5 题改错 |
| 政策判断 | 55.0 | **98.5** | 修正 174 题，0 题改错 |

这两类的病灶是快路径"**自信地答错**"——概率很高，答案不对；慢路径想一遍就改回来了。先只开这两个题类，总分就从 45.8 涨到 59.2，反超对方。

于是全量 7800 题全部开思考重跑（16 并发，约 13.8 小时，0 失败）：**45.8 → 97.9，+52.1 分，13 个题类全部提升、无一倒退**。做了三项质检确认不是"假高分"：全部题都有答案、全部真实走了慢路径、答案分布与标准答案吻合。

私有 506 题上也补了全量思考：**97.04%**，对 StartLux 最好的 98.22%（只有 16/506 题真正触发思考），差 1.2 个点，在它的采样噪声之内——**基本打平**。拆开看：打分题 81.6% → 90.8%，正好追平对方；选择题从 100% 掉到 97.65%（思考偶尔把简单题想复杂了）；是/否题持平。

### 4.3 思考的代价

- **慢**：快路径约 1.2 秒/题；开思考后 36–218 秒/题（按题类），7800 题要跑 13.8 小时。
- **更准，但"自信"更虚**：思考后答案明显更准，但模型自报的置信度反而更高估了。所以"没把握才深思"的自动开关不能拿慢路径的置信度当触发条件——这正是 JEV 自动模式暂时不能用的原因：快路径在难题上"自信但错"，阈值筛不出真正该想的题。

StartLux 的做法值得参考：它的开关稀疏触发，506 题里只有 16 题真正深思，整体时延几乎不涨。"**只在必要时想**"是 JEV 下一步要对齐的方向。

## 五、最终结论

1. **快模式**：准度和 StartLux 同档（私有题 96.25% vs 96.84%），单题快 3 倍。要低延迟的实时场景，用这个。
2. **慢模式**：7800 题官方基准 97.9 分（对方快模式只有 50.6），13 个题类全部 96 分以上。批量、离线、追求准确率的决策任务，用这个。
3. **自动模式暂时别用**：开关的"挑题"能力还没修好，开了反而比不开略差。
4. **最诚实的一句话**：官方 7800 题是公开题集，领先 47 分有"主场"成分；在双方都没见过的 506 道私有题上，两家基本打平。真实的差距在快模式的速度和工程细节上。
5. **思考值不值，取决于基线**：快路径基线越高，思考的增量越小（私有题 +0.8 分，噪声内）；基线越低，越是雪中送炭（官方题 +52.1 分）。评测决策服务，第一件该做的事不是看总分，而是找到快路径"自信但错"的题——那才是思考的价值所在。

已知局限：图像场景只用简单图验证过（复杂图建议直接走慢路径）；StartLux 的思考模式没在官方题集上测过，慢对慢的完整对比还差这一项。

## 结语

这次最大的收获不是 97.9，而是过程：**"思考没用"这个初步结论差点让我们跳过全量重测**——在私有题上无效的配置，在官方题上是 +52 分。对决策服务来说，"自信"和"正确"是两回事，慢思考的价值就是把这两者的差距补上。

记录一下，希望对同样在搭"决策 + 视觉"服务的人有用。
