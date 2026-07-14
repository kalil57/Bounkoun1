import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname } from "path";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Programmatically switch process context to this script's directory
process.chdir(__dirname);

// Load .env from workspace root if available
dotenv.config({ path: "../.env" });
dotenv.config(); // fallbacks

const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const username = "kalil57";
const repoName = "Bounkoun-Literature";

async function push() {
  if (!token) {
    console.error(`
❌ ERROR: GITHUB_TOKEN is not defined in your environment!
To push to github.com/${username}/${repoName}:
1. Configure GITHUB_TOKEN in your AI Studio 'Settings > Secrets' panel (add a token with 'repo' scope).
2. Or run this script locally with: GITHUB_TOKEN=your_token node push_to_github.js
    `);
    process.exit(1);
  }

  console.log(`🚀 Initializing push process for github.com/${username}/${repoName}...`);

  // 1. Create the repository via GitHub REST API if it doesn't exist
  try {
    console.log("🌐 Calling GitHub API to check/create repository...");
    const response = await fetch("https://api.github.com/user/repos", {
      method: "POST",
      headers: {
        "Authorization": `token ${token}`,
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: repoName,
        description: "Literature Microservice for Bounkoun System",
        private: false,
        auto_init: false
      })
    });

    if (response.status === 201) {
      console.log(`✅ Successfully created new repository: https://github.com/${username}/${repoName}`);
    } else if (response.status === 422) {
      console.log("ℹ️ Repository already exists on GitHub. Proceeding to push changes...");
    } else {
      const data = await response.json();
      console.warn(`⚠️ GitHub API responded with status ${response.status}:`, data.message);
    }
  } catch (error) {
    console.error("❌ Failed to call GitHub API:", error.message);
  }

  // 2. Initialize and configure Git locally inside Bounkoun-Literature
  try {
    console.log("🗄️ Initializing local Git repository...");
    execSync("git init", { stdio: "inherit" });
    
    console.log("⚙️ Configuring local git user info...");
    execSync(`git config user.name "${username}"`, { stdio: "inherit" });
    execSync(`git config user.email "kaliljamal57@gmail.com"`, { stdio: "inherit" });

    console.log("📂 Staging files...");
    execSync("git add .", { stdio: "inherit" });

    // Commit if there are changes
    try {
      console.log("💾 Committing files...");
      execSync('git commit -m "Initial Bounkoun Literature Service setup"', { stdio: "inherit" });
    } catch (e) {
      console.log("ℹ️ Nothing new to commit or already committed.");
    }

    console.log("🔗 Configuring remote origin...");
    // Remove origin if it already exists
    try {
      execSync("git remote remove origin", { stdio: "ignore" });
    } catch (e) {}

    const remoteUrl = `https://x-access-token:${token}@github.com/${username}/${repoName}.git`;
    execSync(`git remote add origin ${remoteUrl}`, { stdio: "ignore" });
    execSync("git branch -M main", { stdio: "inherit" });

    console.log("📤 Pushing to main branch...");
    execSync("git push -u origin main --force", { stdio: "inherit" });

    console.log(`\n🎉 SUCCESS! Entire "Bounkoun-Literature" service pushed to https://github.com/${username}/${repoName}`);
  } catch (error) {
    console.error("❌ Error during Git operations:", error.message);
    process.exit(1);
  }
}

push();
