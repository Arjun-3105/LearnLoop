# LearnLoop · AI Proof of Learning

Turn any YouTube video into a personalized, AI-powered learning challenge. Instantly generate flashcards, concept maps, coding assignments, and earn a Proof of Learning NFT on Polygon.

---

## 🚀 Features

- **AI Learning Engine**: Paste any YouTube link and get a complete learning path in seconds.
	- Flip-card flashcards
	- Interactive concept map
	- Personalized coding assignment

- **Live Code Assessment**: Connect GitHub, pick a repo, and get graded against every checkpoint automatically.
	- GitHub OAuth (supports private repos)
	- Checkpoint-by-checkpoint grading
	- Strengths & gaps breakdown

- **Proof of Learning NFT**: Pass the assessment and mint a tamper-proof ERC-721 credential on Polygon.
	- IPFS metadata storage
	- Polygon Mumbai chain
	- Permanently verifiable

---

## 📊 Quick Stats

- **< 30s** to generate learning path
- **10+** checkpoints evaluated
- **ERC-721** on-chain credential
- **100%** AI-graded, no bias

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React 19, TailwindCSS 4, Framer Motion
- **Backend**: Appwrite, Node.js, OpenAI, Pinata (IPFS)
- **Blockchain**: Solidity (ERC-721), Hardhat, Ethers.js, Polygon Mumbai
- **Other**: Mermaid.js (concept maps), Dagre, YouTube Transcript API

---

## ⚡ Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/learnloop.git
cd learnloop
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in:

- `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
- `YOUTUBE_API_KEY`
- `APP_URL`
- `NEXT_PUBLIC_APPWRITE_*` and `APPWRITE_API_KEY`
- `PINATA_API_KEY`, `PINATA_SECRET_KEY`, `PINATA_JWT`
- `RPC_URL`, `PRIVATE_KEY`, `NEXT_PUBLIC_CONTRACT_ADDRESS`

### 3. Run Locally

```bash
npm run dev
```
Visit [http://localhost:3000](http://localhost:3000).

---

## 📝 Usage

1. **Paste a YouTube URL**: Get instant flashcards, concept map, and assignment.
2. **Connect GitHub**: For code assessment and grading.
3. **Complete Assignment**: Get feedback and strengths/gaps.
4. **Mint NFT**: Claim your Proof of Learning credential on-chain.

---

## 🧩 Project Structure

- `src/app/` — Next.js routes and pages
- `src/components/` — UI components (flashcards, concept map, NFT card, etc.)
- `contracts/` — Solidity smart contracts (SkillNFT)
- `scripts/` — Deployment scripts
- `public/` — Static assets

---

## 🤝 Contributing

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/awesome-feature`)
3. Commit your changes
4. Push to the branch (`git push origin feature/awesome-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙋 Contact

- **Author**: [Your Name](mailto:your@email.com)
- **GitHub**: [https://github.com/yourusername/learnloop](https://github.com/yourusername/learnloop)

---

## 🏅 Badges

![Next.js](https://img.shields.io/badge/Next.js-16-blue)
![Polygon](https://img.shields.io/badge/Polygon-Mumbai-purple)
![Appwrite](https://img.shields.io/badge/Appwrite-cloud-pink)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT4-green)

---
