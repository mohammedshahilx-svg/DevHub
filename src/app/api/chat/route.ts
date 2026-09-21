import { NextResponse } from 'next/server';
import { getDb } from '@/lib/storage';
import { SoftwareItem } from '@/lib/types';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function POST(request: Request) {
  try {
    const { messages }: { messages: ChatMessage[] } = await request.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'Messages are required.' }, { status: 400 });
    }

    const latestMessage = messages[messages.length - 1].content.toLowerCase();
    const db = getDb();
    const catalog: SoftwareItem[] = db.software;

    // Check if Gemini API key exists
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const systemPrompt = `You are "DevAdvisor", an expert developer tools and AI stack consultant built into DevHub.
DevHub allows developers to download AI tools, compilers, IDEs, and utilities individually or in a combined ZIP pack.
Here is the live catalog of available software:
${JSON.stringify(catalog.map(s => ({ id: s.id, name: s.name, category: s.category, tags: s.tags, description: s.description })))}

Your goal:
1. Understand what the user wants to build or learn (e.g. AI apps, C++ games, web apps, systems programming).
2. Recommend the best matching tools from the catalog.
3. Keep answers concise, direct, and actionable.
4. At the end of your response, output a JSON block on a new line with recommended tool IDs like:
[RECOMMENDATIONS: ["id1", "id2"]]`;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                { role: 'user', parts: [{ text: systemPrompt }] },
                ...messages.map(m => ({
                  role: m.role === 'assistant' ? 'model' : 'user',
                  parts: [{ text: m.content }],
                })),
              ],
            }),
          }
        );

        if (geminiRes.ok) {
          const data = await geminiRes.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          
          // Parse tool recommendations
          const match = text.match(/\[RECOMMENDATIONS:\s*(\[[^\]]*\])\]/);
          let recommendedIds: string[] = [];
          let cleanedText = text;
          if (match) {
            try {
              recommendedIds = JSON.parse(match[1]);
              cleanedText = text.replace(/\[RECOMMENDATIONS:\s*(\[[^\]]*\])\]/, '').trim();
            } catch {
              // fallback
            }
          }

          const recommendedTools = catalog.filter(s => recommendedIds.includes(s.id));

          return NextResponse.json({
            reply: cleanedText,
            recommendedTools,
          });
        }
      } catch (geminiErr) {
        console.warn('Gemini API call failed, using smart rule-based advisor:', geminiErr);
      }
    }

    // High-Intelligence Built-in Advisor Engine
    let recommendedIds: string[] = [];
    let reply = '';

    if (latestMessage.includes('local') || latestMessage.includes('ollama') || latestMessage.includes('llm') || latestMessage.includes('deepseek') || latestMessage.includes('model') || latestMessage.includes('offline ai')) {
      recommendedIds = ['ollama', 'lm-studio', 'cursor', 'python'];
      reply = `For running and developing with **Local AI & LLMs** on your PC, here is the ideal stack:\n\n` +
        `• **Ollama**: The fastest way to run open-weight models (DeepSeek-R1, Llama 3.3, Mistral) locally with native GPU acceleration and CLI/REST endpoints.\n` +
        `• **LM Studio**: Gives you an intuitive graphical playground to inspect model weights, prompt parameters, and host OpenAI-compatible local endpoints.\n` +
        `• **Cursor**: The top-tier AI-first code editor with direct multi-file codebase indexing.\n` +
        `• **Python 3**: Essential for scripting Hugging Face pipelines, LangChain, or PyTorch models.\n\n` +
        `You can click **"Select Recommended Stack"** below to bundle these into your ZIP download!`;
    } else if (latestMessage.includes('c++') || latestMessage.includes('cpp') || latestMessage.includes('game') || latestMessage.includes('competitive') || latestMessage.includes('c programming')) {
      recommendedIds = ['gcc-mingw', 'llvm-clang', 'vscode', 'git'];
      reply = `For **C and C++ Development** (systems programming, competitive coding, or game dev):\n\n` +
        `• **GCC / MinGW-w64**: Provides GCC 14.2 with full C++23 standards support and the GDB debugger.\n` +
        `• **LLVM / Clang**: Offers world-class compile-time error diagnostics and clang-format formatting.\n` +
        `• **Visual Studio Code**: Pair it with the C/C++ extension for IntelliSense, breakpoints, and CMake integration.\n` +
        `• **Git for Windows**: Track your project repositories and collaborate smoothly.\n\n` +
        `I've packaged this C/C++ toolchain for you below.`;
    } else if (latestMessage.includes('web') || latestMessage.includes('fullstack') || latestMessage.includes('react') || latestMessage.includes('javascript') || latestMessage.includes('typescript') || latestMessage.includes('node')) {
      recommendedIds = ['nodejs', 'vscode', 'git', 'beekeeper-studio'];
      reply = `For **Fullstack Web & TypeScript/JavaScript Development**:\n\n` +
        `• **Node.js (LTS)**: Powers your package ecosystem (npm), build tooling, and backend servers.\n` +
        `• **VS Code**: The undisputed champion editor for TypeScript, React, Next.js, and CSS.\n` +
        `• **Git for Windows**: Essential source code management.\n` +
        `• **Beekeeper Studio**: Clean visual SQL editor for your database queries (PostgreSQL, SQLite, MySQL).\n\n` +
        `Ready to add these to your download cart?`;
    } else if (latestMessage.includes('rust') || latestMessage.includes('system') || latestMessage.includes('memory') || latestMessage.includes('fast')) {
      recommendedIds = ['rust', 'zed', 'git', 'windows-terminal'];
      reply = `For **Modern Systems Programming in Rust**:\n\n` +
        `• **Rust & Cargo**: Guarantees zero-cost abstractions and memory safety without a garbage collector.\n` +
        `• **Zed Editor**: Built in Rust for blazing-fast speed and instant keystroke response.\n` +
        `• **Windows Terminal**: GPU-accelerated terminal for running \`cargo run\` and \`cargo test\`.\n` +
        `• **Git for Windows**: Manage your GitHub crates and repositories.\n\n` +
        `Check the stack below to bundle these tools!`;
    } else if (latestMessage.includes('python') || latestMessage.includes('data') || latestMessage.includes('machine learning') || latestMessage.includes('ai')) {
      recommendedIds = ['python', 'pycharm-ce', 'cursor', 'git'];
      reply = `For **Python, Data Science & Machine Learning**:\n\n` +
        `• **Python 3.13**: The primary language for PyTorch, NumPy, scikit-learn, and FastAPI.\n` +
        `• **Cursor** or **PyCharm Community**: High-octane environments with code completion and environment management.\n` +
        `• **Git for Windows**: Version control for your models and training scripts.\n\n` +
        `You can select this bundle with 1 click below.`;
    } else if (latestMessage.includes('asm') || latestMessage.includes('assembly') || latestMessage.includes('low level') || latestMessage.includes('kernel') || latestMessage.includes('os')) {
      recommendedIds = ['nasm', 'gcc-mingw', 'neovim', 'windows-terminal'];
      reply = `For **Low-Level Assembly & OS Development**:\n\n` +
        `• **NASM**: Netwide Assembler for x86 and x86_64 architecture.\n` +
        `• **GCC / MinGW-w64**: Linker, C compiler, and objdump/objcopy binutils.\n` +
        `• **Neovim**: Ultra-responsive keyboard-centric editor with syntax highlighting.\n` +
        `• **Windows Terminal**: Run your emulator or cross-assembler commands with full UTF-8.\n\n` +
        `Check out this specialized low-level suite below!`;
    } else {
      // General recommended essentials
      recommendedIds = ['cursor', 'python', 'nodejs', 'git'];
      reply = `Hello! I'm your DevHub assistant. Based on modern developer workflows, here is the **Essential Modern Developer Pack**:\n\n` +
        `• **Cursor**: AI-native code editor.\n` +
        `• **Python 3**: Universal language for scripts, AI, and backend.\n` +
        `• **Node.js (LTS)**: Web and CLI runtime.\n` +
        `• **Git for Windows**: Source control foundation.\n\n` +
        `Tell me more about what you'd like to build (e.g., *"I want to make a C++ game"*, *"I need local LLMs for private coding"*, or *"I want to write Rust"*), and I'll tailor the exact stack for you!`;
    }

    const recommendedTools = catalog.filter(s => recommendedIds.includes(s.id));

    return NextResponse.json({
      reply,
      recommendedTools,
    });
  } catch (err: unknown) {
    console.error('Chat error:', err);
    return NextResponse.json({ error: 'AI Assistant failed to generate response.' }, { status: 500 });
  }
}
