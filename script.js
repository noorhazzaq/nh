document.getElementById("dataForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = {
    name: document.getElementById("name").value,
    message: document.getElementById("message").value
  };

  // Panggil API backend
  const response = await fetch("/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  const result = await response.json();
  document.getElementById("output").innerText = "Data disimpan: " + JSON.stringify(result);
});