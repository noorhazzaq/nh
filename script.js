import { supabase } from './supabaseClient.js';

async function loadNotes() {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  document.getElementById('notesList').innerHTML =
    data.map(note => `<p>${note.content}</p>`).join('');
}

export async function addNote() {
  const input = document.getElementById('noteInput');
  const { error } = await supabase
    .from('notes')
    .insert([{ content: input.value }]);

  if (!error) {
    input.value = '';
    loadNotes();
  }
}

loadNotes();