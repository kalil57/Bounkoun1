import { spawn, ChildProcess } from "child_process";
import path from "path";

const PORT = 3009; // isolated port for running unit tests
const BASE_URL = `http://localhost:${PORT}`;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTests() {
  console.log("==================================================");
  console.log("🚀 STARTING BOUNKOUN CORE API UNIT TESTS");
  console.log("==================================================\n");

  let serverProcess: ChildProcess | null = null;

  try {
    // 1. Boot up the server on the test port in the background
    console.log(`📡 Spawning Bounkoun Core server on port ${PORT}...`);
    serverProcess = spawn("node", ["dist/server.cjs"], {
      env: { ...process.env, PORT: String(PORT), NODE_ENV: "production" },
      stdio: "inherit",
    });

    // Wait a brief period for the server to bind to the port
    await delay(2000);

    // 2. RUN TESTS
    let projectId = "";

    // Test 1: Project Creation (POST /projects)
    console.log("\n--------------------------------------------------");
    console.log("🧪 Test 1: Project Creation (POST /projects)");
    const createRes = await fetch(`${BASE_URL}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Dynamic Consensus in Heterogeneous Blockchains",
        discipline: "Computer Science",
        academic_level: "PhD",
        student_name: "Amadou Diallo",
        initial_idea: "Investigating leaderless consensus latency thresholds."
      }),
    });

    if (createRes.status !== 201) {
      throw new Error(`Expected status 201, got ${createRes.status}`);
    }

    const project = await createRes.json();
    projectId = project.id;
    console.log("✅ Project created successfully!");
    console.log(`   ID: ${project.id}`);
    console.log(`   Title: "${project.title}"`);
    console.log(`   Academic Level: ${project.academic_level}`);
    console.log(`   Status initialized to: "${project.status}"`);

    // Verify default workflow steps are created automatically
    const workflowRes = await fetch(`${BASE_URL}/projects/${projectId}/workflow`);
    const steps = await workflowRes.json();
    if (!Array.isArray(steps) || steps.length === 0) {
      throw new Error("Expected workflow steps to be initialized automatically, but got empty list.");
    }
    console.log(`✅ Default workflow steps verified! (Count: ${steps.length})`);
    steps.forEach((step: any, index: number) => {
      console.log(`   Step [${index + 1}]: "${step.step_name || step.title}" (Status: ${step.status})`);
    });


    // Test 2: Topic Suggestion (POST /projects/{id}/topic/suggest)
    console.log("\n--------------------------------------------------");
    console.log("🧪 Test 2: Topic Suggestion (POST /projects/{id}/topic/suggest)");
    const topicRes = await fetch(`${BASE_URL}/projects/${projectId}/topic/suggest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        interest: "Proof of Stake latency parameters"
      }),
    });

    if (topicRes.status !== 200) {
      throw new Error(`Expected status 200, got ${topicRes.status}`);
    }

    const topicSuggestions = await topicRes.json();
    if (!Array.isArray(topicSuggestions) || topicSuggestions.length === 0) {
      throw new Error("Expected suggested topics array, got empty or non-array.");
    }
    console.log(`✅ Suggested topics received! Count: ${topicSuggestions.length}`);
    topicSuggestions.forEach((t: string, index: number) => {
      console.log(`   Suggestion [${index + 1}]: "${t}"`);
    });


    // Test 3: Question Suggestion (POST /projects/{id}/question/suggest)
    console.log("\n--------------------------------------------------");
    console.log("🧪 Test 3: Question Suggestion (POST /projects/{id}/question/suggest)");
    
    // First, let's select a topic to enable better questions
    const selectedTopic = topicSuggestions[0];
    await fetch(`${BASE_URL}/projects/${projectId}/topic/select`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: selectedTopic }),
    });

    const questionRes = await fetch(`${BASE_URL}/projects/${projectId}/question/suggest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });

    if (questionRes.status !== 200) {
      throw new Error(`Expected status 200, got ${questionRes.status}`);
    }

    const questionSuggestions = await questionRes.json();
    if (!Array.isArray(questionSuggestions) || questionSuggestions.length === 0) {
      throw new Error("Expected suggested questions array, got empty or non-array.");
    }
    console.log(`✅ Suggested research questions received! Count: ${questionSuggestions.length}`);
    questionSuggestions.forEach((q: string, index: number) => {
      console.log(`   Suggestion [${index + 1}]: "${q}"`);
    });


    // Test 4: Workflow Completion (POST /projects/{id}/workflow/complete-step)
    console.log("\n--------------------------------------------------");
    console.log("🧪 Test 4: Workflow Completion (POST /projects/{id}/workflow/complete-step)");
    const completeRes = await fetch(`${BASE_URL}/projects/${projectId}/workflow/complete-step`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        step_name: "Literature"
      }),
    });

    if (completeRes.status !== 200) {
      throw new Error(`Expected status 200, got ${completeRes.status}`);
    }

    const completeResult = await completeRes.json();
    if (!completeResult.success || !completeResult.step.is_completed) {
      throw new Error("Expected step completion status to be true.");
    }
    console.log("✅ Workflow step 'Literature' marked completed successfully!");
    console.log(`   Step Name: "${completeResult.step.step_name}"`);
    console.log(`   is_completed: ${completeResult.step.is_completed}`);
    console.log(`   completed_at: ${completeResult.step.completed_at}`);


    // Test 5: Event Posting (POST /projects/{id}/events)
    console.log("\n--------------------------------------------------");
    console.log("🧪 Test 5: Event Posting (POST /projects/{id}/events)");
    const eventRes = await fetch(`${BASE_URL}/projects/${projectId}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: "question_finalized",
        payload: {
          question: "What is the leading PoS leader election latency factor?",
          confidence: "High"
        }
      }),
    });

    if (eventRes.status !== 201) {
      throw new Error(`Expected status 201, got ${eventRes.status}`);
    }

    const eventResult = await eventRes.json();
    if (!eventResult.success || !eventResult.event.id) {
      throw new Error("Expected event creation and logged confirmation.");
    }
    console.log("✅ Custom event posted and logged successfully!");
    console.log(`   Event ID: "${eventResult.event.id}"`);
    console.log(`   Event Type: "${eventResult.event.event_type}"`);
    console.log(`   Timestamp: "${eventResult.event.timestamp}"`);


    console.log("\n==================================================");
    console.log("🎉 ALL TESTS PASSED SUCCESSFULLY! 💯");
    console.log("==================================================");
    process.exit(0);

  } catch (error: any) {
    console.error("\n❌ TEST RUN FAILED!");
    console.error(error.message);
    console.log("==================================================");
    process.exit(1);
  } finally {
    if (serverProcess) {
      console.log("🔌 Stopping test server process...");
      serverProcess.kill();
    }
  }
}

runTests();
