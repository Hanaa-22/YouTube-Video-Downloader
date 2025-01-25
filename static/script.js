document.getElementById("downloadForm")
document.addEventListener("submit", function (event) {
    event.preventDefault();

    const url = document.getElementById("urlInput").value;
    const progressContainer = document.getElementById("progressContainer");
    const progressBar = document.getElementById("progressBar");
    const statusMessage = document.getElementById("statusMessage");

    if (!url.startsWith("http://") && !url.startsWith("https://")) {
        statusMessage.textContent = "Veuillez entrer une URL valide.";
        statusMessage.style.color = "red";
        return;
    }

    progressContainer.style.display = "block";
    progressBar.style.width = "0%";
    statusMessage.textContent = "Téléchargement en cours...";
    statusMessage.style.color = "black";

    let progress = 0;
    const simulateProgress = setInterval(() => {
        progress += 10;
        progressBar.style.width = progress + "%";
        if (progress >= 100) clearInterval(simulateProgress);
    }, 500);

    fetch("/download", {
        method: "POST",
        body: new URLSearchParams({ url }),
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
    })
        .then((response) => response.json())
        .then((data) => {
            clearInterval(simulateProgress);
            if (data.status === "success") {
                statusMessage.textContent = "Téléchargement terminé avec succès! 🎉";
                statusMessage.style.color = "green";
                progressBar.style.width = "100%";
            } else {
                statusMessage.textContent = "Erreur : " + data.message;
                statusMessage.style.color = "red";
                progressBar.style.width = "0%";
            }
        })
        .catch(() => {
            clearInterval(simulateProgress);
            statusMessage.textContent = "Une erreur est survenue, veuillez réessayer plus tard.";
            statusMessage.style.color = "red";
            progressBar.style.width = "0%";
        });
});
