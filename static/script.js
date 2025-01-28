document.addEventListener("DOMContentLoaded", function () {
  const downloadForm = document.getElementById("downloadForm");
  const urlInput = document.getElementById("urlInput");
  const statusMessage = document.getElementById("statusMessage");
  const progressContainer = document.getElementById("progressContainer");
  const progressBar = document.getElementById("progressBar");
  const cancelButton = document.getElementById("cancelButton");
  let cancelDownload = false;

  downloadForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    const url = urlInput.value.trim();
    cancelDownload = false;

    // Réinitialisation des messages et de la barre de progression
    statusMessage.textContent = "";
    statusMessage.style.color = "black";
    progressContainer.style.display = "none";
    progressBar.style.width = "0%";

    // Validation de l'URL
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      statusMessage.textContent = "Veuillez entrer une URL valide.";
      statusMessage.style.color = "red";
      return;
    }

    // Afficher le conteneur de progression
    progressContainer.style.display = "block";
    setTimeout(() => {
      progressBar.style.width = "10%";
    }, 100);

    statusMessage.textContent = "Téléchargement en cours...";
    statusMessage.style.color = "black";

    let taskId = null;

    // Lancer le téléchargement
    try {
      const downloadResponse = await fetch("/download", {
        method: "POST",
        body: new URLSearchParams({ url }),
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      const downloadResult = await downloadResponse.json();

      // Afficher un message d'erreur générique en cas d'échec
      if (downloadResult.status !== "success") {
        statusMessage.textContent =
          "Une erreur est survenue. Veuillez vérifier l'URL et réessayer.";
        statusMessage.style.color = "red";
        progressContainer.style.display = "none";
        return;
      }

      taskId = downloadResult.task_id;
    } catch (error) {
      statusMessage.textContent =
        "Une erreur est survenue pendant le téléchargement. Veuillez réessayer.";
      statusMessage.style.color = "red";
      progressContainer.style.display = "none";
      return;
    }

    // Suivi de la progression
    const checkStatusInterval = setInterval(async () => {
      if (cancelDownload) {
        clearInterval(checkStatusInterval);
        return;
      }

      try {
        const statusResponse = await fetch(`/download-status/${taskId}`);
        const statusResult = await statusResponse.json();

        if (statusResult.status === "completed") {
          clearInterval(checkStatusInterval);
          progressBar.style.width = "100%";
          statusMessage.textContent = "Téléchargement terminé avec succès! 🎉";
          statusMessage.style.color = "green";
        } else if (statusResult.status === "error") {
          clearInterval(checkStatusInterval);
          progressBar.style.width = "0%";
          statusMessage.textContent =
            "Une erreur est survenue lors du téléchargement. Veuillez réessayer.";
          statusMessage.style.color = "red";
        } else if (statusResult.status === "downloading") {
          progressBar.style.width = statusResult.progress + "%";
          statusMessage.textContent = `Téléchargement en cours... (${statusResult.progress}%)`;
        }
      } catch (error) {
        clearInterval(checkStatusInterval);
        statusMessage.textContent =
          "Une erreur est survenue lors du suivi de la progression.";
        statusMessage.style.color = "red";
        progressBar.style.width = "0%";
      }
    }, 1000);

    // Gestion de l'annulation du téléchargement
    cancelButton.addEventListener("click", () => {
      cancelDownload = true;
      clearInterval(checkStatusInterval);
      statusMessage.textContent = "Téléchargement annulé.";
      statusMessage.style.color = "orange";
      progressBar.style.width = "0%";
    });
  });
});
