import { saveMessage } from "./actions"

export default function Home() {
  async function handleSubmit(formData) {
    "use server"
    await saveMessage(formData.get("msg"))
  }

  return (
    <main>
      <h1>Hello Hazzaq Style!</h1>
      <form action={handleSubmit}>
        <input name="msg" placeholder="Tulis mesej Hazzaq Style" />
        <button type="submit">Simpan</button>
      </form>
    </main>
  )
}