"""
Skill Assessment Quiz Router — Expanded question bank with difficulty levels
GET  /api/assessment/questions/{skill}  — Quiz questions for a skill
POST /api/assessment/evaluate           — Submit & score answers
GET  /api/assessment/available          — List available skills
"""
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import List, Dict, Optional
import random

from app.routers.auth import FAKE_USERS_DB, verify_token, security

router = APIRouter()

# Each question: id, q, options[4], ans(0-indexed), exp, difficulty, time_limit(sec)
QUESTIONS_DB: Dict[str, List[dict]] = {
    "Python": [
        {"id":"py1","q":"What is the output of `print(2 ** 10)`?","options":["20","100","1024","512"],"ans":2,"exp":"2**10 = 1024. The ** operator is Python's exponentiation operator.","difficulty":"Easy","time":20},
        {"id":"py2","q":"Which built-in function returns the number of items in a list?","options":["size()","count()","len()","length()"],"ans":2,"exp":"len() returns the number of items in any iterable.","difficulty":"Easy","time":15},
        {"id":"py3","q":"What does `list(set([1,1,2,3]))` produce?","options":["[1,1,2,3]","[1,2,3]","Error","{1,2,3}"],"ans":1,"exp":"set() removes duplicates; list() converts the set back to a list.","difficulty":"Easy","time":20},
        {"id":"py4","q":"Which keyword turns a regular function into a generator?","options":["return","yield","async","gen"],"ans":1,"exp":"yield suspends the function and returns a value, making it a generator.","difficulty":"Medium","time":25},
        {"id":"py5","q":"What is `*args` used for in a function definition?","options":["Dictionary kwargs","Variable positional args","Keyword-only args","Type hints"],"ans":1,"exp":"*args collects extra positional arguments into a tuple.","difficulty":"Medium","time":20},
        {"id":"py6","q":"What is the time complexity of looking up a key in a Python dict?","options":["O(n)","O(log n)","O(1) amortized","O(n²)"],"ans":2,"exp":"Dicts use hash tables — average O(1) for get/set operations.","difficulty":"Hard","time":30},
        {"id":"py7","q":"Which of these creates a shallow copy of a list?","options":["list.copy()","list[:]","list(list)","All of the above"],"ans":3,"exp":"All three methods create shallow copies — nested objects are still referenced.","difficulty":"Medium","time":25},
        {"id":"py8","q":"What does the `@property` decorator do?","options":["Defines a static method","Allows a method to be accessed like an attribute","Marks a method as abstract","Caches method results"],"ans":1,"exp":"@property lets you call a method without parentheses, like an attribute.","difficulty":"Hard","time":30},
    ],
    "JavaScript": [
        {"id":"js1","q":"What does `typeof null` return in JavaScript?","options":["null","undefined","object","string"],"ans":2,"exp":"A long-standing JS quirk: typeof null === 'object'. It's a bug kept for backward compatibility.","difficulty":"Medium","time":20},
        {"id":"js2","q":"Which method creates a shallow copy of an array?","options":["arr.clone()","arr.copy()","[...arr]","arr.dup()"],"ans":2,"exp":"The spread operator [...arr] creates a shallow copy of the array.","difficulty":"Easy","time":15},
        {"id":"js3","q":"What is the output of `0 == false`?","options":["false","true","TypeError","undefined"],"ans":1,"exp":"Loose equality (==) coerces types: 0 and false both become 0, so they're equal.","difficulty":"Medium","time":20},
        {"id":"js4","q":"What does `Promise.all([p1, p2])` do?","options":["Runs promises sequentially","Resolves when all resolve, rejects if any rejects","Resolves when first one resolves","Ignores rejections"],"ans":1,"exp":"Promise.all waits for ALL promises to resolve, or rejects on the first rejection.","difficulty":"Medium","time":25},
        {"id":"js5","q":"What is the difference between `let` and `var`?","options":["No difference","let is block-scoped, var is function-scoped","var is block-scoped, let is function-scoped","let is global, var is local"],"ans":1,"exp":"let has block scope; var has function scope and is hoisted to the top of the function.","difficulty":"Easy","time":20},
        {"id":"js6","q":"What does `Array.prototype.reduce()` return?","options":["A new array","A single accumulated value","Boolean","An object always"],"ans":1,"exp":"reduce() applies a function against an accumulator to reduce the array to a single value.","difficulty":"Medium","time":25},
        {"id":"js7","q":"What is event delegation?","options":["Removing event listeners","Attaching one listener to a parent to handle child events","Async event processing","Event bubbling prevention"],"ans":1,"exp":"Event delegation uses bubbling — one listener on the parent handles events from all children.","difficulty":"Hard","time":30},
        {"id":"js8","q":"What does `Object.freeze()` do?","options":["Deep freezes all nested objects","Prevents adding/changing/deleting properties","Only prevents deletion","Converts object to JSON"],"ans":1,"exp":"Object.freeze() makes an object immutable (shallow) — no add, change, or delete.","difficulty":"Hard","time":30},
    ],
    "Machine Learning": [
        {"id":"ml1","q":"What is overfitting in a ML model?","options":["Model performs well on all data","Model memorizes training data but fails on unseen data","Model is too simple to learn patterns","Model has no learnable parameters"],"ans":1,"exp":"Overfitting: high training accuracy but low test accuracy — model learned noise, not signal.","difficulty":"Easy","time":20},
        {"id":"ml2","q":"Which algorithm handles non-linearly separable data best?","options":["Linear Regression","Logistic Regression","SVM with RBF kernel","Naive Bayes"],"ans":2,"exp":"SVM with RBF (Gaussian) kernel maps data to higher dimensions to find linear separability.","difficulty":"Medium","time":25},
        {"id":"ml3","q":"What does k-fold cross-validation achieve?","options":["Only tests on a held-out set","Splits data k ways and trains/tests k times for robust evaluation","Only tunes hyperparameters","Increases model complexity automatically"],"ans":1,"exp":"K-fold gives more reliable generalization estimates than a single train-test split.","difficulty":"Medium","time":25},
        {"id":"ml4","q":"What is the purpose of L2 regularization (Ridge)?","options":["Increase model complexity","Penalize large weights to prevent overfitting","Speed up gradient descent","Remove features"],"ans":1,"exp":"L2 adds the sum of squared weights to the loss, pushing coefficients toward zero.","difficulty":"Medium","time":25},
        {"id":"ml5","q":"Which metric is most appropriate for highly imbalanced datasets?","options":["Accuracy","F1 Score","MSE","R-squared"],"ans":1,"exp":"F1 balances precision and recall — accuracy is misleading when classes are imbalanced.","difficulty":"Easy","time":20},
        {"id":"ml6","q":"What is the vanishing gradient problem?","options":["Gradients become too large","Gradients shrink exponentially in deep networks, halting learning","Model weights become negative","Loss function diverges"],"ans":1,"exp":"In deep networks, gradients shrink through backpropagation, making early layers learn very slowly.","difficulty":"Hard","time":35},
        {"id":"ml7","q":"What does a confusion matrix show?","options":["Model parameters","TP, FP, TN, FN counts for classification","Only accuracy","Training vs validation loss"],"ans":1,"exp":"A confusion matrix breaks down predictions: True/False Positives and True/False Negatives.","difficulty":"Easy","time":20},
        {"id":"ml8","q":"What is the purpose of dropout in neural networks?","options":["Speed up inference","Randomly deactivate neurons during training to prevent overfitting","Increase model capacity","Normalize activations"],"ans":1,"exp":"Dropout randomly zeroes neurons during training, forcing the network to learn redundant representations.","difficulty":"Hard","time":30},
    ],
    "SQL": [
        {"id":"sql1","q":"Which clause filters rows AFTER grouping?","options":["WHERE","HAVING","FILTER","LIMIT"],"ans":1,"exp":"HAVING filters aggregated results after GROUP BY; WHERE filters before aggregation.","difficulty":"Easy","time":20},
        {"id":"sql2","q":"What does INNER JOIN return?","options":["All rows from the left table","Only rows with matches in BOTH tables","All rows from both tables","Rows with no match"],"ans":1,"exp":"INNER JOIN returns only the intersection — rows that have a match in both tables.","difficulty":"Easy","time":15},
        {"id":"sql3","q":"What is the difference between COUNT(*) and COUNT(column)?","options":["No difference","COUNT(*) counts NULLs, COUNT(col) ignores NULLs","COUNT(col) counts NULLs","COUNT(*) is slower"],"ans":1,"exp":"COUNT(*) counts all rows; COUNT(column) skips NULL values in that column.","difficulty":"Medium","time":25},
        {"id":"sql4","q":"What constraint does a PRIMARY KEY enforce?","options":["Unique values only","Unique + NOT NULL","NOT NULL only","Auto-increment"],"ans":1,"exp":"PRIMARY KEY = UNIQUE + NOT NULL. Each table can have only one primary key.","difficulty":"Easy","time":15},
        {"id":"sql5","q":"Which statement retrieves only unique rows?","options":["SELECT ONLY","SELECT UNIQUE","SELECT DISTINCT","SELECT DIFFERENT"],"ans":2,"exp":"SELECT DISTINCT eliminates duplicate rows from the result set.","difficulty":"Easy","time":15},
        {"id":"sql6","q":"What does a LEFT JOIN do when there's no match?","options":["Excludes the row","Returns NULLs for right-table columns","Returns NULLs for left-table columns","Throws an error"],"ans":1,"exp":"LEFT JOIN keeps all left-table rows; unmatched right-table columns become NULL.","difficulty":"Medium","time":25},
        {"id":"sql7","q":"Which window function assigns a sequential rank with no gaps?","options":["RANK()","DENSE_RANK()","ROW_NUMBER()","NTILE()"],"ans":1,"exp":"DENSE_RANK() assigns consecutive ranks without gaps; RANK() leaves gaps after ties.","difficulty":"Hard","time":35},
        {"id":"sql8","q":"What is a CTE (Common Table Expression)?","options":["A permanent table","A temporary named result set defined with WITH","An index type","A stored procedure"],"ans":1,"exp":"CTEs (WITH clause) create a temporary named result set for cleaner, recursive queries.","difficulty":"Hard","time":30},
    ],
    "Docker": [
        {"id":"dk1","q":"What is a Docker image?","options":["A running container instance","A read-only template used to create containers","A network configuration","A persistent volume"],"ans":1,"exp":"Images are immutable templates; containers are running instances of those templates.","difficulty":"Easy","time":15},
        {"id":"dk2","q":"Which command lists all running containers?","options":["docker list","docker ps","docker ls","docker show"],"ans":1,"exp":"docker ps shows running containers; docker ps -a shows all (including stopped).","difficulty":"Easy","time":15},
        {"id":"dk3","q":"What does the EXPOSE instruction in a Dockerfile do?","options":["Opens a firewall port","Documents the port the container listens on","Maps a host port","Starts a network service"],"ans":1,"exp":"EXPOSE is documentation only. The -p flag in docker run actually maps the port.","difficulty":"Medium","time":25},
        {"id":"dk4","q":"What is the purpose of docker-compose?","options":["Building images only","Managing multi-container applications declaratively","Monitoring container metrics","Container security scanning"],"ans":1,"exp":"docker-compose.yml defines and runs multi-service apps with a single command.","difficulty":"Easy","time":20},
        {"id":"dk5","q":"What does `docker build -t myapp .` do?","options":["Runs a container","Builds an image from the Dockerfile in current directory","Pushes to Docker Hub","Lists containers"],"ans":1,"exp":"-t tags the image with a name; . tells Docker to use the current directory as build context.","difficulty":"Easy","time":20},
        {"id":"dk6","q":"What is the difference between CMD and ENTRYPOINT?","options":["No difference","ENTRYPOINT sets the executable; CMD provides default args","CMD sets the executable; ENTRYPOINT provides args","ENTRYPOINT runs on build, CMD on run"],"ans":1,"exp":"ENTRYPOINT defines the command; CMD provides default arguments that can be overridden.","difficulty":"Hard","time":35},
        {"id":"dk7","q":"What is a multi-stage Docker build used for?","options":["Running multiple containers","Reducing final image size by separating build and runtime stages","Building on multiple platforms","Caching layers"],"ans":1,"exp":"Multi-stage builds compile in a builder image, then copy only the output to a minimal runtime image.","difficulty":"Hard","time":35},
        {"id":"dk8","q":"What does docker volume do?","options":["Limits CPU usage","Persists data outside container lifecycle","Exposes ports","Creates a network"],"ans":1,"exp":"Volumes persist data independently of containers — data survives container restarts/removal.","difficulty":"Medium","time":25},
    ],
    "AWS": [
        {"id":"aws1","q":"What is Amazon S3 primarily used for?","options":["Running virtual machines","Object/file storage","Managed databases","DNS routing"],"ans":1,"exp":"S3 (Simple Storage Service) is an object store for files, images, backups, and static sites.","difficulty":"Easy","time":15},
        {"id":"aws2","q":"What does EC2 stand for?","options":["Elastic Cache Compute","Elastic Compute Cloud","Extended Cloud Computing","Enterprise Container Cloud"],"ans":1,"exp":"EC2 = Elastic Compute Cloud — virtual servers in the cloud.","difficulty":"Easy","time":15},
        {"id":"aws3","q":"What is the purpose of an IAM Role?","options":["Store passwords","Grant AWS service permissions without long-term credentials","Create VPCs","Monitor costs"],"ans":1,"exp":"IAM Roles grant temporary, credential-free permissions to AWS services (e.g., EC2 accessing S3).","difficulty":"Medium","time":25},
        {"id":"aws4","q":"What is Auto Scaling?","options":["Manually adding servers","Automatically adjusting capacity based on demand","Caching responses","Load balancing"],"ans":1,"exp":"Auto Scaling adds/removes EC2 instances automatically based on traffic or custom metrics.","difficulty":"Easy","time":20},
        {"id":"aws5","q":"What does Amazon RDS provide?","options":["Object storage","Managed relational database service","NoSQL database","CDN"],"ans":1,"exp":"RDS manages relational databases (MySQL, PostgreSQL, etc.) with automated backups and patching.","difficulty":"Easy","time":15},
        {"id":"aws6","q":"What is the difference between Security Groups and NACLs?","options":["No difference","Security Groups are stateful; NACLs are stateless","NACLs are stateful; Security Groups stateless","Both are stateless"],"ans":1,"exp":"Security Groups track connections (stateful); NACLs evaluate each packet independently (stateless).","difficulty":"Hard","time":35},
        {"id":"aws7","q":"What is AWS Lambda?","options":["A virtual machine service","Serverless function execution — no server management needed","A container orchestrator","A message queue"],"ans":1,"exp":"Lambda runs code in response to events without provisioning servers — pay only per invocation.","difficulty":"Medium","time":20},
        {"id":"aws8","q":"What does a CloudFormation template define?","options":["CI/CD pipeline","AWS infrastructure as code (declarative JSON/YAML)","Container images","Monitoring dashboards"],"ans":1,"exp":"CloudFormation lets you model and provision AWS resources using declarative templates.","difficulty":"Hard","time":30},
    ],
    "React": [
        {"id":"re1","q":"What is the virtual DOM in React?","options":["A real browser DOM","An in-memory representation of the real DOM for efficient diffing","A CSS framework","Server-side rendering"],"ans":1,"exp":"React's virtual DOM diffs the previous and new trees, then updates only changed parts in the real DOM.","difficulty":"Easy","time":20},
        {"id":"re2","q":"What does the useEffect hook do?","options":["Manages component state","Performs side effects after render (data fetching, subscriptions)","Memoizes computations","Creates context"],"ans":1,"exp":"useEffect runs after render — use it for API calls, subscriptions, and DOM manipulations.","difficulty":"Easy","time":20},
        {"id":"re3","q":"When does a component re-render?","options":["Never automatically","When state or props change","Only on page refresh","When CSS changes"],"ans":1,"exp":"React re-renders when state changes, props change, or a parent re-renders.","difficulty":"Easy","time":15},
        {"id":"re4","q":"What is the purpose of React.memo()?","options":["Memoize expensive calculations","Skip re-renders when props haven't changed","Cache API responses","Create context providers"],"ans":1,"exp":"React.memo() wraps a component and skips re-rendering if its props are shallowly equal.","difficulty":"Medium","time":25},
        {"id":"re5","q":"What does the `key` prop do in lists?","options":["Applies a CSS class","Helps React identify which items changed/added/removed","Sets element ID","Defines render order"],"ans":1,"exp":"Keys help React efficiently update lists by identifying each element uniquely across renders.","difficulty":"Easy","time":20},
        {"id":"re6","q":"What is the difference between controlled and uncontrolled components?","options":["No difference","Controlled: React manages value; Uncontrolled: DOM manages value","Uncontrolled use state; Controlled use refs","Controlled are class components"],"ans":1,"exp":"Controlled components store form state in React state; uncontrolled use refs to read DOM values.","difficulty":"Medium","time":30},
        {"id":"re7","q":"What does useCallback() optimize?","options":["State updates","Memoizes a function reference to prevent unnecessary re-renders of child components","API response caching","CSS calculations"],"ans":1,"exp":"useCallback returns a memoized function that only changes if dependencies change — prevents child re-renders.","difficulty":"Hard","time":35},
        {"id":"re8","q":"What is React Context used for?","options":["HTTP requests","Sharing state across the component tree without prop drilling","Routing","Animation"],"ans":1,"exp":"Context provides a way to pass data through the component tree without manually passing props at every level.","difficulty":"Medium","time":25},
    ],
    "Git": [
        {"id":"git1","q":"What does `git rebase` do?","options":["Merges branches with a merge commit","Moves or replays commits onto a different base","Resets the working tree","Deletes remote branches"],"ans":1,"exp":"Rebase re-applies commits on top of another branch, creating a linear history.","difficulty":"Hard","time":35},
        {"id":"git2","q":"What is the difference between `git merge` and `git rebase`?","options":["No difference","Merge preserves history with a merge commit; rebase rewrites history to be linear","Rebase is safer","Merge is only for remote branches"],"ans":1,"exp":"Merge creates a merge commit preserving history; rebase rewrites commits for a cleaner linear history.","difficulty":"Hard","time":35},
        {"id":"git3","q":"What does `git stash` do?","options":["Deletes uncommitted changes","Temporarily saves uncommitted changes so you can switch branches","Creates a new branch","Commits all changes"],"ans":1,"exp":"git stash shelves your changes, leaving a clean working directory. Use git stash pop to restore.","difficulty":"Medium","time":25},
        {"id":"git4","q":"What is a fast-forward merge?","options":["A merge that skips CI","When the target branch can be updated by moving the pointer forward (no divergence)","A merge with --force","An automatic conflict resolution"],"ans":1,"exp":"Fast-forward happens when one branch is directly ahead — no merge commit needed, pointer just moves.","difficulty":"Medium","time":30},
        {"id":"git5","q":"What does `git cherry-pick` do?","options":["Picks the best branch","Applies a specific commit from another branch onto the current branch","Reverts a commit","Lists commits"],"ans":1,"exp":"cherry-pick lets you apply a single commit from any branch to your current branch.","difficulty":"Medium","time":25},
        {"id":"git6","q":"What is `HEAD` in Git?","options":["The first commit","A pointer to the current commit/branch you're working on","The remote origin","The staging area"],"ans":1,"exp":"HEAD points to your current position in the repo — usually the latest commit of the checked-out branch.","difficulty":"Easy","time":20},
        {"id":"git7","q":"What does `git reset --hard HEAD~1` do?","options":["Creates a new commit reverting changes","Moves HEAD back 1 commit and discards all changes in working tree","Only moves HEAD, keeps changes staged","Deletes the branch"],"ans":1,"exp":"--hard resets HEAD, the index, AND the working tree. Changes are permanently discarded.","difficulty":"Hard","time":35},
        {"id":"git8","q":"What is the purpose of `.gitignore`?","options":["Ignore Git errors","Specify files/patterns Git should not track","Block pushes","Set permissions"],"ans":1,"exp":".gitignore lists files/patterns (like node_modules, .env) that Git should never track or commit.","difficulty":"Easy","time":15},
    ],
    "System Design": [
        {"id":"sd1","q":"What is horizontal scaling?","options":["Making a single server more powerful","Adding more servers to distribute load","Increasing RAM","Upgrading CPU"],"ans":1,"exp":"Horizontal scaling (scale out) adds more machines; vertical scaling (scale up) adds resources to one machine.","difficulty":"Easy","time":20},
        {"id":"sd2","q":"What is the CAP theorem?","options":["A caching strategy","Distributed systems can guarantee only 2 of: Consistency, Availability, Partition tolerance","A load balancing algorithm","A database indexing method"],"ans":1,"exp":"CAP theorem: in a distributed system you must trade off between Consistency, Availability, and Partition tolerance.","difficulty":"Hard","time":35},
        {"id":"sd3","q":"What is a CDN used for?","options":["Database replication","Serving static assets from servers geographically close to users","Microservice orchestration","Message queuing"],"ans":1,"exp":"CDNs cache and serve static content (images, JS, CSS) from edge servers near the user, reducing latency.","difficulty":"Easy","time":20},
        {"id":"sd4","q":"What is the purpose of a message queue (e.g., Kafka, RabbitMQ)?","options":["Direct API calls","Decouples producers and consumers for async, reliable communication","Caches database queries","Balances HTTP traffic"],"ans":1,"exp":"Message queues allow asynchronous communication — producers send messages without waiting for consumers.","difficulty":"Medium","time":30},
        {"id":"sd5","q":"What is database sharding?","options":["Replicating a database","Partitioning data across multiple databases for horizontal scaling","Indexing all columns","Caching query results"],"ans":1,"exp":"Sharding splits a large dataset across multiple database instances — each shard holds a subset of data.","difficulty":"Hard","time":35},
        {"id":"sd6","q":"What is the difference between SQL and NoSQL databases?","options":["NoSQL is always faster","SQL uses structured schemas/ACID transactions; NoSQL is flexible schema for scale/speed","SQL can't scale","NoSQL supports SQL queries"],"ans":1,"exp":"SQL: structured, relational, ACID. NoSQL: flexible schema, horizontal scale, eventual consistency trade-offs.","difficulty":"Medium","time":25},
        {"id":"sd7","q":"What is a load balancer?","options":["A database type","Distributes incoming traffic across multiple servers for availability and performance","A caching layer","A firewall"],"ans":1,"exp":"Load balancers distribute requests across server pools, ensuring no single server is overwhelmed.","difficulty":"Easy","time":20},
        {"id":"sd8","q":"What is eventual consistency?","options":["Data is always immediately consistent","Given no new updates, all nodes will eventually have the same data","Data is never consistent","A SQL property"],"ans":1,"exp":"Eventual consistency: in distributed systems, updates propagate asynchronously — all nodes converge over time.","difficulty":"Hard","time":35},
    ],
}

class SubmitAnswers(BaseModel):
    skill: str
    answers: List[int]  # 0-indexed option selected

@router.get("/questions/{skill}", summary="Get quiz questions for a skill")
def get_questions(skill: str, shuffle: bool = True):
    key = next((k for k in QUESTIONS_DB if k.lower() == skill.lower()), None)
    if not key:
        raise HTTPException(404, f"Skill '{skill}' not found. Available: {list(QUESTIONS_DB.keys())}")
    qs = list(QUESTIONS_DB[key])
    if shuffle:
        random.shuffle(qs)
    questions = [
        {"id": q["id"], "question": q["q"], "options": q["options"],
         "difficulty": q["difficulty"], "time_limit": q["time"]}
        for q in qs
    ]
    return {"skill": key, "total": len(questions), "questions": questions}

@router.post("/evaluate", summary="Submit quiz answers and get score")
def evaluate_assessment(submission: SubmitAnswers, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    key = next((k for k in QUESTIONS_DB if k.lower() == submission.skill.lower()), None)
    if not key:
        raise HTTPException(404, f"Skill '{submission.skill}' not found.")
    questions = QUESTIONS_DB[key]
    if len(submission.answers) != len(questions):
        raise HTTPException(400, f"Expected {len(questions)} answers, got {len(submission.answers)}.")

    results, correct = [], 0
    by_difficulty = {"Easy": {"correct": 0, "total": 0}, "Medium": {"correct": 0, "total": 0}, "Hard": {"correct": 0, "total": 0}}

    for q, ans in zip(questions, submission.answers):
        is_correct = ans == q["ans"]
        if is_correct:
            correct += 1
        diff = q.get("difficulty", "Medium")
        by_difficulty[diff]["total"] += 1
        if is_correct:
            by_difficulty[diff]["correct"] += 1
        results.append({
            "id": q["id"],
            "correct": is_correct,
            "your_answer": q["options"][ans] if 0 <= ans < len(q["options"]) else "Skipped",
            "correct_answer": q["options"][q["ans"]],
            "explanation": q["exp"],
            "difficulty": diff,
        })

    pct = (correct / len(questions)) * 100
    level = "Expert" if pct >= 90 else ("Advanced" if pct >= 75 else ("Intermediate" if pct >= 55 else "Beginner"))
    badge = "🏆 Gold" if pct >= 90 else ("🥈 Silver" if pct >= 75 else ("🥉 Bronze" if pct >= 55 else "📚 Keep Learning"))

    res = {
        "skill": key, "score": pct, "correct": correct, "total": len(questions),
        "level": level, "badge": badge, "passed": pct >= 60,
        "results": results, "by_difficulty": by_difficulty,
        "message": f"You scored {pct:.0f}% — {level}",
    }

    if credentials:
        email = verify_token(credentials.credentials)
        if email and email in FAKE_USERS_DB:
            user = FAKE_USERS_DB[email]
            if "assessment_scores" not in user:
                user["assessment_scores"] = {}
            user["assessment_scores"][key] = pct
            if "skills_assessed" not in user:
                user["skills_assessed"] = []
            if key not in user["skills_assessed"]:
                user["skills_assessed"].append(key)

    return res

@router.get("/available", summary="List all available quiz skills with metadata")
def available_skills():
    meta = {
        skill: {
            "question_count": len(qs),
            "difficulties": list({q["difficulty"] for q in qs}),
            "avg_time": round(sum(q["time"] for q in qs) / len(qs)),
        }
        for skill, qs in QUESTIONS_DB.items()
    }
    return {"skills": list(QUESTIONS_DB.keys()), "total": len(QUESTIONS_DB), "meta": meta}
