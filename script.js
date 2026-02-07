const form = document.getElementById("hazzaqForm");
const dataList = document.getElementById("dataList");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("name").value;
  const message = document.getElementById("message").value;

  await fetch("/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, message })
  });

  loadData();
});

async function loadData() {
  const res = await fetch("/all");
  const data = await res.json();
  dataList.innerHTML = "";
  data.forEach(item => {
    const li = document.createElement("li");
    li.textContent = `${item.name}: ${item.message}`;
    dataList.appendChild(li);
  });
}

loadData();