import type { PrismaClient } from '@prisma/client';

export type CanonicalTopicDef = {
  slug: string;
  name: string;
  description: string;
  keywords: string[];
  subtopics: {
    slug: string;
    name: string;
    keywords: string[];
  }[];
};

export type CanonicalCompanyDef = {
  slug: string;
  name: string;
  domain: string;
  bio: string;
  xUrl: string;
  focusAreas: string[];
  keywords: string[];
};

export type CanonicalAuthorDef = {
  slug: string;
  name: string;
  role: string;
  bio: string;
  websiteUrl: string;
  xUrl: string;
  focusAreas: string[];
};

export const CANONICAL_TOPICS: CanonicalTopicDef[] = [
  {
    slug: 'agents',
    name: 'agents',
    description: 'Autonomous AI agents, tool execution, MCP servers, and multi-agent orchestration.',
    keywords: ['agent', 'agents', 'agentic', 'autonomous', 'mcp', 'tool use', 'computer use', 'langgraph', 'autogen'],
    subtopics: [
      { slug: 'agent_frameworks', name: 'agent_frameworks', keywords: ['framework', 'sdk', 'langgraph', 'crewai', 'autogen', 'swarm'] },
      { slug: 'tool_use', name: 'tool_use', keywords: ['tool use', 'function calling', 'tool-calling', 'tools'] },
      { slug: 'mcp', name: 'mcp', keywords: ['mcp', 'model context protocol'] },
      { slug: 'computer_use', name: 'computer_use', keywords: ['computer use', 'browser', 'gui agent', 'desktop'] },
      { slug: 'code_agents', name: 'code_agents', keywords: ['coding agent', 'code agent', 'swe-bench', 'claude code', 'codex', 'devin'] },
      { slug: 'multi_agent', name: 'multi_agent', keywords: ['multi-agent', 'multi agent', 'orchestration', 'handoff'] },
      { slug: 'memory', name: 'memory', keywords: ['agent memory', 'episodic', 'long-term memory', 'mem0'] },
      { slug: 'guardrails', name: 'guardrails', keywords: ['guardrail', 'sandbox', 'policy enforcement'] },
      { slug: 'deep_research', name: 'deep_research', keywords: ['deep research', 'literature review', 'research agent'] },
    ],
  },
  {
    slug: 'api',
    name: 'api',
    description: 'Model APIs, developer protocols, SDK releases, and gateway standards.',
    keywords: ['api', 'endpoint', 'rest api', 'graphql', 'sdk', 'webhook'],
    subtopics: [
      { slug: 'api_design', name: 'api_design', keywords: ['api design', 'openapi', 'rest', 'sdk', 'protocol', 'endpoint'] },
    ],
  },
  {
    slug: 'audio',
    name: 'audio',
    description: 'Speech synthesis, transcription, realtime voice models, and music generation.',
    keywords: ['audio', 'speech', 'voice', 'tts', 'asr', 'whisper', 'music'],
    subtopics: [
      { slug: 'text_to_speech', name: 'text_to_speech', keywords: ['tts', 'text-to-speech', 'speech synthesis'] },
      { slug: 'speech_to_text', name: 'speech_to_text', keywords: ['asr', 'speech-to-text', 'whisper', 'transcription'] },
      { slug: 'realtime_voice', name: 'realtime_voice', keywords: ['realtime voice', 'voice agent', 'full-duplex'] },
      { slug: 'voice_cloning', name: 'voice_cloning', keywords: ['voice cloning', 'zero-shot tts'] },
      { slug: 'music_generation', name: 'music_generation', keywords: ['music', 'song generation', 'audio generation'] },
    ],
  },
  {
    slug: 'benchmarks',
    name: 'benchmarks',
    description: 'Model evaluations, leaderboards, contamination analysis, and capability testing.',
    keywords: ['benchmark', 'evaluation', 'eval', 'leaderboard', 'mmlu', 'swe-bench', 'gpqa', 'arena'],
    subtopics: [
      { slug: 'evals', name: 'evals', keywords: ['eval', 'evals', 'benchmark', 'leaderboard', 'arena', 'swe-bench'] },
    ],
  },
  {
    slug: 'business',
    name: 'business',
    description: 'Enterprise AI adoption, funding, M&A, pricing strategy, and market economics.',
    keywords: ['enterprise', 'funding', 'valuation', 'revenue', 'acquisition', 'pricing', 'roi', 'commercial'],
    subtopics: [
      { slug: 'enterprise_adoption', name: 'enterprise_adoption', keywords: ['enterprise', 'adoption', 'deployment', 'production', 'funding', 'pricing'] },
    ],
  },
  {
    slug: 'data',
    name: 'data',
    description: 'Synthetic data generation, corpus curation, filtering pipelines, and open datasets.',
    keywords: ['dataset', 'data curation', 'synthetic data', 'corpus', 'tokenization', 'annotation'],
    subtopics: [
      { slug: 'synthetic_data', name: 'synthetic_data', keywords: ['synthetic data', 'self-instruct', 'generated data'] },
      { slug: 'data_curation', name: 'data_curation', keywords: ['data curation', 'deduplication', 'filtering', 'data quality'] },
      { slug: 'datasets', name: 'datasets', keywords: ['dataset', 'corpus', 'benchmark data'] },
    ],
  },
  {
    slug: 'development',
    name: 'development',
    description: 'AI-assisted software engineering, code generation, automated review, and developer tooling.',
    keywords: ['developer', 'coding', 'code generation', 'ide', 'compiler', 'debugging', 'pull request', 'typescript', 'python', 'rust'],
    subtopics: [
      { slug: 'code_generation', name: 'code_generation', keywords: ['code generation', 'codegen', 'autocomplete', 'copilot', 'cursor'] },
      { slug: 'code_review', name: 'code_review', keywords: ['code review', 'static analysis', 'bug detection', 'pr review'] },
      { slug: 'code_agents', name: 'code_agents', keywords: ['coding agent', 'autonomous coding', 'claude code', 'codex'] },
    ],
  },
  {
    slug: 'government',
    name: 'government',
    description: 'AI regulation, sovereign compute, export controls, and national defense initiatives.',
    keywords: ['government', 'regulation', 'policy', 'export control', 'defense', 'sovereign', 'legislation', 'eu ai act'],
    subtopics: [
      { slug: 'policy', name: 'policy', keywords: ['policy', 'white house', 'executive order', 'governance'] },
      { slug: 'regulation', name: 'regulation', keywords: ['regulation', 'compliance', 'antitrust', 'copyright', 'law'] },
      { slug: 'defense', name: 'defense', keywords: ['defense', 'military', 'national security', 'pentagon'] },
    ],
  },
  {
    slug: 'gpus',
    name: 'gpus',
    description: 'Hardware accelerators, CUDA kernels, model quantization, and edge silicon.',
    keywords: ['gpu', 'cuda', 'nvidia', 'blackwell', 'h100', 'b200', 'tpu', 'triton', 'quantization', 'fp8', 'int4'],
    subtopics: [
      { slug: 'accelerators', name: 'accelerators', keywords: ['gpu', 'tpu', 'blackwell', 'h100', 'b200', 'asic', 'accelerator'] },
      { slug: 'quantization', name: 'quantization', keywords: ['quantization', 'fp8', 'int4', 'int8', 'awq', 'gguf', 'bitnet'] },
      { slug: 'kernels', name: 'kernels', keywords: ['cuda', 'kernel', 'triton', 'flashattention', 'cutlass'] },
      { slug: 'edge_deployment', name: 'edge_deployment', keywords: ['on-device', 'edge', 'mobile', 'npu', 'apple silicon', 'mlx'] },
    ],
  },
  {
    slug: 'image',
    name: 'image',
    description: 'Diffusion models, visual generation, OCR, segmentation, and vision-language architectures.',
    keywords: ['image', 'diffusion', 'vision', 'flux', 'stable diffusion', 'ocr', 'segmentation', 'vlm'],
    subtopics: [
      { slug: 'image_generation', name: 'image_generation', keywords: ['image generation', 'diffusion', 'text-to-image', 'flux'] },
      { slug: 'image_editing', name: 'image_editing', keywords: ['image editing', 'inpainting', 'controlnet'] },
      { slug: 'object_detection', name: 'object_detection', keywords: ['object detection', 'yolo', 'bounding box'] },
      { slug: 'segmentation', name: 'segmentation', keywords: ['segmentation', 'sam', 'mask'] },
      { slug: 'pose_estimation', name: 'pose_estimation', keywords: ['pose estimation', 'keypoints', 'motion capture'] },
      { slug: 'ocr', name: 'ocr', keywords: ['ocr', 'document parsing', 'text recognition'] },
      { slug: 'neural_rendering', name: 'neural_rendering', keywords: ['nerf', 'gaussian splatting', '3d reconstruction'] },
      { slug: 'vision_language', name: 'vision_language', keywords: ['vlm', 'vision-language', 'multimodal'] },
    ],
  },
  {
    slug: 'infra',
    name: 'infra',
    description: 'High-throughput model serving, KV-cache optimization, and production observability.',
    keywords: ['inference', 'serving', 'vllm', 'sglang', 'tensorrt', 'kv cache', 'throughput', 'latency', 'observability'],
    subtopics: [
      { slug: 'model_serving', name: 'model_serving', keywords: ['vllm', 'sglang', 'serving', 'inference engine', 'tensorrt-llm'] },
      { slug: 'inference_optimization', name: 'inference_optimization', keywords: ['speculative decoding', 'kv cache', 'batching', 'latency', 'throughput'] },
      { slug: 'monitoring', name: 'monitoring', keywords: ['monitoring', 'observability', 'tracing', 'telemetry'] },
    ],
  },
  {
    slug: 'llms',
    name: 'llms',
    description: 'Foundation language models, Mixture-of-Experts, long context, and small language models.',
    keywords: ['llm', 'language model', 'gpt', 'claude', 'gemini', 'llama', 'qwen', 'deepseek', 'transformer', 'moe'],
    subtopics: [
      { slug: 'mixture_of_experts', name: 'mixture_of_experts', keywords: ['moe', 'mixture of experts', 'mixture-of-experts', 'sparse'] },
      { slug: 'long_context', name: 'long_context', keywords: ['long context', 'context window', '1m tokens', 'ring attention'] },
      { slug: 'hallucinations', name: 'hallucinations', keywords: ['hallucination', 'factuality', 'grounding'] },
      { slug: 'structured_output', name: 'structured_output', keywords: ['structured output', 'json schema', 'constrained decoding'] },
      { slug: 'translation', name: 'translation', keywords: ['translation', 'multilingual', 'cross-lingual'] },
      { slug: 'small_models', name: 'small_models', keywords: ['small model', 'slm', '1b', '3b', '7b', 'compact'] },
      { slug: 'vision_language', name: 'vision_language', keywords: ['multimodal', 'vision-language', 'omni'] },
    ],
  },
  {
    slug: 'open_source',
    name: 'open_source',
    description: 'Open-weights releases, permissive licenses, and community-driven model ecosystems.',
    keywords: ['open source', 'open-source', 'open weights', 'open-weights', 'apache 2.0', 'mit license', 'huggingface'],
    subtopics: [
      { slug: 'open_weights', name: 'open_weights', keywords: ['open weights', 'open-weights', 'open source', 'checkpoint', 'huggingface'] },
    ],
  },
  {
    slug: 'post_training',
    name: 'post_training',
    description: 'Reinforcement learning, preference optimization, distillation, and parameter-efficient fine-tuning.',
    keywords: ['rlhf', 'dpo', 'grpo', 'fine-tuning', 'finetuning', 'lora', 'distillation', 'post-training', 'alignment', 'reinforcement learning'],
    subtopics: [
      { slug: 'rl', name: 'rl', keywords: ['reinforcement learning', 'grpo', 'ppo', 'reward model', 'rlvr'] },
      { slug: 'rlhf', name: 'rlhf', keywords: ['rlhf', 'human feedback', 'preference'] },
      { slug: 'dpo', name: 'dpo', keywords: ['dpo', 'direct preference optimization'] },
      { slug: 'distillation', name: 'distillation', keywords: ['distillation', 'teacher', 'student model'] },
      { slug: 'fine_tuning', name: 'fine_tuning', keywords: ['fine-tuning', 'finetuning', 'sft', 'instruction tuning'] },
      { slug: 'lora', name: 'lora', keywords: ['lora', 'qlora', 'peft', 'adapter'] },
      { slug: 'alignment', name: 'alignment', keywords: ['alignment', 'constitutional', 'safety training'] },
    ],
  },
  {
    slug: 'reasoning',
    name: 'reasoning',
    description: 'Test-time compute scaling, chain-of-thought verification, and formal mathematical reasoning.',
    keywords: ['reasoning', 'chain-of-thought', 'cot', 'test-time compute', 'math', 'theorem proving', 'lean4', 'o1', 'o3', 'r1'],
    subtopics: [
      { slug: 'test_time_compute', name: 'test_time_compute', keywords: ['test-time compute', 'thinking', 'chain-of-thought', 'search', 'mcts'] },
      { slug: 'math_reasoning', name: 'math_reasoning', keywords: ['math', 'aime', 'olympiad', 'lean', 'formal proof'] },
    ],
  },
  {
    slug: 'retrieval',
    name: 'retrieval',
    description: 'Embeddings, vector databases, RAG pipelines, rerankers, and document intelligence.',
    keywords: ['rag', 'retrieval', 'embedding', 'vector', 'rerank', 'chunking', 'knowledge graph'],
    subtopics: [
      { slug: 'embeddings', name: 'embeddings', keywords: ['embedding', 'dense retrieval', 'contrastive'] },
      { slug: 'vector_db', name: 'vector_db', keywords: ['vector db', 'vector database', 'hnsw', 'ann', 'milvus', 'qdrant', 'pgvector'] },
      { slug: 'rag', name: 'rag', keywords: ['rag', 'retrieval-augmented', 'hybrid search'] },
      { slug: 'reranking', name: 'reranking', keywords: ['rerank', 'cross-encoder', 'colbert'] },
      { slug: 'document_understanding', name: 'document_understanding', keywords: ['pdf', 'document understanding', 'layout', 'table extraction'] },
    ],
  },
  {
    slug: 'robotics',
    name: 'robotics',
    description: 'Vision-language-action (VLA) models, humanoid locomotion, dexterous manipulation, and autonomy.',
    keywords: ['robot', 'robotics', 'humanoid', 'vla', 'manipulation', 'embodied', 'autonomous driving', 'sim-to-real'],
    subtopics: [
      { slug: 'vla_models', name: 'vla_models', keywords: ['vla', 'vision-language-action', 'embodied ai'] },
      { slug: 'humanoid', name: 'humanoid', keywords: ['humanoid', 'bipedal', 'locomotion'] },
      { slug: 'manipulation', name: 'manipulation', keywords: ['manipulation', 'grasping', 'dexterous', 'teleoperation'] },
      { slug: 'autonomous_driving', name: 'autonomous_driving', keywords: ['autonomous driving', 'self-driving', 'end-to-end driving', 'lidar'] },
    ],
  },
  {
    slug: 'security',
    name: 'security',
    description: 'Adversarial robustness, prompt injection defense, red teaming, and AI safety guardrails.',
    keywords: ['security', 'vulnerability', 'prompt injection', 'jailbreak', 'red team', 'cybersecurity', 'exploit'],
    subtopics: [
      { slug: 'prompt_injection', name: 'prompt_injection', keywords: ['prompt injection', 'indirect injection'] },
      { slug: 'jailbreaks', name: 'jailbreaks', keywords: ['jailbreak', 'adversarial attack', 'bypass'] },
      { slug: 'red_teaming', name: 'red_teaming', keywords: ['red team', 'red-teaming', 'fuzzing', 'vulnerability'] },
      { slug: 'content_moderation', name: 'content_moderation', keywords: ['moderation', 'safety classifier', 'guard'] },
    ],
  },
  {
    slug: 'training_infra',
    name: 'training_infra',
    description: 'Distributed pretraining clusters, collective communication, and neural scaling laws.',
    keywords: ['pretraining', 'distributed training', 'megatron', 'deepspeed', 'fsdp', 'scaling law', 'cluster', 'nccl'],
    subtopics: [
      { slug: 'distributed_training', name: 'distributed_training', keywords: ['distributed training', 'fsdp', 'megatron', 'deepspeed', 'parallelism'] },
      { slug: 'pretraining', name: 'pretraining', keywords: ['pretraining', 'pre-training', 'optimizer', 'muon', 'adamw'] },
      { slug: 'scaling_laws', name: 'scaling_laws', keywords: ['scaling law', 'chinchilla', 'compute optimal'] },
    ],
  },
  {
    slug: 'vibe_coding',
    name: 'vibe_coding',
    description: 'Prompt-to-app builders, generative UI synthesis, and natural language software creation.',
    keywords: ['vibe coding', 'app builder', 'ui generation', 'text-to-app', 'prototyping'],
    subtopics: [
      { slug: 'app_builders', name: 'app_builders', keywords: ['app builder', 'vibe coding', 'full-stack generation'] },
      { slug: 'ui_generation', name: 'ui_generation', keywords: ['ui generation', 'design-to-code', 'frontend generation'] },
    ],
  },
  {
    slug: 'video',
    name: 'video',
    description: 'Spatiotemporal video generation, interactive world models, and long-form video understanding.',
    keywords: ['video', 'world model', 'sora', 'veo', 'runway', 'temporal', 'video generation'],
    subtopics: [
      { slug: 'video_generation', name: 'video_generation', keywords: ['video generation', 'text-to-video', 'sora', 'veo', 'wan'] },
      { slug: 'world_models', name: 'world_models', keywords: ['world model', 'interactive simulation', 'physics'] },
      { slug: 'video_editing', name: 'video_editing', keywords: ['video editing', 'motion transfer', 'relighting'] },
      { slug: 'video_understanding', name: 'video_understanding', keywords: ['video understanding', 'video qa', 'temporal grounding'] },
    ],
  },
];

export const CANONICAL_COMPANIES: CanonicalCompanyDef[] = [
  {
    slug: 'openai',
    name: 'OpenAI',
    domain: 'openai.com',
    bio: 'AGI-focused research lab producing the GPT and o-series model families. Deploys transformer-based LLMs with RLHF and reinforcement fine-tuning; o-series uses chain-of-thought reasoning at inference time. Offers hosted API, Agents SDK, and Responses API for multi-step agentic workflows. Also ships DALL-E, Sora, Whisper, and multimodal realtime audio models.',
    xUrl: 'https://x.com/OpenAI',
    focusAreas: ['LLMS', 'AGENTS', 'API', 'VISION LANGUAGE', 'COMPUTER USE', 'LONG CONTEXT'],
    keywords: ['openai', 'gpt-4', 'gpt-5', 'gpt-6', 'chatgpt', 'codex', 'o1', 'o3', 'sora', 'whisper'],
  },
  {
    slug: 'anthropic',
    name: 'Anthropic',
    domain: 'anthropic.com',
    bio: 'AI safety and frontier model research company building the Claude family of models, Claude Code, Computer Use, and the Model Context Protocol (MCP) for enterprise and developer agentic workflows.',
    xUrl: 'https://x.com/AnthropicAI',
    focusAreas: ['LLMS', 'AGENTS', 'MCP', 'CODE AGENTS', 'ALIGNMENT', 'SECURITY'],
    keywords: ['anthropic', 'claude', 'sonnet', 'opus', 'haiku', 'mcp', 'claude code'],
  },
  {
    slug: 'google',
    name: 'Google DeepMind',
    domain: 'deepmind.google',
    bio: 'Unified AI research laboratory combining DeepMind and Google Brain, developing Gemini multimodal foundation models, Gemma open-weights models, Veo video synthesis, Genie world models, and AlphaFold.',
    xUrl: 'https://x.com/GoogleDeepMind',
    focusAreas: ['LLMS', 'REASONING', 'VISION LANGUAGE', 'WORLD MODELS', 'ROBOTICS'],
    keywords: ['google', 'deepmind', 'gemini', 'gemma', 'tpu', 'veo', 'genie', 'alphafold'],
  },
  {
    slug: 'nvidia',
    name: 'NVIDIA',
    domain: 'nvidia.com',
    bio: 'Full-stack accelerated computing leader designing Blackwell and Hopper GPU architectures, CUDA kernels, TensorRT-LLM inference engines, Nemotron open models, and Isaac robotics simulation platforms.',
    xUrl: 'https://x.com/NVIDIAAI',
    focusAreas: ['GPUS', 'INFRA', 'KERNELS', 'ROBOTICS', 'MODEL SERVING'],
    keywords: ['nvidia', 'cuda', 'blackwell', 'tensorrt', 'nemotron', 'h100', 'b200'],
  },
  {
    slug: 'meta',
    name: 'AI at Meta',
    domain: 'ai.meta.com',
    bio: 'Fundamental AI Research (FAIR) and GenAI organization at Meta developing the open-weights Llama model family, PyTorch deep learning compiler ecosystem, SAM segmentation models, and DINOv2.',
    xUrl: 'https://x.com/AIatMeta',
    focusAreas: ['OPEN_SOURCE', 'LLMS', 'IMAGE', 'SEGMENTATION', 'TRAINING_INFRA'],
    keywords: ['meta', 'llama', 'pytorch', 'fair', 'sam 2', 'dinov2'],
  },
  {
    slug: 'deepseek',
    name: 'DeepSeek',
    domain: 'deepseek.com',
    bio: 'Frontier AI research lab pioneering ultra-efficient Mixture-of-Experts (MoE) architectures, Multi-head Latent Attention (MLA), and Group Relative Policy Optimization (GRPO) for reasoning models.',
    xUrl: 'https://x.com/deepseek_ai',
    focusAreas: ['LLMS', 'REASONING', 'MIXTURE OF EXPERTS', 'POST_TRAINING', 'OPEN_SOURCE'],
    keywords: ['deepseek', 'deepseek-r1', 'deepseek-v3', 'deepseek-v4', 'grpo'],
  },
  {
    slug: 'alibaba-qwen',
    name: 'Qwen',
    domain: 'qwenlm.github.io',
    bio: 'Alibaba Cloud foundation model team producing the open-weights Qwen, QwQ reasoning, Qwen-Coder, and Wan multimodal video generation model families.',
    xUrl: 'https://x.com/Alibaba_Qwen',
    focusAreas: ['OPEN_SOURCE', 'LLMS', 'CODE GENERATION', 'REASONING', 'VIDEO'],
    keywords: ['qwen', 'alibaba', 'qwq', 'wan2', 'wan'],
  },
  {
    slug: 'cursor',
    name: 'Cursor',
    domain: 'cursor.com',
    bio: 'AI-native code editor and autonomous software engineering platform built by Anysphere, specializing in low-latency speculative code edits, multi-file indexing, and background coding agents.',
    xUrl: 'https://x.com/cursor_ai',
    focusAreas: ['DEVELOPMENT', 'CODE GENERATION', 'CODE AGENTS', 'AGENTS'],
    keywords: ['cursor', 'anysphere'],
  },
  {
    slug: 'xai',
    name: 'xAI',
    domain: 'x.ai',
    bio: 'Frontier AI company building the Grok model series and the Colossus GPU supercluster for real-time reasoning, code generation, and multimodal search.',
    xUrl: 'https://x.com/xai',
    focusAreas: ['LLMS', 'REASONING', 'TRAINING_INFRA', 'GPUS'],
    keywords: ['xai', 'grok', 'colossus'],
  },
  {
    slug: 'mistral',
    name: 'Mistral AI',
    domain: 'mistral.ai',
    bio: 'European frontier AI lab building open-weights and commercial language, code (Codestral), and multimodal (Pixtral) models optimized for enterprise efficiency.',
    xUrl: 'https://x.com/MistralAI',
    focusAreas: ['LLMS', 'OPEN_SOURCE', 'CODE GENERATION', 'VISION LANGUAGE'],
    keywords: ['mistral', 'mixtral', 'codestral', 'pixtral'],
  },
  {
    slug: 'microsoft',
    name: 'Microsoft Research',
    domain: 'microsoft.com',
    bio: 'Global research organization advancing small language models (Phi series), DeepSpeed distributed training, AutoGen multi-agent frameworks, and Copilot developer tooling.',
    xUrl: 'https://x.com/MSFTResearch',
    focusAreas: ['SMALL MODELS', 'AGENTS', 'TRAINING_INFRA', 'DEVELOPMENT'],
    keywords: ['microsoft', 'phi-', 'deepspeed', 'autogen', 'azure ai'],
  },
  {
    slug: 'huggingface',
    name: 'Hugging Face',
    domain: 'huggingface.co',
    bio: 'Open-source machine learning platform hosting model weights, datasets, Transformers, Diffusers, TRL post-training libraries, and open evaluation leaderboards.',
    xUrl: 'https://x.com/huggingface',
    focusAreas: ['OPEN_SOURCE', 'DATA', 'POST_TRAINING', 'BENCHMARKS'],
    keywords: ['hugging face', 'huggingface', 'transformers', 'smollm', 'gradio'],
  },
  {
    slug: 'apple',
    name: 'Apple ML',
    domain: 'machinelearning.apple.com',
    bio: 'Apple Machine Learning Research advancing on-device foundation models, MLX array frameworks for Apple Silicon, quantization, and privacy-preserving intelligence.',
    xUrl: 'https://x.com/Apple',
    focusAreas: ['GPUS', 'EDGE DEPLOYMENT', 'SMALL MODELS', 'QUANTIZATION'],
    keywords: ['apple', 'mlx', 'coreml', 'apple silicon'],
  },
  {
    slug: 'stanford',
    name: 'Stanford AI',
    domain: 'ai.stanford.edu',
    bio: 'Academic research laboratory pioneering FlashAttention, Direct Preference Optimization (DPO), DSPy declarative language model programming, and foundation model evaluations.',
    xUrl: 'https://x.com/StanfordHAI',
    focusAreas: ['REASONING', 'POST_TRAINING', 'KERNELS', 'BENCHMARKS'],
    keywords: ['stanford', 'crfm', 'dspy', 'flashattention'],
  },
];

export const CANONICAL_AUTHORS: CanonicalAuthorDef[] = [
  {
    slug: 'lior-alexander',
    name: 'Lior Alexander',
    role: 'Founder & CEO',
    bio: 'Founder & CEO of AlphaSignal. Tracks breakthrough AI research, foundation model launches, and infrastructure shifts across the global AI ecosystem.',
    websiteUrl: 'https://alphasignal.ai',
    xUrl: 'https://x.com/AlphaSignalAI',
    focusAreas: ['LLMS', 'AGENTS', 'INFRA', 'BENCHMARKS'],
  },
  {
    slug: 'bendee983',
    name: 'Ben Dickson',
    role: 'Editorial Lead',
    bio: 'Ben Dickson is a veteran software engineer and former CTO known as the "Engineer\'s Journalist" for translating technical AI research into practical, production-focused insights. He is a lead contributor to TechCrunch and VentureBeat.',
    websiteUrl: 'https://bdtechtalks.com',
    xUrl: 'https://x.com/BenDee983',
    focusAreas: ['LLMS', 'OPEN_SOURCE', 'AGENTS', 'LONG CONTEXT', 'MIXTURE OF EXPERTS', 'SMALL MODELS'],
  },
  {
    slug: 'akruti-acharya',
    name: 'Akruti Acharya',
    role: 'Writer',
    bio: 'Technical AI writer covering agent harnesses, runtime security, prompt injection defenses, and production deployment engineering.',
    websiteUrl: 'https://alphasignal.ai/editorial',
    xUrl: 'https://x.com/AlphaSignalAI',
    focusAreas: ['AGENTS', 'SECURITY', 'DEVELOPMENT', 'PROMPT INJECTION'],
  },
  {
    slug: 'adham-khaled',
    name: 'Adham Khaled',
    role: 'Writer',
    bio: 'Systems engineer and AI writer specializing in coding loops, KV-cache optimization, local model inference, and benchmark field-testing.',
    websiteUrl: 'https://alphasignal.ai/editorial',
    xUrl: 'https://x.com/AlphaSignalAI',
    focusAreas: ['DEVELOPMENT', 'INFRA', 'LLMS', 'CODE AGENTS'],
  },
  {
    slug: 'rehman-rind',
    name: 'Rehman Rind',
    role: 'Writer',
    bio: 'AI research writer covering multimodal architectures, post-training alignment, and open-source model releases.',
    websiteUrl: 'https://alphasignal.ai/editorial',
    xUrl: 'https://x.com/AlphaSignalAI',
    focusAreas: ['LLMS', 'POST_TRAINING', 'OPEN_SOURCE', 'REASONING'],
  },
];

export function normalizeTaxonomySlug(raw: string): string {
  return raw.trim().toLowerCase().replace(/-/g, '_');
}

export function toUrlTopicSlug(slug: string): string {
  return slug.trim().toLowerCase().replace(/_/g, '-');
}

export function resolveCanonicalTopic(slugOrName: string): CanonicalTopicDef | undefined {
  const norm = normalizeTaxonomySlug(slugOrName);
  return CANONICAL_TOPICS.find(
    (t) => normalizeTaxonomySlug(t.slug) === norm || normalizeTaxonomySlug(t.name) === norm
  );
}

export function resolveCanonicalCompany(slugOrName: string): CanonicalCompanyDef | undefined {
  const cleaned = slugOrName.trim().toLowerCase();
  const norm = normalizeTaxonomySlug(cleaned);
  return CANONICAL_COMPANIES.find(
    (c) =>
      c.slug.toLowerCase() === cleaned ||
      normalizeTaxonomySlug(c.slug) === norm ||
      c.name.toLowerCase() === cleaned
  );
}

export function resolveCanonicalAuthor(slugOrName: string): CanonicalAuthorDef | undefined {
  const cleaned = slugOrName.trim().toLowerCase();
  return CANONICAL_AUTHORS.find(
    (a) =>
      a.slug.toLowerCase() === cleaned ||
      a.name.toLowerCase() === cleaned ||
      a.name.toLowerCase().replace(/\s+/g, '-') === cleaned
  );
}

let taxonomyInitialized = false;

export async function ensureCanonicalTaxonomy(prisma: PrismaClient): Promise<void> {
  if (taxonomyInitialized) {
    const count = await prisma.topic.count();
    if (count >= CANONICAL_TOPICS.length) return;
  }

  for (const topicDef of CANONICAL_TOPICS) {
    const topic = await prisma.topic.upsert({
      where: { slug: topicDef.slug },
      update: {
        name: topicDef.name,
        description: topicDef.description,
      },
      create: {
        slug: topicDef.slug,
        name: topicDef.name,
        description: topicDef.description,
      },
    });

    for (const subDef of topicDef.subtopics) {
      await prisma.subtopic.upsert({
        where: {
          topicId_slug: {
            topicId: topic.id,
            slug: subDef.slug,
          },
        },
        update: { name: subDef.name },
        create: {
          slug: subDef.slug,
          name: subDef.name,
          topicId: topic.id,
        },
      });
    }
  }

  for (const companyDef of CANONICAL_COMPANIES) {
    await prisma.company.upsert({
      where: { slug: companyDef.slug },
      update: {
        name: companyDef.name,
        domain: companyDef.domain,
      },
      create: {
        slug: companyDef.slug,
        name: companyDef.name,
        domain: companyDef.domain,
      },
    });
  }

  taxonomyInitialized = true;
}

export function classifySignalContent(input: {
  title: string;
  summary?: string;
  sourceType?: string;
  explicitTopics?: string[];
  explicitCompanies?: string[];
}): {
  topics: { topicSlug: string; subtopicSlug: string | null }[];
  companies: string[];
} {
  const haystack = `${input.title} ${input.summary ?? ''}`.toLowerCase();
  const matchedTopics: { topicSlug: string; subtopicSlug: string | null }[] = [];
  const seenTopics = new Set<string>();

  if (input.explicitTopics?.length) {
    for (const raw of input.explicitTopics) {
      const normalized = raw.trim().toLowerCase();
      const foundTopic = CANONICAL_TOPICS.find((t) => t.slug === normalized);
      if (foundTopic && !seenTopics.has(foundTopic.slug)) {
        seenTopics.add(foundTopic.slug);
        matchedTopics.push({
          topicSlug: foundTopic.slug,
          subtopicSlug: foundTopic.subtopics[0]?.slug ?? null,
        });
      }
      for (const t of CANONICAL_TOPICS) {
        const sub = t.subtopics.find((s) => s.slug === normalized);
        if (sub && !seenTopics.has(`${t.slug}:${sub.slug}`)) {
          seenTopics.add(`${t.slug}:${sub.slug}`);
          matchedTopics.push({ topicSlug: t.slug, subtopicSlug: sub.slug });
        }
      }
    }
  }

  for (const topicDef of CANONICAL_TOPICS) {
    let matchedSubtopic: string | null = null;
    for (const sub of topicDef.subtopics) {
      if (sub.keywords.some((kw) => haystack.includes(kw))) {
        matchedSubtopic = sub.slug;
        break;
      }
    }
    const topicHit = matchedSubtopic !== null || topicDef.keywords.some((kw) => haystack.includes(kw));
    if (topicHit && !seenTopics.has(topicDef.slug)) {
      seenTopics.add(topicDef.slug);
      matchedTopics.push({
        topicSlug: topicDef.slug,
        subtopicSlug: matchedSubtopic ?? topicDef.subtopics[0]?.slug ?? null,
      });
    }
    if (matchedTopics.length >= 4) break;
  }

  if (matchedTopics.length === 0) {
    if (input.sourceType === 'github') {
      matchedTopics.push({ topicSlug: 'open_source', subtopicSlug: 'open_weights' });
      matchedTopics.push({ topicSlug: 'development', subtopicSlug: 'code_generation' });
    } else if (input.sourceType === 'arxiv') {
      matchedTopics.push({ topicSlug: 'llms', subtopicSlug: 'small_models' });
      matchedTopics.push({ topicSlug: 'reasoning', subtopicSlug: 'test_time_compute' });
    } else {
      matchedTopics.push({ topicSlug: 'llms', subtopicSlug: 'structured_output' });
    }
  }

  const matchedCompanies = new Set<string>();
  if (input.explicitCompanies?.length) {
    for (const raw of input.explicitCompanies) {
      const normalized = raw.trim().toLowerCase();
      const found = CANONICAL_COMPANIES.find(
        (c) => c.slug === normalized || c.name.toLowerCase() === normalized
      );
      if (found) matchedCompanies.add(found.slug);
    }
  }

  for (const companyDef of CANONICAL_COMPANIES) {
    if (companyDef.keywords.some((kw) => haystack.includes(kw))) {
      matchedCompanies.add(companyDef.slug);
    }
  }

  return {
    topics: matchedTopics.slice(0, 3),
    companies: Array.from(matchedCompanies).slice(0, 3),
  };
}
