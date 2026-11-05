# Part B: Video Recording Guide (10–15 Minutes, Face on Camera)

This guide provides an exact, word-for-word walkthrough and outline to record your **10–15 minute evaluation video**.

---

## Video Breakdown & Timeline

| Time Segment | Topic | Purpose |
|---|---|---|
| **0:00 – 3:00** | **Introduction & Architecture** | Explain the problem, tech stack choices (FastAPI + React + LangChain RAG), and why this architecture was chosen. |
| **3:00 – 8:00** | **Live Tool Demonstration** | Run the app on screen from start to finish, show the reading material input, generate questions, review/edit cards, and export tagged XML. |
| **8:00 – 13:00** | **Instructor Teaching Demo** | Teach one core concept from the reading material (*Python Functions: Default Arguments & Local vs Global Scope*) as if teaching beginners. |
| **13:00 – 14:30** | **Wrap Up & Submission** | Summarize trade-offs, architecture strengths, and conclude. |

---

## Segment 1: Introduction & Architecture (0:00 – 3:00)

### Visual Setup
- Camera: Face visible (e.g., webcam circle in Loom or Picture-in-Picture).
- Screen: Showing VS Code with project structure and architecture diagram, or the web app interface.

### Speaking Script / Talking Points

> *"Hello everyone! My name is [Your Name], and today I am presenting my solution for the AI Full-Stack Software Development Instructor assignment.*
>
> *The problem we are solving is: Content reviewers receive educational reading material and need to produce a strictly grounded five-question assessment group—specifically 2 Theory MCQs, 2 True/False, and 1 Code-Analysis question in a standardized tagged format. Crucially, any question that tests something the material does not actually teach is a failed question.*
>
> *To solve this cleanly, simply, and reliably, I built this full-stack tool with three core components:*
> 1. *Backend: **Python with FastAPI**, managed using **uv** for ultra-fast, reproducible dependency management.*
> 2. *RAG Pipeline: **LangChain**, utilizing `MarkdownHeaderTextSplitter` and `RecursiveCharacterTextSplitter`. Instead of fragile post-hoc regular expressions, our grounding mechanism is built into the RAG architecture: reading material is parsed into structured section chunks, and the model is strictly constrained to generate from retrieved chunks, attaching exact source chunk citations to every question.*
> 3. *Frontend: **React with Vite**, built with a split-screen reviewer workspace: the reading material on the left, and 5 interactive, editable reviewer cards on the right with an instant XML tagged format exporter.*
> 4. *AI Engine: **Google Gemini API** via LangChain's `ChatGoogleGenerativeAI`, paired with a graceful offline demonstration fallback so the app works seamlessly anywhere.*
>
> *Let's jump straight into the live demonstration!"*

---

## Segment 2: Live Tool Demonstration (3:00 – 8:00)

### Step 1: Launching the App
Show terminal:
```bash
# Terminal 1: Backend
cd backend
uv run uvicorn main:app --port 8000 --reload

# Terminal 2: Frontend
cd frontend
npm run dev
```
Open browser at `http://localhost:5173`.

### Step 2: Walkthrough on Screen
1. **Show the Reading Material Pane (Left Side)**:
   > *"On the left side, we have our reading material editor. We have pre-loaded a comprehensive lesson on **Python Functions: Arguments, Return Values, and Scope**. Reviewers can also upload any `.md` file or paste custom content. When loaded, LangChain's markdown splitter automatically parses the material into structured chunks."*

2. **Generate Questions**:
   - Click the blue **"Generate 5 Questions"** button.
   > *"Now I click 'Generate 5 Questions'. In the backend, LangChain processes the chunks, retrieves relevant sections, and sends them to Gemini with a strict schema constraint."*

3. **Inspect the 5 Generated Questions (Right Side)**:
   > *"Within seconds, the reviewer workspace populates with exactly one five-question group:"*
   - **Question 1 (Theory MCQ 1)**: Explain how it tests default argument ordering. Highlight the badge: `[RAG Source Chunk: ## 1. Defining Functions and Arguments]` and the verbatim quote.
   - **Question 2 (Theory MCQ 2)**: Explain how it tests the `global` keyword and scope shadowing. Show the source quote.
   - **Question 3 & 4 (True / False)**: Show that one is True (implicit `None` return) and the other is False (accessing local variables globally).
   - **Question 5 (Code Analysis)**: Point out the syntax-highlighted code block containing `reset()` and variable shadowing, and explain the trace.

4. **Demonstrate Reviewer Editing & Approval**:
   - Click the **"Edit"** button on Question 1.
   - Change a wording or tweak an option.
   - Click **"Save Changes"**.
   - Click **"Approve"** on each question, or click **"Approve All"** (notice counter updates to `5 / 5 Approved`).
   > *"The assignment emphasizes that the reviewer must judge whether each question is good and correct it before export. Here, the reviewer can edit prompts, adjust distractors, change correct answers, and approve questions."*

5. **Tagged Format Export**:
   - Click the **"Tagged Output (XML)"** tab.
   > *"Once approved, the reviewer switches to the Tagged Output tab. Here is the clean, standardized XML format containing question IDs, types, prompt CDATA blocks, options with correctness attributes, explanations, and RAG source quotes. We have one-click 'Copy XML' and 'Download XML' buttons ready for content ingestion."*

---

## Segment 3: Concept Teaching Demo (8:00 – 13:00)

### Instructor Persona
- Friendly, clear, pedagogical, speaking directly to beginner students.
- Concept: **Python Functions: Default Arguments and Local vs Global Scope**.

### Teaching Script

> *"Now, let's step into the classroom! Imagine you are a beginner Python student. Let's learn one of the most critical concepts in Python: **Default Arguments and Variable Scope**.*
>
> *(Show the reading material section on screen or point to the code)*
>
> #### 1. What is a Default Argument?
> *When we define a function in Python, we often want certain parameters to be optional. For instance:*
> ```python
> def greet(name, greeting="Hello"):
>     return f"{greeting}, {name}!"
> ```
> *Here, `name` is a **positional parameter**—you must pass it. But `greeting` has a default value of `"Hello"`.*
>
> *If I call `greet("Alice")`, it uses the default and returns `"Hello, Alice!"`.*
> *If I call `greet("Bob", "Good morning")`, it overrides the default and returns `"Good morning, Bob!"`.*
>
> *🚨 **Golden Rule**: In Python, parameters with default values must ALWAYS follow parameters without defaults. Writing `def greet(greeting="Hello", name):` is a `SyntaxError` because Python wouldn't know which value belongs to which parameter!*
>
> #### 2. Variable Scope: Local vs Global
> *Now, where do variables live? In Python, we have **Local Scope** and **Global Scope**.*
>
> *Look at this snippet from our material:*
> ```python
> counter = 10  # Global variable
>
> def reset():
>     counter = 0  # What does this do?
>
> reset()
> print(counter)
> ```
> *What will `print(counter)` display? Will it print 0 or 10?*
>
> *Many beginners think it prints 0. But it actually prints **10**! Why?*
>
> *Because inside `reset()`, Python sees `counter = 0` and assumes you are creating a **brand new local variable** that shadows the global one! When `reset()` finishes running, its local scope is destroyed.*
>
> *If you genuinely want to modify the global `counter` inside the function, you must explicitly declare:*
> ```python
> def increment():
>     global counter
>     counter += 1
> ```
> *The `global` keyword tells Python: 'Don't create a local variable; reach out to the module level and update the global counter!'*
>
> *That is why our Code-Analysis question tests this exact subtlety—it ensures students don't fall into the common variable shadowing pitfall!"*

---

## Segment 4: Wrap-Up & Conclusion (13:00 – 14:30)

> *"To summarize:*
> - *We built a lightweight, robust workflow using FastAPI, LangChain RAG, and React.*
> - *We solved the grounding challenge by design: chunking the reading material and constraining generation to retrieved sections with explicit citations.*
> - *We empowered human reviewers with an interactive split-screen interface to inspect, edit, approve, and export the standardized XML.*
>
> *The repository contains complete documentation, reproducible environment setup with `uv`, and unit tests. Thank you so much for watching!"*

---

## Quick Recording Checklist Before Hitting Record
- [ ] Backend running (`uv run uvicorn main:app --port 8000`)
- [ ] Frontend running (`npm run dev` at `http://localhost:5173`)
- [ ] Webcam and microphone checked
- [ ] Browser window zoomed to ~110% for clear readability
- [ ] Ready to record via Loom or OBS!
