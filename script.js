let tasks = [];
let historyTasks = [];

// Track which tasks already showed a reminder
let remindedTasks = new Set();

if(localStorage.getItem("tasks")) tasks = JSON.parse(localStorage.getItem("tasks"));
if(localStorage.getItem("historyTasks")) historyTasks = JSON.parse(localStorage.getItem("historyTasks"));

renderTasks();
renderHistory();
updateProgress();
startCountdowns();

function addTask(){
    const name = document.getElementById("taskInput").value.trim();
    const deadline = document.getElementById("deadlineInput").value;
    if(!name || !deadline){ alert("Please enter task and deadline"); return; }

    tasks.push({name, deadline, status:"pending"});
    saveTasks();
    renderTasks();
    updateProgress();
    document.getElementById("taskInput").value="";
    document.getElementById("deadlineInput").value="";
}

function saveTasks(){ localStorage.setItem("tasks", JSON.stringify(tasks)); }
function saveHistory(){ localStorage.setItem("historyTasks", JSON.stringify(historyTasks)); }

function renderTasks(){
    const taskList = document.getElementById("taskList");
    taskList.innerHTML="";
    tasks.forEach((task,index)=>{
        const li=document.createElement("li");
        li.textContent=`${task.name} - Due: ${new Date(task.deadline).toLocaleString()}`;
        if(task.status=="done") li.classList.add("completed");
        if(task.status=="failed") li.classList.add("failed");

        const timerSpan = document.createElement("span");
        li.appendChild(timerSpan);
        task.timerSpan = timerSpan;

        const editBtn=document.createElement("button");
        editBtn.innerHTML="✏️ Edit"; editBtn.onclick=()=> editTask(index); editBtn.className="edit";

        const doneBtn=document.createElement("button");
        doneBtn.innerHTML="✅ Done"; doneBtn.onclick=()=> markDone(index); doneBtn.className="done";

        const deleteBtn=document.createElement("button");
        deleteBtn.innerHTML="🗑️ Delete"; deleteBtn.onclick=()=> moveToHistory(index); deleteBtn.className="delete";

        li.appendChild(editBtn);
        li.appendChild(doneBtn);
        li.appendChild(deleteBtn);

        taskList.appendChild(li);
    });

    checkReminders();
}

function editTask(index){
    const task=tasks[index];
    const newName = prompt("Edit Task Name:", task.name);
    if(newName !== null && newName.trim() !== "") task.name=newName.trim();
    const newDeadline = prompt("Edit Deadline (yyyy-mm-ddThh:mm):", task.deadline);
    if(newDeadline !== null && newDeadline !== "") task.deadline=newDeadline;
    saveTasks();
    renderTasks();
    updateProgress();
}

function markDone(index){
    const task=tasks[index];
    if(new Date(task.deadline)<new Date()){
        alert("Task is overdue and cannot be marked done!");
        task.status="failed";
    } else task.status="done";
    moveToHistory(index);
    updateProgress();
}

function moveToHistory(index){
    const task=tasks.splice(index,1)[0];
    historyTasks.push(task);
    saveTasks();
    saveHistory();
    renderTasks();
    renderHistory();
    updateProgress();
}

function renderHistory(){
    const historyList=document.getElementById("historyList");
    historyList.innerHTML="";
    historyTasks.forEach((task,index)=>{
        const li=document.createElement("li");
        li.textContent=`${task.name} - Due: ${new Date(task.deadline).toLocaleString()}`;
        if(task.status=="done") li.classList.add("completed");
        if(task.status=="failed") li.classList.add("failed");

        const restoreBtn=document.createElement("button");
        restoreBtn.innerHTML="🔄 Restore"; restoreBtn.onclick=()=> restoreTask(index); restoreBtn.className="restore";

        const deleteBtn=document.createElement("button");
        deleteBtn.innerHTML="🗑️ Delete"; deleteBtn.onclick=()=> deleteHistory(index); deleteBtn.className="delete";

        li.appendChild(restoreBtn);
        li.appendChild(deleteBtn);

        historyList.appendChild(li);
    });
}

function restoreTask(index){
    const task = historyTasks.splice(index,1)[0];
    task.status="pending";
    tasks.push(task);
    saveTasks();
    saveHistory();
    renderTasks();
    renderHistory();
    updateProgress();
}

function deleteHistory(index){
    historyTasks.splice(index,1);
    saveHistory();
    renderHistory();
    updateProgress();
}

function updateProgress(){
    const total = tasks.length + historyTasks.length;
    const done = historyTasks.filter(t=>t.status=="done").length;
    const failed = historyTasks.filter(t=>t.status=="failed").length;
    const pending = tasks.length;

    const donePercent = total ? (done/total*100) : 0;
    const failedPercent = total ? (failed/total*100) : 0;
    const pendingPercent = total ? (pending/total*100) : 0;

    document.getElementById("progressDone").style.width=donePercent+"%";
    document.getElementById("progressOverdue").style.width=failedPercent+"%";
    document.getElementById("progressPending").style.width=pendingPercent+"%";
    document.getElementById("progressText").textContent=`Done: ${donePercent.toFixed(1)}% | Overdue: ${failedPercent.toFixed(1)}% | Pending: ${pendingPercent.toFixed(1)}%`;
}

// ------------------ REMINDERS & COUNTDOWN ------------------
function startCountdowns(){
    setInterval(()=>{
        const now = new Date();
        tasks.forEach(task=>{
            const deadline = new Date(task.deadline);
            const diff = deadline - now;
            if(diff <= 0){
                task.status="failed"; 
            }
            if(task.timerSpan){
                if(diff>0){
                    const days=Math.floor(diff/1000/60/60/24);
                    const hours=Math.floor((diff/1000/60/60)%24);
                    const mins=Math.floor((diff/1000/60)%60);
                    const secs=Math.floor((diff/1000)%60);
                    task.timerSpan.textContent=`Time left: ${days}d ${hours}h ${mins}m ${secs}s`;
                } else task.timerSpan.textContent="Task is due!";
            }
        });
        renderTasks();
        updateProgress();
    },1000);
}

function checkReminders(){
    const now = new Date();
    const addBtn = document.getElementById("addTaskBtn");

    // Disable Add Task button while alert is active
    addBtn.disabled = true;
    addBtn.style.background = "#ccc";

    tasks.forEach(task=>{
        const deadline = new Date(task.deadline);
        const diff = deadline - now;

        // If task is overdue
        if(diff <=0 && task.status!="failed"){
            alert(`Your task "${task.name}" is due now!`);
            task.status="failed";
            remindedTasks.delete(task.name); // Reset reminder in case edited
        }
        // Reminder for 24-hour window
        else if(diff>0 && diff<=24*60*60*1000 && !remindedTasks.has(task.name)){
            alert(`Reminder: Your task "${task.name}" is about to be due within 24 hours!`);
            remindedTasks.add(task.name); // Only show once
        }
    });

    // Restore Add Task button after alert
    addBtn.disabled = false;
    addBtn.style.background = "linear-gradient(90deg,#9b59b6,#8e44ad)";
}