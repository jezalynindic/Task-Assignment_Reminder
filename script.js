let tasks = [];
let historyTasks = [];
let remindedTasks = new Set();

// Load tasks and history from localStorage
if(localStorage.getItem("tasks")) tasks = JSON.parse(localStorage.getItem("tasks"));
if(localStorage.getItem("historyTasks")) historyTasks = JSON.parse(localStorage.getItem("historyTasks"));

// Initial rendering
renderTasks();
renderHistory();
updateProgress();
startCountdowns();

// ------------------ ADD TASK ------------------
function addTask(){
    const name = document.getElementById("taskInput").value.trim();
    const deadline = document.getElementById("deadlineInput").value;

    if(!name || !deadline){ 
        alert("Please enter task and deadline"); 
        return; 
    }

    tasks.push({name, deadline, status:"pending"});
    saveTasks();
    renderTasks();
    updateProgress();

    document.getElementById("taskInput").value="";
    document.getElementById("deadlineInput").value="";
}

// ------------------ SAVE ------------------
function saveTasks(){ localStorage.setItem("tasks", JSON.stringify(tasks)); }
function saveHistory(){ localStorage.setItem("historyTasks", JSON.stringify(historyTasks)); }

// ------------------ RENDER TASKS ------------------
function renderTasks(){
    const taskList = document.getElementById("taskList");
    taskList.innerHTML="";

    tasks.forEach((task,index)=>{
        const li = document.createElement("li");
        li.textContent = `${task.name} - Due: ${new Date(task.deadline).toLocaleString()}`;

        if(task.status=="done") li.classList.add("completed");
        if(task.status=="failed") li.classList.add("failed");

        // Countdown timer
        const timerSpan = document.createElement("span");
        li.appendChild(timerSpan);
        task.timerSpan = timerSpan;

        // Buttons
        const editBtn = document.createElement("button");
        editBtn.innerHTML = "✏️ Edit";
        editBtn.onclick = () => editTask(index);
        editBtn.className="edit";

        const doneBtn = document.createElement("button");
        doneBtn.innerHTML = "✅ Done";
        doneBtn.onclick = () => markDone(index);
        doneBtn.className="done";

        const deleteBtn = document.createElement("button");
        deleteBtn.innerHTML = "🗑️ Delete";
        deleteBtn.onclick = () => moveToHistory(index);
        deleteBtn.className="delete";

        li.appendChild(editBtn);
        li.appendChild(doneBtn);
        li.appendChild(deleteBtn);

        taskList.appendChild(li);
    });

    checkReminders();
}

// ------------------ EDIT TASK ------------------
function editTask(index){
    const task = tasks[index];
    const newName = prompt("Edit Task Name:", task.name);
    if(newName !== null && newName.trim() !== "") task.name = newName.trim();

    const newDeadline = prompt("Edit Deadline (yyyy-mm-ddThh:mm):", task.deadline);
    if(newDeadline !== null && newDeadline !== "") task.deadline = newDeadline;

    remindedTasks.delete(task.name); // reset reminder
    saveTasks();
    renderTasks();
    updateProgress();
}

// ------------------ MARK DONE ------------------
function markDone(index){
    const task = tasks[index];
    if(new Date(task.deadline) < new Date()){
        alert("Task is overdue and cannot be marked done!");
        task.status = "failed";
    } else task.status = "done";
    moveToHistory(index);
    updateProgress();
}

// ------------------ MOVE TO HISTORY ------------------
function moveToHistory(index){
    const task = tasks.splice(index,1)[0];
    historyTasks.push(task);
    saveTasks();
    saveHistory();
    renderTasks();
    renderHistory();
    updateProgress();
}

// ------------------ RENDER HISTORY ------------------
function renderHistory(){
    const historyList = document.getElementById("historyList");
    historyList.innerHTML = "";

    historyTasks.forEach((task,index)=>{
        const li = document.createElement("li");
        li.textContent = `${task.name} - Due: ${new Date(task.deadline).toLocaleString()}`;

        if(task.status=="done") li.classList.add("completed");
        if(task.status=="failed") li.classList.add("failed");

        const restoreBtn = document.createElement("button");
        restoreBtn.innerHTML = "🔄 Restore";
        restoreBtn.onclick = () => restoreTask(index);
        restoreBtn.className="restore";

        const deleteBtn = document.createElement("button");
        deleteBtn.innerHTML = "🗑️ Delete";
        deleteBtn.onclick = () => deleteHistory(index);
        deleteBtn.className="delete";

        li.appendChild(restoreBtn);
        li.appendChild(deleteBtn);

        historyList.appendChild(li);
    });
}

// ------------------ RESTORE HISTORY ------------------
function restoreTask(index){
    const task = historyTasks.splice(index,1)[0];
    task.status = "pending";
    tasks.push(task);
    saveTasks();
    saveHistory();
    renderTasks();
    renderHistory();
    updateProgress();
}

// ------------------ DELETE HISTORY ------------------
function deleteHistory(index){
    historyTasks.splice(index,1);
    saveHistory();
    renderHistory();
    updateProgress();
}

// ------------------ PROGRESS BAR ------------------
function updateProgress(){
    const total = tasks.length + historyTasks.length;
    const done = historyTasks.filter(t=>t.status=="done").length;
    const failed = historyTasks.filter(t=>t.status=="failed").length;
    const pending = tasks.length;

    const donePercent = total ? (done/total*100) : 0;
    const failedPercent = total ? (failed/total*100) : 0;
    const pendingPercent = total ? (pending/total*100) : 0;

    document.getElementById("progressDone").style.width = donePercent + "%";
    document.getElementById("progressOverdue").style.width = failedPercent + "%";
    document.getElementById("progressPending").style.width = pendingPercent + "%";
    document.getElementById("progressText").textContent = 
        `Done: ${donePercent.toFixed(1)}% | Overdue: ${failedPercent.toFixed(1)}% | Pending: ${pendingPercent.toFixed(1)}%`;
}

// ------------------ COUNTDOWN ------------------
function startCountdowns(){
    setInterval(()=>{
        const now = new Date();
        tasks.forEach(task=>{
            const deadline = new Date(task.deadline);
            const diff = deadline - now;
            if(diff <= 0) task.status = "failed";

            if(task.timerSpan){
                if(diff > 0){
                    const days = Math.floor(diff/1000/60/60/24);
                    const hours = Math.floor((diff/1000/60/60)%24);
                    const mins = Math.floor((diff/1000/60)%60);
                    const secs = Math.floor((diff/1000)%60);
                    task.timerSpan.textContent = `Time left: ${days}d ${hours}h ${mins}m ${secs}s`;
                } else task.timerSpan.textContent = "Task is due!";
            }
        });
        renderTasks();
        updateProgress();
    },1000);
}

// ------------------ REMINDERS ------------------
function checkReminders(){
    const now = new Date();
    const addBtn = document.getElementById("addTaskBtn");
    addBtn.disabled = true;
    addBtn.style.background = "#ccc";

    tasks.forEach(task=>{
        const deadline = new Date(task.deadline);
        const diff = deadline - now;

        if(diff <=0 && task.status!="failed"){
            alert(`Your task "${task.name}" is due now!`);
            task.status = "failed";
            remindedTasks.delete(task.name);
        }
        else if(diff>0 && diff<=24*60*60*1000 && !remindedTasks.has(task.name)){
            alert(`Reminder: Your task "${task.name}" is about to be due within 24 hours!`);
            remindedTasks.add(task.name);
        }
    });

    addBtn.disabled = false;
    addBtn.style.background = "linear-gradient(90deg,#9b59b6,#8e44ad)";
}

// ------------------ SEARCH (Tasks + History) ------------------
function searchTasks(){
    const filter = document.getElementById("searchInput").value.toLowerCase();

    // Filter active tasks
    const taskList = document.getElementById("taskList");
    const tasksLi = taskList.getElementsByTagName("li");
    Array.from(tasksLi).forEach(li=>{
        const text = li.textContent.toLowerCase();
        li.style.display = text.includes(filter) ? "" : "none";
    });

    // Filter history tasks
    const historyList = document.getElementById("historyList");
    const historyLi = historyList.getElementsByTagName("li");
    Array.from(historyLi).forEach(li=>{
        const text = li.textContent.toLowerCase();
        li.style.display = text.includes(filter) ? "" : "none";
    });
}
