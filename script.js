// REAL SUPABASE CREDENTIALS - These are your actual production keys
const supabaseUrl = 'https://qtkqsehnmtnzjfhhqhcz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0a3FzZWhubXRuempmaGhxaGN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyOTUwODMsImV4cCI6MjA4NTg3MTA4M30.ddX2CI9nKVQFxdlDWESoELDAyH0Me_Bq0vmrjl1QQxE';

// Initialize Supabase client with your real credentials
const supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);

// Display status messages
function showStatus(message, type = 'success') {
    const statusEl = document.getElementById('status');
    statusEl.innerHTML = `<div class="${type}">${message}</div>`;
    setTimeout(() => statusEl.innerHTML = '', 3000);
}

// Load notes from your database
async function loadNotes() {
    try {
        const { data, error } = await supabase
            .from('notes')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const notesList = document.getElementById('notesList');
        
        if (!data || data.length === 0) {
            notesList.innerHTML = '<p>No notes yet. Add your first note above!</p>';
            return;
        }

        const notesHtml = data.map(note => 
            `<div class="note">
                <p>${note.content}</p>
                <small>Added: ${new Date(note.created_at).toLocaleString()}</small>
            </div>`
        ).join('');
        
        notesList.innerHTML = notesHtml;
    } catch (error) {
        document.getElementById('notesList').innerHTML = 
            `<p style="color: red;">Error loading notes: ${error.message}</p>`;
        console.error('Load Error:', error);
    }
}

// Add a new note to your database
async function addNote() {
    const input = document.getElementById('noteInput');
    const content = input.value.trim();
    
    if (!content) {
        showStatus('Please enter some text first!', 'error');
        return;
    }
    
    try {
        const { error } = await supabase
            .from('notes')
            .insert([{ 
                content: content,
                created_at: new Date().toISOString()
            }]);
        
        if (error) throw error;
        
        showStatus('✅ Note added successfully to your live database!');
        input.value = '';
        loadNotes(); // Refresh the list
    } catch (error) {
        showStatus(`Error: ${error.message}`, 'error');
        console.error('Insert Error:', error);
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('Website loaded with your Supabase project:', supabaseUrl);
    loadNotes();
});