 import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-analytics.js";
  import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    signInWithPopup,
    GoogleAuthProvider,
    sendPasswordResetEmail
  } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
  import {
    getDatabase,
    ref,
    push,
    onChildAdded,
    set,
    onValue
  } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

  // Firebase config
  const firebaseConfig = {
    apiKey: "AIzaSyDSxWiOTMttD-i03bR7rC2r6v_YaQWYxfg",
    authDomain: "auth-cb241.firebaseapp.com",
    databaseURL: "https://auth-cb241-default-rtdb.firebaseio.com",
    projectId: "auth-cb241",
    storageBucket: "auth-cb241.appspot.com",
    messagingSenderId: "492498613351",
    appId: "1:492498613351:web:34f55ead517283e31ed0c2",
    measurementId: "G-PBJN4Q3GTT"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
  const db = getDatabase(app);
  const auth = getAuth(app);
  const provider = new GoogleAuthProvider();

  // Wait for DOM to load
  window.addEventListener("DOMContentLoaded", () => {
    // SIGN UP
    const signupBtn = document.getElementById("SignUpbtn");
    if (signupBtn) {
      signupBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const email = document.getElementById("Signup").value.trim();
        const password = document.getElementById("Password").value.trim();

        if (!email || !password) return alert("Please fill in all fields");

        createUserWithEmailAndPassword(auth, email, password)
          .then(() => {
            alert("Signup Successfully !! ✅ ");
            window.location.href = "index2.html";
          })
          .catch((error) => {
            alert(error.message);
          });
      });
    }

    // LOGIN
    const loginBtn = document.getElementById("loginbtn");
    if (loginBtn) {
      loginBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const email = document.getElementById("loginemail").value.trim();
        const password = document.getElementById("loginpassword").value.trim();

        if (!email || !password) return alert("Please fill in all fields");

        signInWithEmailAndPassword(auth, email, password)
          .then(() => {
            alert("Login successful!");
            window.location.href = "index2.html";
          })
          .catch((error) => {
            alert(error.message);
          });
      });
    }

    // GOOGLE LOGIN
    const googleBtn = document.getElementById("GoogleBtn");
    if (googleBtn) {
      googleBtn.addEventListener("click", (e) => {
        e.preventDefault();
        signInWithPopup(auth, provider)
          .then(() => {
            alert("Google login successful!");
            window.location.href = "index.html";
          })
          .catch((error) => {
            alert(error.message);
          });
      });
    }

    // LOGOUT
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        signOut(auth)
          .then(() => {
            alert("Logout successful!");
            window.location.href = "index.html";
          })
          .catch((error) => {
            alert(error.message);
          });
      });
    }

    // PASSWORD RESET
    const resetPasswordLink = document.getElementById("reset-password-link");
    if (resetPasswordLink) {
      resetPasswordLink.addEventListener("click", (e) => {
        e.preventDefault();
        const email = prompt("Enter your email for password reset:");
        if (email) {
          sendPasswordResetEmail(auth, email.trim())
            .then(() => {
              alert("Password reset email sent! Check your inbox.");
            })
            .catch((error) => {
              alert(error.message);
            });
        } else {
          alert("Please enter a valid email address.");
        }
      });
    }
  });


// Chat message listener
onChildAdded(ref(db, "messages"), function (snapshot) {
  let data = snapshot.val();
  let messageBox = document.getElementById("messages");
  let msgElement = document.createElement("p");
  msgElement.textContent = data.name + " : " + data.text;
  messageBox.appendChild(msgElement);
  messageBox.scrollTop = messageBox.scrollHeight;
});

// Send message
window.sendMessage = function () {
  let username = document.getElementById('taskTitle').value;
  let message = document.getElementById('taskDesc').value;
  if (username === "" || message === "") return;

  push(ref(db, "messages"), {
    name: username,
    text: message
  });

  document.getElementById('taskDesc').value = ""; // Clear message input
};

// Task logic
let taskId = 0;

// Load tasks from Firebase
onValue(ref(db, "tasks"), (snapshot) => {
  document.querySelectorAll(".task-item").forEach(item => item.remove()); 

  snapshot.forEach(child => {
    const task = child.val();
    renderTask(task);
    if (task.id > taskId) taskId = task.id;
  });
});

// Add task
window.addTask = function () {
  const title = document.getElementById("taskTitle").value.trim();
  const desc = document.getElementById("taskDesc").value.trim();
  const date = document.getElementById("taskDate").value;

  if (!title || !desc || !date) {
    alert("Please fill in all fields");
    return;
  }

  const task = {
    id: ++taskId,
    title,
    desc,
    date,
    status: "pending"
  };

  set(ref(db, "tasks/" + task.id), task); // No renderTask() here — Firebase will handle it
  clearForm();
};

// Render a task in UI
function renderTask(task) {
  const listId = `${task.status}Tasks`;
  const taskList = document.getElementById(listId);

  const li = document.createElement("li");
  li.className = "task-item";
  li.setAttribute("id", `task-${task.id}`);
  li.setAttribute("draggable", "true");
  li.setAttribute("data-id", task.id);
  li.setAttribute("data-status", task.status);
  li.ondragstart = (e) => drag(e);

  li.innerHTML = `
    <strong>${task.title}</strong>
    <p>${task.desc}</p>
    <small>Due: ${task.date}</small>
    <div class="task-status">${capitalize(task.status)}</div>
    <div class="task-actions">
      ${task.status !== "done" ? `<button onclick="moveTask(${task.id})">Next</button>` : ""}
      <button onclick="deleteTask(${task.id})">Delete</button>
    </div>
  `;

  taskList.appendChild(li);
}

// Clear form
function clearForm() {
  document.getElementById("taskTitle").value = "";
  document.getElementById("taskDesc").value = "";
  document.getElementById("taskDate").value = "";
}

// Delete task
window.deleteTask = function (id) {
  const task = document.getElementById(`task-${id}`);
  if (task) task.remove();

  // Firebase delete (optional)
  set(ref(db, "tasks/" + id), null);
};

// Move task to next column
window.moveTask = function (id) {
  const task = document.getElementById(`task-${id}`);
  const currentStatus = task.getAttribute("data-status");

  const nextStatus = currentStatus === "pending"
    ? "inprogress"
    : currentStatus === "inprogress"
      ? "done"
      : null;

  if (nextStatus) {
    task.setAttribute("data-status", nextStatus);
    task.querySelector(".task-status").textContent = capitalize(nextStatus);
    document.getElementById(`${nextStatus}Tasks`).appendChild(task);

    if (nextStatus === "done") {
      task.querySelector("button[onclick^='moveTask']").remove();
    }

    // Update in Firebase
    const updatedTask = {
      id: parseInt(task.getAttribute("data-id")),
      title: task.querySelector("strong").textContent,
      desc: task.querySelector("p").textContent,
      date: task.querySelector("small").textContent.replace("Due: ", ""),
      status: nextStatus
    };
    set(ref(db, "tasks/" + updatedTask.id), updatedTask);
  }
};

// Capitalize first letter
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Drag & Drop
window.allowDrop = function (e) {
  e.preventDefault();
};

window.drag = function (e) {
  e.dataTransfer.setData("text", e.target.id);
};

window.drop = function (e) {
  e.preventDefault();
  const id = e.dataTransfer.getData("text");
  const task = document.getElementById(id);
  const target = e.target.closest(".task-column");
  const status = target.id;

  task.setAttribute("data-status", status);
  task.querySelector(".task-status").textContent = capitalize(status);
  document.getElementById(`${status}Tasks`).appendChild(task);

  if (status === "done") {
    const btn = task.querySelector("button[onclick^='moveTask']");
    if (btn) btn.remove();
  }

  const updatedTask = {
    id: parseInt(task.getAttribute("data-id")),
    title: task.querySelector("strong").textContent,
    desc: task.querySelector("p").textContent,
    date: task.querySelector("small").textContent.replace("Due: ", ""),
    status: status
  };
  set(ref(db, "tasks/" + updatedTask.id), updatedTask);
};

// Task search
window.searchTasks = function () {
  const input = document.getElementById("searchInput").value.toLowerCase();
  const tasks = document.querySelectorAll(".task-item");

  tasks.forEach(task => {
    const title = task.querySelector("strong").textContent.toLowerCase();
    const desc = task.querySelector("p").textContent.toLowerCase();
    task.style.display = title.includes(input) || desc.includes(input) ? "block" : "none";
  });
};
