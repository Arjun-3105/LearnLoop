<div align="center">

<img src="./public/hack.png" alt="Hackaccino" width="600" />

# LearnLoop

**Turn any YouTube video into a gauntlet. Pass it. Own the proof on-chain.**

<br/>

[![Next.js](https://img.shields.io/badge/Next.js_15-black?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-0f172a?style=flat-square&logo=typescript&logoColor=3178C6)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-0f172a?style=flat-square&logo=tailwindcss&logoColor=06B6D4)](https://tailwindcss.com)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-0f172a?style=flat-square&logo=framer&logoColor=white)](https://www.framer.com/motion)
[![React Flow](https://img.shields.io/badge/React_Flow-0f172a?style=flat-square&logo=react&logoColor=61DAFB)](https://reactflow.dev)

[![Claude 3.5](https://img.shields.io/badge/Claude_3.5_Sonnet-0f172a?style=flat-square&logo=anthropic&logoColor=D97757)](https://anthropic.com)
[![OpenRouter](https://img.shields.io/badge/OpenRouter-0f172a?style=flat-square&logo=openai&logoColor=7C3AED)](https://openrouter.ai)
[![Appwrite](https://img.shields.io/badge/Appwrite-0f172a?style=flat-square&logo=appwrite&logoColor=FD366E)](https://appwrite.io)
[![GitHub OAuth](https://img.shields.io/badge/GitHub_OAuth-0f172a?style=flat-square&logo=github&logoColor=white)](https://github.com)

[![Solidity](https://img.shields.io/badge/Solidity-0f172a?style=flat-square&logo=solidity&logoColor=white)](https://soliditylang.org)
[![Hardhat](https://img.shields.io/badge/Hardhat-0f172a?style=flat-square&logo=ethereum&logoColor=FFF100)](https://hardhat.org)
[![Ethereum](https://img.shields.io/badge/Sepolia_Testnet-0f172a?style=flat-square&logo=ethereum&logoColor=627EEA)](https://ethereum.org)
[![IPFS](https://img.shields.io/badge/IPFS_via_Pinata-0f172a?style=flat-square&logo=ipfs&logoColor=65C2CB)](https://pinata.cloud)
[![wagmi](https://img.shields.io/badge/wagmi_+_RainbowKit-0f172a?style=flat-square&logo=ethereum&logoColor=FF6B9D)](https://wagmi.sh)

<br/>

---

### Built at **Hackaccino** 🏆 &nbsp;·&nbsp; Team **Yonex**

<br/>

**Powered by**

<a href="https://appwrite.io" target="_blank">
  <img src="https://img.shields.io/badge/Appwrite-FD366E?style=for-the-badge&logo=appwrite&logoColor=white" alt="Appwrite" />
</a>
&nbsp;&nbsp;
<img src="https://img.shields.io/badge/Pradicy-1a1a2e?style=for-the-badge&logoColor=white" alt="Pradicy" />

</div>

---

## What Is LearnLoop?

Most people watch tutorials and forget everything within 48 hours.

**LearnLoop closes that gap.** Paste any YouTube educational video. The AI reads its transcript, builds a personalised learning path, assigns you a real coding challenge, grades your GitHub repo checkpoint by checkpoint — and if you pass, mints you a tamper-proof **ERC-721 Proof of Learning NFT** on Ethereum Sepolia.

No more passive watching. Every video becomes a gauntlet. Every pass becomes a credential.

---

## The Full Flow

```mermaid
flowchart TD
    A([🎬 Paste YouTube URL]) --> B[Fetch Transcript]
    B --> C{AI Educational\nContent Guard}
    C -- ❌ Not Educational --> D([🚫 Rejected with reason])
    C -- ✅ Passes --> E[AI Generation\n3 parallel pipelines]

    E --> F[🃏 Flip Flashcards\nquiz · code examples]
    E --> G[🗺️ Concept Map\nReact Flow graph]
    E --> H[📋 Coding Assignment\ncheckpoints · hint]

    G --> I[🧠 Feynman Workspace\nTeach it back to the AI]
    I --> J[Connect GitHub\nselect your repo]

    J --> K[⚡ Streaming Assessment\nSSE · file tree · security scan]
    K --> L{Score}
    L -- < 70 --> M([📊 Gap Report\nnext topic suggestion])
    L -- ≥ 70 ✓ --> N([🏅 PASSED])

    N --> O[Connect Web3 Wallet]
    O --> P[Pin metadata to IPFS]
    P --> Q[Mint ERC-721 SkillNFT\non Ethereum Sepolia]
    Q --> R([✨ Holographic NFT Card\nin Profile])

    style A fill:#1a1a2e,stroke:#06b6d4,color:#fff
    style D fill:#1a1a2e,stroke:#f43f5e,color:#f43f5e
    style N fill:#1a1a2e,stroke:#10b981,color:#10b981
    style R fill:#1a1a2e,stroke:#8b5cf6,color:#8b5cf6
    style M fill:#1a1a2e,stroke:#f59e0b,color:#f59e0b
    style C fill:#0f172a,stroke:#06b6d4,color:#fff
    style L fill:#0f172a,stroke:#06b6d4,color:#fff
    style E fill:#0f172a,stroke:#334155,color:#94a3b8
    style K fill:#0f172a,stroke:#334155,color:#94a3b8
```

---

## Core Features

### 🎬 AI Learning Path Generation
The moment you submit a URL, LearnLoop fetches the full video transcript and fires three parallel AI pipelines:

- **Flashcards** — flip-card deck with plain-English explanations, real code examples, and a mini quiz per card
- **Concept Map** — interactive React Flow graph showing which concepts depend on which, with edges flowing from fundamentals to advanced ideas
- **Coding Assignment** — scoped, beginner-friendly project brief with specific checkpoints, a starter idea, and an optional quiz

### 🛡️ Educational Content Guard
Every submitted URL is validated by AI before any generation begins. Music videos, vlogs, gaming streams, and entertainment are blocked — the rejection screen explains exactly why, so users know what to try instead. Only real learning content gets through.

### 🧠 Feynman Technique Workspace
For each concept node on the map, learners can open the Feynman workspace — a Socratic dialogue where you explain the concept back to the AI in your own words. The AI evaluates depth of understanding, identifies what's fuzzy, and keeps pushing until the concept genuinely clicks. Not a quiz. Not Q&A. A thinking partner.

### ⚡ Streaming Code Assessment
Connect with GitHub OAuth, pick any repo (public or private), and trigger the grader. Under the hood:

1. Walks the complete file tree, filters relevant source files
2. Runs a security scan — exposed secrets, dangerous patterns
3. **Streams live events over Server-Sent Events** → file discovered → checkpoint evaluated → AI verdict — the UI updates in real time like a terminal
4. Delivers a full scored report: checklist against every assignment checkpoint, strengths, gaps, and the recommended next topic

No waiting for a single response. You watch the grader think.

### 🏅 Proof of Learning NFT
Score ≥ 70 and connect a Web3 wallet. LearnLoop:

1. Encodes NFT metadata (topic, score, date, source URL) and pins it to IPFS via Pinata (falls back to `data:` URI if Pinata is unavailable)
2. Calls `mintSkillNFT(learnerAddress, ipfsURI)` on the deployed `SkillNFT` ERC-721 contract
3. Shows a holographic NFT card in your profile with a live Etherscan link

Every certificate is server-minted and on-chain. Nobody can forge a LearnLoop credential.

### 📚 Session History & Appwrite Caching
Every completed learning path is persisted to **Appwrite**. Click any session in the sidebar — flashcards, concept map, assignment, and assessment score load instantly from the database. Zero re-API calls, zero wait.

---

## Architecture

```
src/
├── app/
│   ├── dashboard/          ← YouTube URL input + landing
│   ├── learn/              ← Flashcards · Concept Map · Assignment
│   │   └── feynman/        ← Feynman Technique workspace
│   ├── assess/             ← GitHub connect · streaming code grader
│   ├── profile/            ← NFT collection · wallet · GitHub card
│   ├── history/            ← Past sessions from Appwrite
│   └── api/
│       ├── ingest/         ← Transcript fetch + educational validation
│       ├── flashcards/     ← AI flashcard generation
│       ├── concept-map/    ← AI concept dependency graph
│       ├── assignment/     ← AI coding assignment brief
│       ├── feynman/        ← Evaluate & re-explain endpoints
│       ├── assess-repo/
│       │   └── stream/     ← SSE streaming code assessment
│       ├── mint-nft/       ← IPFS pin + ERC-721 mint
│       └── auth/           ← GitHub OAuth flow
├── components/
│   ├── ConceptMap.tsx      ← React Flow interactive graph
│   ├── AssignmentCard.tsx  ← Assignment display card
│   ├── ReportModal.tsx     ← Assessment report overlay
│   └── learn/
│       └── LearnWorkspace.tsx ← Feynman dialogue UI
├── lib/
│   ├── openrouter.ts       ← OpenRouter / Claude API client
│   ├── github.ts           ← GitHub REST API helpers
│   ├── appwrite.ts         ← Session persistence (Appwrite)
│   ├── json.ts             ← Robust AI JSON parser (jsonrepair)
│   └── video-validator.ts  ← Educational content guard
└── hooks/
    ├── useGitHubAuth.ts
    └── useWallet.ts
contracts/
└── SkillNFT.sol            ← ERC-721 Proof of Learning contract
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, RSC) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + Framer Motion |
| AI Model | Claude 3.5 Sonnet via OpenRouter |
| Auth | GitHub OAuth — custom cookie-based |
| Database | **Appwrite** — session history & caching |
| Graph UI | React Flow |
| Blockchain | Solidity · Hardhat · Ethers.js |
| Network | Ethereum Sepolia testnet |
| NFT Storage | Pinata (IPFS) with data URI fallback |
| Web3 UI | wagmi · viem · RainbowKit |
| Streaming | Server-Sent Events (SSE) |

---

## Smart Contract

`SkillNFT.sol` is an ERC-721 contract built on OpenZeppelin's `ERC721URIStorage`. Only the deployer wallet (the backend server) can call `mintSkillNFT` — learners cannot self-mint. Every credential is AI-verified before the transaction fires.

Deployed on **Ethereum Sepolia** at `0x76655d5aF921198F64f3E9AeCd1f56D32acc21E0`.

---

## Sponsors

<table>
<tr>
<td align="center" width="200">
  <img src="https://appwrite.io/images/logos/appwrite.svg" width="120" alt="Appwrite" /><br/>
  <sub><b>Appwrite</b></sub><br/>
  <sub>Session persistence & real-time database</sub>
</td>
</tr>
</table>

---

<div align="center">

Built in **14 hours** at **Hackaccino** by **Team Yonex** · April 11, 2026

</div>
