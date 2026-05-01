document.addEventListener("DOMContentLoaded", () => {
  const examForm = document.getElementById("examForm");
  const timerDisplay = document.getElementById("timerDisplay");

  const examId = document.getElementById("examId").value;
  const candidateId = document.getElementById("candidateId").value;
  let durationInMinutes = parseInt(
    document.getElementById("examDuration").value,
  );

  // Convert duration to seconds
  let timeRemaining = durationInMinutes * 60;

  // Connect to Socket.io
  const socket = io();

  socket.emit("joinExam", { examId, candidateId });

  socket.on("forceSubmit", (data) => {
    alert(data.message);
    submitExamData();
  });

  // Start Timer
  const timerInterval = setInterval(() => {
    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      timerDisplay.innerText = "00:00";

      socket.emit("timeUp", { examId, candidateId });
    } else {
      timeRemaining--;
      let minutes = Math.floor(timeRemaining / 60);
      let seconds = timeRemaining % 60;

      minutes = minutes < 10 ? "0" + minutes : minutes;
      seconds = seconds < 10 ? "0" + seconds : seconds;

      timerDisplay.innerText = `${minutes}:${seconds}`;
    }
  }, 1000);

  examForm.addEventListener("submit", (e) => {
    e.preventDefault();
    clearInterval(timerInterval);
    submitExamData();
  });

  function submitExamData() {
    const formData = new FormData(examForm);
    const answers = [];

    for (let [key, value] of formData.entries()) {
      if (key.startsWith("question_")) {
        answers.push({
          questionId: key.split("_")[1],
          selectedOption: value,
        });
      }
    }

    fetch("/api/candidate/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ examId, answers }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          alert("Exam submitted successfully!");
          window.location.href = "/student/dashboard"; // Redirect to dashboard
        } else {
          alert("Error submitting exam: " + data.message);
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        alert("Something went wrong during submission.");
      });
  }
});
